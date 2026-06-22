// app/api/v1/scope-detector/analyze/route.ts
// Analyze content for scope changes using AI

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getScopeDetectionSystemPrompt,
  buildScopeAnalysisPrompt,
  SCOPE_EXPANSION_PATTERNS,
} from '@/lib/prompts/scope-detector';
import type { AnalyzeScopeRequest, AnalyzeScopeResponse, ScopeChangeAlert } from '@/lib/types/scope';

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
 * POST /api/v1/scope-detector/analyze
 * Analyze content for scope changes
 */
export async function POST(request: NextRequest) {
  const serverSupabase = getServerSupabase();
  try {
    const body: AnalyzeScopeRequest = await request.json();

    // Validate required fields
    if (!body.organizationId || !body.projectId || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Pre-filter with keyword patterns
    const hasExpansionIndicators = checkForExpansionPatterns(body.content);

    if (!hasExpansionIndicators) {
      // No obvious scope changes, skip AI analysis
      return NextResponse.json({
        success: true,
        alerts: [],
        riskAssessment: null,
      });
    }

    // Fetch project context
    const { data: project, error: projectError } = await serverSupabase
      .from('projects')
      .select('name, description, budget, timeline')
      .eq('id', body.projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch client info
    const { data: projectData } = await serverSupabase
      .from('projects')
      .select('*, clients(name)')
      .eq('id', body.projectId)
      .single();

    const clientName = (projectData as any)?.clients?.name || 'Unknown';

    // Fetch scope tracking
    const { data: scopeTracking } = await serverSupabase
      .from('scope_tracking')
      .select('*')
      .eq('project_id', body.projectId)
      .single();

    // Call Gemini for analysis
    const analysisResult = await analyzeWithGemini(
      body.content,
      {
        projectName: project.name,
        clientName,
        originalScope: scopeTracking?.original_scope || project.description,
        originalBudget: scopeTracking?.original_budget || project.budget || 0,
        originalTimeline: scopeTracking?.original_timeline || project.timeline || 'TBD',
      }
    );

    // Save alerts to database
    const alerts = await saveAlerts(
      serverSupabase,
      body.organizationId,
      body.projectId,
      analysisResult.scopeChangesDetected
    );

    // Update scope tracking
    if (alerts.length > 0) {
      await updateScopeTracking(serverSupabase, body.projectId, alerts);
    }

    // Log AI usage
    await logAIUsage(
      serverSupabase,
      body.organizationId,
      analysisResult.tokensUsed,
      analysisResult.costUSD
    );

    const response: AnalyzeScopeResponse = {
      success: true,
      alerts,
      riskAssessment: undefined,
      suggestedChangeOrder: undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Scope analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

/**
 * Check for expansion patterns before calling AI
 */
function checkForExpansionPatterns(content: string): boolean {
  return SCOPE_EXPANSION_PATTERNS.some((pattern) =>
    pattern.pattern.test(content)
  );
}

/**
 * Analyze content using Gemini
 */
async function analyzeWithGemini(
  content: string,
  projectContext: any
) {
  const model = gemini.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: getScopeDetectionSystemPrompt(),
  });

  const prompt = buildScopeAnalysisPrompt(content, projectContext);

  const response = await model.generateContent(prompt);
  const analysisText = response.response.text();

  // Parse response
  const analysisData = JSON.parse(analysisText);

  // Track tokens
  const tokensUsed = Math.ceil((prompt.length + analysisText.length) / 4);
  const costUSD = (tokensUsed * 0.075) / 1000000; // Gemini pricing

  return {
    ...analysisData,
    tokensUsed,
    costUSD,
  };
}

/**
 * Save detected alerts to database
 */
async function saveAlerts(
  serverSupabase: any,
  organizationId: string,
  projectId: string,
  detectedChanges: any[]
) {
  // Get or create scope tracking
  let { data: scopeTracking } = await serverSupabase
    .from('scope_tracking')
    .select('id')
    .eq('project_id', projectId)
    .single();

  if (!scopeTracking) {
    const { data: project } = await serverSupabase
      .from('projects')
      .select('description, budget, timeline')
      .eq('id', projectId)
      .single();

    const { data: newTracking } = await serverSupabase
      .from('scope_tracking')
      .insert({
        project_id: projectId,
        organization_id: organizationId,
        original_scope: project?.description || 'TBD',
        original_budget: project?.budget || 0,
        original_timeline: project?.timeline || 'TBD',
      })
      .select()
      .single();

    scopeTracking = newTracking;
  }

  if (!scopeTracking) {
    throw new Error('Failed to get or create scope tracking');
  }

  // Insert alerts
  const alertsToInsert = detectedChanges.map((change) => ({
    project_id: projectId,
    organization_id: organizationId,
    scope_tracking_id: scopeTracking!.id,
    change_type: change.changeType,
    severity: change.severity,
    status: 'open',
    description: change.description,
    original_requirement: change.originalRequirement,
    new_requirement: change.newRequirement,
    financial_impact_min: change.financialImpact?.min,
    financial_impact_max: change.financialImpact?.max,
    timeline_impact: change.timelineImpact,
    effort_impact: change.effortImpact,
    confidence_score: change.confidenceScore,
    evidence_quote: change.evidenceQuote,
    source: 'manual',
    risk_score: calculateRiskScore(change),
    recommended_action: change.recommendedAction,
    client_sentiment: change.clientSentiment,
    communication_needed: change.communicationNeeded,
  }));

  const { data: alerts, error } = await serverSupabase
    .from('scope_change_alerts')
    .insert(alertsToInsert)
    .select();

  if (error) {
    console.error('Insert alerts error:', error);
  }

  return alerts || [];
}

/**
 * Calculate risk score from alert data
 */
function calculateRiskScore(change: any): number {
  let score = 0;

  // Base on severity
  const severityScores: Record<string, number> = {
    low: 20,
    medium: 50,
    high: 75,
    critical: 100,
  };
  score += severityScores[change.severity as string] || 50;

  // Add confidence impact
  score = (score * change.confidenceScore) || score;

  // Adjust for financial impact
  if (change.financialImpact?.max > 5000) {
    score += 15;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Update scope tracking with new alert counts
 */
async function updateScopeTracking(serverSupabase: any, projectId: string, alerts: any[]) {
  const totalImpact = alerts.reduce(
    (sum, alert) => sum + (alert.financial_impact_max || 0),
    0
  );

  await serverSupabase
    .from('scope_tracking')
    .update({
      total_alerts: alerts.length,
      open_alerts: alerts.filter((a) => a.status === 'open').length,
      total_financial_impact: totalImpact,
      updated_at: new Date().toISOString(),
    })
    .eq('project_id', projectId);
}

/**
 * Log AI usage for billing
 */
async function logAIUsage(
  serverSupabase: any,
  organizationId: string,
  tokensUsed: number,
  costUSD: number
) {
  await serverSupabase
    .from('ai_usage_log')
    .insert({
      organization_id: organizationId,
      feature: 'scope_detector',
      tokens_input: tokensUsed,
      tokens_output: 0,
      cost_usd: costUSD,
      model: 'gemini-2.5-flash',
    });
}
