// app/api/v1/meetings/[id]/route.ts
// Get a specific meeting and its summary

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { GetMeetingSummaryResponse } from '@/lib/types/meetings';

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

/**
 * GET /api/v1/meetings/{id}
 * Retrieve a specific meeting with summary and insights
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meetingId = id;
    const serverSupabase = getServerSupabase();

    // Validate ID format
    if (!meetingId || !/^[0-9a-f-]{36}$/.test(meetingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    // Fetch meeting
    const { data: meeting, error: meetingError } = await serverSupabase
      .from('meetings')
      .select(`
        *,
        action_items (*),
        meeting_participants (*),
        meeting_insights (*)
      `)
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json(
        { success: false, error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Extract action items from related records
    const actionItems = meeting.action_items || [];

    // Build response
    const response: GetMeetingSummaryResponse = {
      success: true,
      meeting: {
        ...meeting,
        summary: meeting.summary || {},
        insights: meeting.meeting_insights?.[0] || {},
        participants: meeting.meeting_participants || [],
        actionItems: actionItems,
      },
      actionItems,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get meeting error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/meetings/{id}
 * Update a meeting (e.g., add notes, update status)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meetingId = id;
    const serverSupabase = getServerSupabase();
    const body = await request.json();

    // Validate ID
    if (!meetingId || !/^[0-9a-f-]{36}$/.test(meetingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    // Update meeting
    const { data: meeting, error: updateError } = await serverSupabase
      .from('meetings')
      .update({
        title: body.title,
        description: body.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update meeting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error('Update meeting error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/meetings/{id}
 * Delete a meeting
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meetingId = id;
    const serverSupabase = getServerSupabase();

    // Validate ID
    if (!meetingId || !/^[0-9a-f-]{36}$/.test(meetingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    // Delete meeting (cascades to related records)
    const { error: deleteError } = await serverSupabase
      .from('meetings')
      .delete()
      .eq('id', meetingId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete meeting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Meeting deleted' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
