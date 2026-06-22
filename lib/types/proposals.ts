/**
 * AI Proposal Generator - TypeScript Types
 */

// ═══════════════════════════════════════════════════════════════════════════
// Proposal Form Input
// ═══════════════════════════════════════════════════════════════════════════

export interface ProposalFormInput {
  client_name: string;
  company_name: string;
  industry: string;
  service_type: string;
  project_description: string;
  goals: string;
  budget: number;
  timeline: string;
  additional_notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI Generated Proposal Content
// ═══════════════════════════════════════════════════════════════════════════

export interface ProposalContent {
  executiveSummary: string;
  overview: string;
  scope: string;
  deliverables: string[];
  timeline: string;
  milestones: Array<{
    name: string;
    description: string;
    dueDate: string;
  }>;
  pricing: {
    breakdown: string;
    total: number;
    currency: string;
  };
  paymentTerms: string;
  assumptions: string;
  nextSteps: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Proposal Database Record
// ═══════════════════════════════════════════════════════════════════════════

export interface Proposal {
  id: string;
  user_id: string;
  client_name: string;
  company_name: string;
  industry: string;
  service_type: string;
  project_description: string;
  goals: string;
  budget: number | null;
  timeline: string;
  additional_notes: string | null;
  proposal_content: ProposalContent;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Proposal Version
// ═══════════════════════════════════════════════════════════════════════════

export interface ProposalVersion {
  id: string;
  proposal_id: string;
  version_number: number;
  proposal_content: ProposalContent;
  change_summary: string | null;
  created_at: string;
  created_by: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Proposal History
// ═══════════════════════════════════════════════════════════════════════════

export interface ProposalHistory {
  id: string;
  proposal_id: string;
  action: 'created' | 'updated' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  details: Record<string, unknown>;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// API Request/Response
// ═══════════════════════════════════════════════════════════════════════════

export interface GenerateProposalRequest {
  client_name: string;
  company_name: string;
  industry: string;
  service_type: string;
  project_description: string;
  goals: string;
  budget?: number;
  timeline: string;
  additional_notes?: string;
}

export interface GenerateProposalResponse {
  success: boolean;
  data?: {
    proposal_id: string;
    proposal_content: ProposalContent;
  };
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Errors
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationError {
  field: keyof ProposalFormInput;
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// List Response
// ═══════════════════════════════════════════════════════════════════════════

export interface ProposalsListResponse {
  success: boolean;
  data?: Proposal[];
  error?: string;
}

export interface SaveProposalResponse {
  success: boolean;
  proposal_id?: string;
  error?: string;
}
