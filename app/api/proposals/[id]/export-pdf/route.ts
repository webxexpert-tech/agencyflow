/**
 * API Route: Export proposal as PDF
 * POST /api/proposals/[id]/export-pdf
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

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !proposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const content = proposal.proposal_content;

    // Generate HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Proposal - ${proposal.company_name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
    }
    .header {
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #1a1a1a;
    }
    .client-info {
      font-size: 14px;
      color: #666;
      margin-top: 0.5rem;
    }
    .date {
      font-size: 12px;
      color: #999;
      margin-top: 0.5rem;
    }
    .section {
      margin-bottom: 2rem;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #4f46e5;
      margin-bottom: 1rem;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    .section-content {
      font-size: 14px;
      line-height: 1.8;
      color: #1a1a1a;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .deliverables-list {
      list-style: none;
      padding-left: 0;
    }
    .deliverables-list li {
      padding: 0.5rem 0;
      padding-left: 2rem;
      position: relative;
      font-size: 14px;
    }
    .deliverables-list li:before {
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
      page-break-inside: avoid;
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
    .pricing-breakdown {
      font-size: 14px;
      line-height: 1.8;
      color: #1a1a1a;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .pricing-total {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid #e5e7eb;
      font-size: 16px;
      font-weight: bold;
      color: #4f46e5;
    }
    .footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    @media print {
      body {
        padding: 0.25in;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">Proposal for ${proposal.company_name}</div>
    <div class="client-info">Client: ${proposal.client_name}</div>
    <div class="date">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="section-content">${content.executiveSummary}</div>
  </div>

  <div class="section">
    <div class="section-title">Project Overview</div>
    <div class="section-content">${content.overview}</div>
  </div>

  <div class="section">
    <div class="section-title">Scope of Work</div>
    <div class="section-content">${content.scope}</div>
  </div>

  <div class="section">
    <div class="section-title">Deliverables</div>
    <ul class="deliverables-list">
      ${content.deliverables.map((d: string) => `<li>${d}</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <div class="section-title">Timeline</div>
    <div class="section-content">${content.timeline}</div>
  </div>

  <div class="section">
    <div class="section-title">Milestones</div>
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
    <div class="section-title">Pricing</div>
    <div class="pricing-box">
      <div class="pricing-breakdown">${content.pricing.breakdown}</div>
      <div class="pricing-total">${content.pricing.currency} ${content.pricing.total.toLocaleString()}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Payment Terms</div>
    <div class="section-content">${content.paymentTerms}</div>
  </div>

  <div class="section">
    <div class="section-title">Project Assumptions</div>
    <div class="section-content">${content.assumptions}</div>
  </div>

  <div class="section">
    <div class="section-title">Next Steps</div>
    <div class="section-content">${content.nextSteps}</div>
  </div>

  <div class="footer">
    <p>This proposal is confidential and intended for ${proposal.company_name} only.</p>
  </div>
</body>
</html>
    `;

    // Return as blob for download
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="Proposal-${proposal.company_name}-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
