// app/api/v1/meetings/route.ts
// List all meetings for an organization

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { MeetingListResponse } from '@/lib/types/meetings';

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
 * GET /api/v1/meetings
 * List meetings for an organization with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = serverSupabase
      .from('meetings')
      .select('*, projects(name), clients(name)', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: meetings, count, error } = await query;

    if (error) {
      console.error('List meetings error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch meetings' },
        { status: 500 }
      );
    }

    const response: MeetingListResponse = {
      success: true,
      meetings: meetings || [],
      total: count || 0,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('List meetings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/meetings
 * Create a new meeting (shorthand for upload)
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();
    const body = await request.json();

    if (!body.organizationId || !body.projectId || !body.title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: meeting, error } = await serverSupabase
      .from('meetings')
      .insert({
        organization_id: body.organizationId,
        project_id: body.projectId,
        client_id: body.clientId || null,
        title: body.title,
        description: body.description || null,
        meeting_date: body.meetingDate || new Date().toISOString(),
        duration: body.duration || 60,
        source: body.source || 'manual',
        status: 'completed',
        transcript: body.transcript || null,
        summary: body.summary || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create meeting error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create meeting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (error) {
    console.error('Create meeting error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
