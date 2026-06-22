// app/api/v1/meetings/upload/route.ts
// Upload and process meeting recordings/transcripts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { MeetingUploadRequest, UploadMeetingResponse } from '@/lib/types/meetings';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

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
 * POST /api/v1/meetings/upload
 * Upload a meeting recording or transcript for processing
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: MeetingUploadRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.organizationId || !body.projectId || !body.source) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, organizationId, projectId, source',
        },
        { status: 400 }
      );
    }

    // Create meeting record in database
    const meetingId = uuidv4();
    const now = new Date().toISOString();

    const { data: meeting, error: createError } = await serverSupabase
      .from('meetings')
      .insert({
        id: meetingId,
        organization_id: body.organizationId,
        project_id: body.projectId,
        client_id: body.clientId || null,
        title: body.title,
        description: body.description || null,
        meeting_date: body.meetingDate,
        duration: body.duration,
        source: body.source,
        status: 'uploading',
        transcript: body.transcript || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (createError) {
      console.error('Meeting creation error:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create meeting record' },
        { status: 500 }
      );
    }

    // Create processing job
    const jobId = uuidv4();
    const { error: jobError } = await serverSupabase
      .from('meeting_processing_jobs')
      .insert({
        id: jobId,
        meeting_id: meetingId,
        organization_id: body.organizationId,
        status: 'queued',
        stage: 'upload',
        progress: 10,
      });

    if (jobError) {
      console.error('Job creation error:', jobError);
    }

    // If file provided, upload to storage
    if (body.fileUrl) {
      const fileName = `${meetingId}-${Date.now()}`;
      const { error: uploadError } = await serverSupabase.storage
        .from('meetings')
        .upload(fileName, body.fileUrl);

      if (uploadError) {
        console.warn('File upload warning:', uploadError);
      }
    }

    // Queue async processing
    // In production, this would queue a job to Bull Redis or similar
    await queueMeetingProcessing(meetingId, body.organizationId);

    const response: UploadMeetingResponse = {
      success: true,
      meeting,
      jobId,
      processingStatus: 'queued',
      estimatedProcessingTime: 300, // 5 minutes
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Meeting upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Queue meeting for async processing
 * In production, this would use Bull Redis, Google Cloud Tasks, etc.
 */
async function queueMeetingProcessing(meetingId: string, organizationId: string) {
  // TODO: Implement job queuing
  // For now, we'll just log it
  console.log(`Queued meeting ${meetingId} for processing`);

  // Simulate async processing (in production, this would be in a background job)
  // setTimeout(() => processMeeting(meetingId), 5000);
}
