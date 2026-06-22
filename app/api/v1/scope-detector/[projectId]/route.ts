// app/api/v1/scope-detector/[projectId]/route.ts
// Get scope status and all alerts for a project

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { GetScopeStatusResponse } from '@/lib/types/scope';

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
 * GET /api/v1/scope-detector/{projectId}
 * Get scope status and all alerts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const serverSupabase = getServerSupabase();

    // Fetch scope tracking
    const { data: tracking, error: trackingError } = await serverSupabase
      .from('scope_tracking')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (trackingError) {
      return NextResponse.json(
        { success: false, error: 'Scope tracking not found' },
        { status: 404 }
      );
    }

    // Fetch all alerts
    const { data: alerts, error: alertsError } = await serverSupabase
      .from('scope_change_alerts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (alertsError) {
      console.error('Alerts error:', alertsError);
    }

    // Calculate total financial risk
    const totalRisk = alerts?.reduce((sum, alert) => {
      const max = alert.financial_impact_max || 0;
      return sum + max;
    }, 0) || 0;

    // Get recommended actions
    const criticalAlerts = alerts?.filter((a) => a.severity === 'critical') || [];
    const recommendedActions = criticalAlerts.map(
      (alert) => alert.recommended_action
    ).filter(Boolean);

    const response: GetScopeStatusResponse = {
      success: true,
      tracking,
      alerts: alerts || [],
      totalFinancialRisk: totalRisk,
      recommendedActions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get scope status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/scope-detector/{projectId}
 * Update scope tracking
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const serverSupabase = getServerSupabase();
    const body = await request.json();

    const { data: updated, error } = await serverSupabase
      .from('scope_tracking')
      .update({
        current_scope: body.currentScope,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tracking: updated });
  } catch (error) {
    console.error('Update scope error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
