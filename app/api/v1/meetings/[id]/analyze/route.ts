// app/api/v1/meetings/[id]/analyze/route.ts
// Trigger AI analysis of meeting transcript

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getMeetingAnalysisSystemPrompt,
  buildMeetingSummaryPrompt,
  buildActionItemExtractionPrompt,
  buildScopeChangeDetectionPrompt,
  buildSentimentAnalysisPrompt,
} from '@/lib/prompts/meeting-analyzer';
import type { Meeting, MeetingSummary, ActionItem } from '@/lib/types/meetings';

const getServerSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );
};

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

/**
 * POST /api/v1/meetings/{id}/analyze
 * Trigger AI analysis of meeting using Gemini
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let meetingId: string = '';
  let serverSupabase: any = null;
  
  try {
    const { id } = await params;
    meetingId = id;
    serverSupabase = getServerSupabase();

    // Fetch meeting
    const { data: meeting, error: fetchError } = await serverSupabase
      .from('meetings')
      .select(
        `
        *,
        projects(name),
        clients(name, email)
      `
      )
      .eq('id', meetingId)
      .single();

    if (fetchError || !meeting) {
      return NextResponse.json(
        { success: false, error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (!meeting.transcript) {
      return NextResponse.json(
        { success: false, error: 'No transcript available for analysis' },
        { status: 400 }
      );
    }

    // Update status
    await serverSupabase
      .from('meetings')
      .update({ status: 'analyzing' })
      .eq('id', meetingId);

    // Call Gemini for analysis
    const analysisResults = await performMeetingAnalysis(meeting as any);

    // Save results to database
    const { data: updatedMeeting, error: updateError } = await serverSupabase
      .from('meetings')
      .update({
        summary: analysisResults.summary,
        status: 'completed',
        processed_at: new Date().toISOString(),
        ai_tokens_used: analysisResults.tokensUsed,
        ai_cost_usd: analysisResults.costUSD,
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Save action items
    if (analysisResults.actionItems && analysisResults.actionItems.length > 0) {
      await saveActionItems(serverSupabase, meetingId, meeting.organization_id, analysisResults.actionItems);
    }

    // Save insights
    if (analysisResults.insights) {
      await serverSupabase
        .from('meeting_insights')
        .insert({
          meeting_id: meetingId,
          organization_id: meeting.organization_id,
          main_topics: analysisResults.insights.mainTopics || [],
          client_needs_identified: analysisResults.insights.clientNeeds || [],
          scope_changes: analysisResults.insights.scopeChanges || [],
          opportunities_identified: analysisResults.insights.opportunities || [],
          concerns_raised: analysisResults.insights.concerns || [],
        });
    }

    // Log AI usage
    await serverSupabase
      .from('ai_usage_log')
      .insert({
        organization_id: meeting.organization_id,
        feature: 'meeting_summary',
        tokens_input: analysisResults.tokensUsed,
        tokens_output: 0,
        cost_usd: analysisResults.costUSD,
        model: 'gemini-2.5-flash',
        related_id: meetingId,
        related_type: 'meeting',
      });

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
      summary: analysisResults.summary,
      actionItems: analysisResults.actionItems,
    });
  } catch (error) {
    console.error('Analysis error:', error);

    // Update meeting status to failed
    if (serverSupabase && meetingId) {
      await serverSupabase
        .from('meetings')
        .update({ status: 'failed' })
        .eq('id', meetingId);
    }

    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

/**
 * Perform AI analysis using Gemini
 */
async function performMeetingAnalysis(meeting: any) {
  const model = gemini.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: getMeetingAnalysisSystemPrompt(),
  });

  let totalTokensUsed = 0;
  let totalCost = 0;

  // Step 1: Generate summary
  const summaryPrompt = buildMeetingSummaryPrompt(meeting.transcript, {
    meetingDate: meeting.meeting_date,
    duration: meeting.duration,
    attendees: meeting.participants?.map((p: any) => p.email) || [],
    projectName: (meeting as any).projects?.name || 'Unknown',
    clientName: (meeting as any).clients?.name || 'Unknown',
  });

  const summaryResponse = await model.generateContent(summaryPrompt);
  const summaryText = summaryResponse.response.text();
  const summaryData = JSON.parse(summaryText);

  // Track tokens (rough estimate)
  totalTokensUsed += summaryPrompt.length / 4 + summaryText.length / 4;

  // Step 2: Extract action items
  const actionItemPrompt = buildActionItemExtractionPrompt(
    meeting.transcript,
    meeting.meeting_date,
    meeting.participants?.map((p: any) => p.email) || []
  );

  const actionItemResponse = await model.generateContent(actionItemPrompt);
  const actionItemText = actionItemResponse.response.text();
  const actionItemsData = JSON.parse(actionItemText);

  totalTokensUsed += actionItemPrompt.length / 4 + actionItemText.length / 4;

  // Step 3: Detect scope changes
  const scopePrompt = buildScopeChangeDetectionPrompt(
    meeting.transcript,
    'Project Scope',
    10000,
    '3 months'
  );

  const scopeResponse = await model.generateContent(scopePrompt);
  const scopeText = scopeResponse.response.text();
  const scopeData = JSON.parse(scopeText);

  totalTokensUsed += scopePrompt.length / 4 + scopeText.length / 4;

  // Calculate cost (Gemini pricing: $0.075 per 1M input tokens, $0.30 per 1M output tokens)
  totalCost = (totalTokensUsed * 0.075) / 1000000;

  return {
    summary: summaryData,
    actionItems: actionItemsData,
    insights: {
      mainTopics: summaryData.topics || [],
      clientNeeds: [],
      scopeChanges: scopeData.scopeChangesDetected || [],
      opportunities: [],
      concerns: summaryData.risks?.map((r: any) => r.description) || [],
    },
    tokensUsed: Math.ceil(totalTokensUsed),
    costUSD: totalCost,
  };
}

/**
 * Save action items to database
 */
async function saveActionItems(
  serverSupabase: any,
  meetingId: string,
  organizationId: string,
  actionItems: ActionItem[]
) {
  const itemsToInsert = actionItems.map((item) => ({
    meeting_id: meetingId,
    organization_id: organizationId,
    description: item.description,
    assignee_email: item.assignee,
    due_date: item.dueDate,
    priority: item.priority,
    status: 'open',
  }));

  const { error } = await serverSupabase
    .from('action_items')
    .insert(itemsToInsert);

  if (error) {
    console.error('Action items insert error:', error);
  }
}
