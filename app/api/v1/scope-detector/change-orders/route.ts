// app/api/v1/scope-detector/change-orders/route.ts
// Create and manage change orders

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { CreateChangeOrderResponse, SendChangeOrderResponse } from '@/lib/types/scope';

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
 * POST /api/v1/scope-detector/change-orders
 * Create a new change order from an alert
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();
    const body = await request.json();

    if (!body.organizationId || !body.projectId || !body.alertId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch alert
    const { data: alert, error: alertError } = await serverSupabase
      .from('scope_change_alerts')
      .select('*')
      .eq('id', body.alertId)
      .single();

    if (alertError || !alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Generate change order number
    const { data: lastCO } = await serverSupabase
      .from('change_orders')
      .select('number')
      .eq('project_id', body.projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastCO && lastCO.length > 0) {
      const lastNum = parseInt(lastCO[0].number.split('-')[1]);
      nextNumber = lastNum + 1;
    }
    const coNumber = `CO-${String(nextNumber).padStart(3, '0')}`;

    // Create change order
    const { data: changeOrder, error: coError } = await serverSupabase
      .from('change_orders')
      .insert({
        organization_id: body.organizationId,
        project_id: body.projectId,
        alert_id: body.alertId,
        number: coNumber,
        title: `${alert.change_type}: ${alert.description.substring(0, 50)}`,
        description: alert.description,
        reason: alert.reason || 'Client requested scope change',
        scope_additions: body.scopeAdditions || [alert.new_requirement],
        additional_cost: alert.financial_impact_max || 0,
        cost_reason: 'Additional work required',
        additional_days: body.additionalDays || 3,
        hours_added: body.hoursAdded || 8,
        approval_status: 'draft',
      })
      .select()
      .single();

    if (coError) {
      console.error('Change order creation error:', coError);
      return NextResponse.json(
        { success: false, error: 'Failed to create change order' },
        { status: 500 }
      );
    }

    // Generate preview HTML
    const previewHtml = generateChangeOrderHTML(changeOrder);

    const response: CreateChangeOrderResponse = {
      success: true,
      changeOrder,
      previewHtml,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Create change order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/scope-detector/change-orders/{id}
 * Update a change order
 */
export async function PUT(request: NextRequest) {
  try {
    const serverSupabase = getServerSupabase();
    const body = await request.json();

    const { data: updated, error } = await serverSupabase
      .from('change_orders')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, changeOrder: updated });
  } catch (error) {
    console.error('Update change order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/scope-detector/change-orders/{id}/send
 * Send change order to client
 */
export async function POST_SEND(request: NextRequest, params: any) {
  try {
    const serverSupabase = getServerSupabase();
    const changeOrderId = params.id;
    const body = await request.json();

    // Update status to sent
    const { data: updated, error } = await serverSupabase
      .from('change_orders')
      .update({
        approval_status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', changeOrderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to send' },
        { status: 500 }
      );
    }

    // TODO: Send email to client with change order

    const response: SendChangeOrderResponse = {
      success: true,
      changeOrderId,
      sentAt: updated.sent_at,
      clientEmail: body.clientEmail,
      trackingId: updated.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Send change order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML preview of change order
 */
function generateChangeOrderHTML(changeOrder: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { background: #0066cc; color: white; padding: 20px; }
    .section { margin: 20px 0; padding: 15px; border-left: 4px solid #0066cc; }
    .amount { font-size: 24px; font-weight: bold; color: #0066cc; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CHANGE ORDER</h1>
    <p>${changeOrder.number}</p>
  </div>
  
  <div class="section">
    <h2>Summary</h2>
    <p><strong>Title:</strong> ${changeOrder.title}</p>
    <p><strong>Description:</strong> ${changeOrder.description}</p>
  </div>
  
  <div class="section">
    <h2>Scope Changes</h2>
    <h3>Additions:</h3>
    <ul>
      ${(changeOrder.scope_additions || []).map((add: string) => `<li>${add}</li>`).join('')}
    </ul>
  </div>
  
  <div class="section">
    <h2>Financial Impact</h2>
    <p><strong>Additional Cost:</strong></p>
    <p class="amount">\$${changeOrder.additional_cost.toFixed(2)}</p>
    <p>${changeOrder.cost_reason}</p>
  </div>
  
  <div class="section">
    <h2>Timeline Impact</h2>
    <p><strong>Additional Days:</strong> ${changeOrder.additional_days} days</p>
    <p><strong>New End Date:</strong> ${changeOrder.new_end_date || 'TBD'}</p>
  </div>
  
  <div class="section">
    <h2>Effort Breakdown</h2>
    <p><strong>Hours Added:</strong> ${changeOrder.hours_added} hours</p>
    <h3>Resources Needed:</h3>
    <ul>
      ${(changeOrder.resources_needed || []).map((res: string) => `<li>${res}</li>`).join('')}
    </ul>
  </div>
  
  <div class="section" style="background: #f9f9f9;">
    <p><strong>Status:</strong> ${changeOrder.approval_status}</p>
    <p style="font-size: 12px; color: #666;">Created: ${new Date(changeOrder.created_at).toLocaleDateString()}</p>
  </div>
</body>
</html>
  `;
}
