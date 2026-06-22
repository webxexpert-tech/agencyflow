/**
 * API Route: Send proposal via email
 * POST /api/proposals/[id]/send-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clientEmail, subject, message } = body;

    if (!clientEmail) {
      return NextResponse.json(
        { success: false, error: 'Client email is required' },
        { status: 400 }
      );
    }

    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const content = proposal.proposal_content;

    // Generate HTML email body
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
    }
    .container {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 0.5rem 0 0;
      opacity: 0.9;
    }
    .content {
      padding: 2rem;
    }
    .section {
      margin-bottom: 2rem;
    }
    .section h2 {
      font-size: 18px;
      color: #4f46e5;
      margin: 0 0 1rem;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    .section p {
      margin: 0 0 1rem;
      white-space: pre-wrap;
    }
    .deliverables {
      list-style: none;
      padding: 0;
    }
    .deliverables li {
      padding: 0.5rem 0 0.5rem 2rem;
      position: relative;
    }
    .deliverables li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #4f46e5;
      font-weight: bold;
    }
    .milestone {
      background: #f9fafb;
      border-left: 4px solid #4f46e5;
      padding: 1rem;
      margin-bottom: 0.5rem;
    }
    .milestone-date {
      font-size: 12px;
      color: #4f46e5;
      font-weight: bold;
    }
    .milestone-name {
      font-size: 14px;
      font-weight: bold;
      margin-top: 0.25rem;
    }
    .milestone-description {
      font-size: 13px;
      color: #666;
      margin-top: 0.25rem;
    }
    .pricing-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1.5rem;
      margin-top: 1rem;
    }
    .pricing-total {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid #e5e7eb;
      font-size: 16px;
      font-weight: bold;
      color: #4f46e5;
    }
    .message {
      background: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .footer {
      background: #f3f4f6;
      padding: 1.5rem;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Proposal: ${proposal.company_name}</h1>
      <p>From: ${proposal.client_name}</p>
    </div>

    <div class="content">
      ${message ? `<div class="message"><p>${message}</p></div>` : ''}

      <div class="section">
        <h2>Executive Summary</h2>
        <p>${content.executiveSummary}</p>
      </div>

      <div class="section">
        <h2>Project Overview</h2>
        <p>${content.overview}</p>
      </div>

      <div class="section">
        <h2>Scope of Work</h2>
        <p>${content.scope}</p>
      </div>

      <div class="section">
        <h2>Deliverables</h2>
        <ul class="deliverables">
          ${content.deliverables.map((d: string) => `<li>${d}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <h2>Timeline</h2>
        <p>${content.timeline}</p>
      </div>

      <div class="section">
        <h2>Milestones</h2>
        ${content.milestones
          .map(
            (m: any) => `
          <div class="milestone">
            <div class="milestone-date">${m.dueDate}</div>
            <div class="milestone-name">${m.name}</div>
            <div class="milestone-description">${m.description}</div>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="section">
        <h2>Pricing</h2>
        <div class="pricing-box">
          <p>${content.pricing.breakdown}</p>
          <div class="pricing-total">${content.pricing.currency} ${content.pricing.total.toLocaleString()}</div>
        </div>
      </div>

      <div class="section">
        <h2>Payment Terms</h2>
        <p>${content.paymentTerms}</p>
      </div>

      <div class="section">
        <h2>Project Assumptions</h2>
        <p>${content.assumptions}</p>
      </div>

      <div class="section">
        <h2>Next Steps</h2>
        <p>${content.nextSteps}</p>
      </div>
    </div>

    <div class="footer">
      <p>This proposal is confidential and intended for ${proposal.company_name} only.</p>
      <p>Questions? Please reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Try to send with Resend first, fallback to console for now
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'proposals@agencyflow.app',
            to: clientEmail,
            subject: subject || `Proposal for ${proposal.company_name} — ${proposal.service_type}`,
            html: emailBody,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send email via Resend');
        }

        // Log action in database
        await supabase.from('proposal_history').insert({
          proposal_id: proposal.id,
          action: 'email_sent',
          details: { recipient: clientEmail, timestamp: new Date().toISOString() },
        });

        return NextResponse.json({
          success: true,
          message: `Proposal sent to ${clientEmail}`,
        });
      } catch (resendError) {
        console.error('Resend error:', resendError);
        return NextResponse.json(
          { success: false, error: 'Failed to send email' },
          { status: 500 }
        );
      }
    } else {
      // Fallback: Log email details and return success (for development)
      console.log('Email would be sent to:', clientEmail);
      console.log('Subject:', subject || `Proposal for ${proposal.company_name}`);
      console.log('Email body length:', emailBody.length);

      return NextResponse.json({
        success: true,
        message: `Email ready to send to ${clientEmail}. Configure RESEND_API_KEY for actual delivery.`,
        development: true,
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
