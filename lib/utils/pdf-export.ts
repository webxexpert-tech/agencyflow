/**
 * PDF Export Utility for Proposals
 * Uses html2pdf library to generate professional PDFs
 */

'use client';

import { ProposalContent } from '@/lib/types/proposals';

interface ProposalPDFData {
  client_name: string;
  company_name: string;
  proposal_content: ProposalContent;
  agencyName?: string;
  agencyLogo?: string;
  created_at?: string;
}

/**
 * Generate PDF from proposal data
 */
export const generateProposalPDF = async (data: ProposalPDFData): Promise<void> => {
  // Dynamic import to avoid SSR issues with html2pdf
  const html2pdf = (await import('html2pdf.js')).default;
  const { client_name, company_name, proposal_content, agencyName = 'AgencyFlow', created_at } = data;

  // Build HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Proposal - ${client_name}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background: #f5f5f5;
        }
        .pdf-container {
          max-width: 8.5in;
          height: 11in;
          margin: 0 auto;
          padding: 0.5in;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .agency-name {
          font-size: 24px;
          font-weight: bold;
          color: #4f46e5;
          margin-bottom: 5px;
        }
        .proposal-title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .proposal-meta {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          gap: 20px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
          border-left: 4px solid #4f46e5;
          padding-left: 12px;
          margin-bottom: 12px;
          margin-top: 20px;
        }
        .section-content {
          font-size: 11px;
          line-height: 1.6;
          color: #4b5563;
          margin-left: 16px;
        }
        .deliverables-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .deliverables-list li {
          padding: 6px 0;
          padding-left: 20px;
          position: relative;
          font-size: 11px;
        }
        .deliverables-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #4f46e5;
          font-weight: bold;
        }
        .milestone {
          background: #f3f4f6;
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .milestone-name {
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 3px;
        }
        .milestone-date {
          color: #4f46e5;
          font-weight: bold;
          margin-top: 3px;
        }
        .pricing-box {
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .pricing-total {
          font-size: 14px;
          font-weight: bold;
          color: #4f46e5;
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
          margin-top: 30px;
          font-size: 10px;
          color: #9ca3af;
          text-align: center;
        }
        .page-break {
          page-break-after: always;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 11px;
        }
        table th {
          background: #f3f4f6;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #d1d5db;
        }
        table td {
          padding: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <!-- Header -->
        <div class="header">
          <div class="agency-name">${agencyName}</div>
          <div class="proposal-title">Project Proposal</div>
          <div class="proposal-meta">
            <span><strong>Client:</strong> ${client_name}</span>
            <span><strong>Company:</strong> ${company_name}</span>
            ${created_at ? `<span><strong>Date:</strong> ${new Date(created_at).toLocaleDateString()}</span>` : ''}
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="section">
          <div class="section-title">Executive Summary</div>
          <div class="section-content">${proposal_content.executiveSummary}</div>
        </div>

        <!-- Project Overview -->
        <div class="section">
          <div class="section-title">Project Overview</div>
          <div class="section-content">${proposal_content.overview}</div>
        </div>

        <!-- Scope of Work -->
        <div class="section">
          <div class="section-title">Scope of Work</div>
          <div class="section-content">${proposal_content.scope}</div>
        </div>

        <!-- Deliverables -->
        <div class="section">
          <div class="section-title">Deliverables</div>
          <ul class="deliverables-list">
            ${proposal_content.deliverables.map((item) => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <!-- Timeline -->
        <div class="section">
          <div class="section-title">Project Timeline</div>
          <div class="section-content">${proposal_content.timeline}</div>
        </div>

        <!-- Milestones -->
        ${proposal_content.milestones.length > 0 ? `
          <div class="section">
            <div class="section-title">Key Milestones</div>
            <div class="section-content">
              ${proposal_content.milestones
                .map(
                  (m) => `
                <div class="milestone">
                  <div class="milestone-name">${m.name}</div>
                  <div>${m.description}</div>
                  <div class="milestone-date">Due: ${m.dueDate}</div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        ` : ''}

        <!-- Pricing -->
        <div class="section">
          <div class="section-title">Investment & Pricing</div>
          <div class="pricing-box">
            <div>${proposal_content.pricing.breakdown}</div>
            <div class="pricing-total" style="margin-top: 10px;">
              Total Investment: ${proposal_content.pricing.currency} ${proposal_content.pricing.total.toLocaleString()}
            </div>
          </div>
        </div>

        <!-- Payment Terms -->
        <div class="section">
          <div class="section-title">Payment Terms</div>
          <div class="section-content">${proposal_content.paymentTerms}</div>
        </div>

        <!-- Assumptions -->
        <div class="section">
          <div class="section-title">Project Assumptions</div>
          <div class="section-content">${proposal_content.assumptions}</div>
        </div>

        <!-- Next Steps -->
        <div class="section">
          <div class="section-title">Next Steps</div>
          <div class="section-content">${proposal_content.nextSteps}</div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This proposal is valid for 30 days from the date of submission.</p>
          <p>© ${new Date().getFullYear()} ${agencyName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // PDF options
  const opt = {
    margin: 10,
    filename: `${client_name}-proposal.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' as const },
  };

  // Generate PDF
  html2pdf().set(opt).from(htmlContent).save();
};

/**
 * Download proposal as PDF (alternative method)
 */
export const downloadProposalPDF = (html: string, filename: string): void => {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
