// lib/types/scope.ts
// Complete TypeScript types for AI Scope Creep Detector Feature

/**
 * SCOPE ANALYSIS REQUEST
 * Input when analyzing content for scope changes
 */
export interface ScopeAnalysisRequest {
  organizationId: string;
  projectId: string;
  clientId?: string;
  content: string; // email, note, message, etc
  contentType: ScopeContentType;
  source: ScopeSource;
  context?: {
    originalScope?: string;
    currentBudget?: number;
    currentTimeline?: string;
    serviceType?: string;
  };
}

export type ScopeContentType = 'email' | 'note' | 'message' | 'meeting_transcript' | 'slack' | 'teams';
export type ScopeSource = 'email' | 'manual' | 'slack' | 'teams' | 'meeting' | 'document';

/**
 * SCOPE CHANGE ALERT
 * Individual detected scope change
 */
export interface ScopeChangeAlert {
  id: string;
  projectId: string;
  organizationId: string;
  
  changeType: ScopeChangeType;
  severity: AlertSeverity; // low | medium | high | critical
  status: AlertStatus; // open | acknowledged | actioned | resolved | false_positive
  
  description: string; // what changed
  originalRequirement?: string; // what was originally promised
  newRequirement?: string; // what they're asking for
  
  financialImpact: {
    min?: number;
    max?: number;
    currency: string;
  };
  timelineImpact?: string; // "3 days", "1 week", etc
  effortImpact?: string; // estimate of effort
  
  confidenceScore: number; // 0-1, how confident we are
  evidenceQuote?: string; // exact quote from transcript/email
  
  source: ScopeSource;
  sourceReference?: string; // email ID, meeting ID, etc
  
  riskScore: number; // 0-100, calculated
  recommendedAction?: string;
  
  clientSentiment?: 'positive' | 'neutral' | 'negative';
  communicationNeeded: boolean;
  
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type ScopeChangeType = 
  | 'new_feature' 
  | 'requirement_expansion' 
  | 'timeline_change' 
  | 'budget_mention' 
  | 'integration_request' 
  | 'deliverable_change' 
  | 'phase_addition' 
  | 'quality_increase' 
  | 'performance_requirement' 
  | 'other';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'actioned' | 'resolved' | 'false_positive';

/**
 * SCOPE TRACKING
 * Track all scope-related activity for a project
 */
export interface ScopeTracking {
  id: string;
  projectId: string;
  organizationId: string;
  
  originalScope: string;
  originalBudget: number;
  originalTimeline: string;
  
  currentScope?: string;
  totalAlerts: number;
  openAlerts: number;
  acknowledgedAlerts: number;
  
  totalFinancialImpact: number; // sum of all impacts
  totalTimelineImpact: string; // sum of all impacts
  
  riskLevel: 'low' | 'medium' | 'high' | 'critical'; // calculated
  lastUpdated: string;
}

/**
 * CHANGE ORDER
 * Generated change order to send to client
 */
export interface ChangeOrder {
  id: string;
  organizationId: string;
  projectId: string;
  alertId: string; // which alert triggered this
  
  number: string; // CO-001, CO-002, etc
  title: string;
  description: string;
  reason: string; // why this change was requested
  
  scope: {
    additions: string[];
    removals?: string[];
    modifications?: string[];
  };
  
  financial: {
    additionalCost: number;
    costReason: string;
    currency: string;
  };
  
  timeline: {
    additionalDays: number;
    newEndDate: string;
    impactSummary: string;
  };
  
  effort: {
    hoursAdded: number;
    resourcesNeeded: string[];
    risks: string[];
  };
  
  approval: {
    status: 'draft' | 'sent' | 'acknowledged' | 'approved' | 'rejected';
    sentAt?: string;
    approvedAt?: string;
    approvedBy?: string;
    rejectionReason?: string;
  };
  
  terms: {
    paymentTerms?: string;
    deadline?: string;
    conditions?: string[];
  };
  
  createdAt: string;
  updatedAt: string;
}

/**
 * SCOPE RISK ASSESSMENT
 * Overall risk analysis for a project
 */
export interface ScopeRiskAssessment {
  projectId: string;
  organizationId: string;
  
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  riskFactors: RiskFactor[];
  
  clientHealthImpact: number; // -100 to 100, impact on relationship
  revenueImpact: number; // estimated revenue loss/gain
  
  historicalTrend: 'improving' | 'stable' | 'worsening';
  trendData: Array<{
    date: string;
    alertCount: number;
    riskScore: number;
  }>;
  
  recommendations: string[];
  urgentActions: string[];
}

export interface RiskFactor {
  type: string;
  weight: number; // 0-1
  score: number; // 0-100
  description: string;
}

/**
 * SCOPE CHANGE HISTORY
 * Track changes to scope over time
 */
export interface ScopeChangeHistory {
  id: string;
  projectId: string;
  organizationId: string;
  
  changeDate: string;
  changeType: 'alert_created' | 'alert_acknowledged' | 'change_order_sent' | 'change_order_approved' | 'resolution';
  
  alertIds?: string[];
  changeOrderId?: string;
  
  details: string;
  initiatedBy: string; // user or system
  
  budgetBefore?: number;
  budgetAfter?: number;
  timelineBefore?: string;
  timelineAfter?: string;
}

/**
 * EMAIL MONITORING
 * Automatically scan incoming emails for scope changes
 */
export interface EmailMonitoringRule {
  id: string;
  organizationId: string;
  
  isActive: boolean;
  emailAddresses: string[]; // emails to monitor
  keywords: string[]; // trigger words like "also", "additionally", "can you add"
  
  scanFrequency: 'realtime' | 'hourly' | 'daily';
  autoAlert: boolean;
  minConfidenceThreshold: number; // 0-1
}

/**
 * API RESPONSES
 */
export interface AnalyzeScopeRequest {
  organizationId: string;
  projectId: string;
  content: string;
  contentType: ScopeContentType;
  source: ScopeSource;
}

export interface AnalyzeScopeResponse {
  success: boolean;
  alerts: ScopeChangeAlert[];
  riskAssessment?: ScopeRiskAssessment;
  suggestedChangeOrder?: ChangeOrder;
  error?: string;
}

export interface GetScopeStatusResponse {
  success: boolean;
  tracking?: ScopeTracking;
  alerts?: ScopeChangeAlert[];
  totalFinancialRisk?: number;
  recommendedActions?: string[];
  error?: string;
}

export interface CreateChangeOrderResponse {
  success: boolean;
  changeOrder?: ChangeOrder;
  previewHtml?: string; // HTML for preview
  error?: string;
}

export interface SendChangeOrderResponse {
  success: boolean;
  changeOrderId?: string;
  sentAt?: string;
  clientEmail?: string;
  trackingId?: string;
  error?: string;
}

/**
 * DASHBOARD DATA
 */
export interface ScopeDashboardData {
  totalAlerts: number;
  openAlerts: number;
  criticalAlerts: number;
  
  financialRisk: {
    min: number;
    max: number;
    currency: string;
    probability: number; // 0-1
  };
  
  timelineRisk: string;
  
  topRisks: Array<{
    id: string;
    description: string;
    severity: AlertSeverity;
    impact: string;
  }>;
  
  recentAlerts: ScopeChangeAlert[];
  
  trend: Array<{
    date: string;
    newAlerts: number;
    riskScore: number;
  }>;
}

/**
 * SCOPE KEYWORDS & PATTERNS
 * For AI detection
 */
export const SCOPE_EXPANSION_KEYWORDS = [
  'also',
  'additionally',
  'can you add',
  'can we add',
  'what if',
  'would it be possible',
  'could we',
  'one more thing',
  'while you\'re at it',
  'by the way',
  'as well',
  'oh also',
  'another thing',
  'plus',
  'furthermore',
  'in addition',
  'moreover',
  'and another',
  'we need',
  'we want',
  'can it also',
  'make it also',
  'instead of',
  'rather than',
  'how about',
  'throw in',
];

export const TIMELINE_CHANGE_KEYWORDS = [
  'sooner',
  'faster',
  'earlier',
  'ASAP',
  'urgent',
  'accelerate',
  'rush',
  'expedite',
  'next week',
  'by end of week',
  'immediately',
  'as soon as possible',
  'delay',
  'postpone',
  'push back',
  'extend',
  'later',
];

export const BUDGET_DISCUSSION_KEYWORDS = [
  'budget',
  'cost',
  'price',
  'investment',
  'fee',
  'expensive',
  'expensive',
  'affordable',
  'cheaper',
  'discount',
  'can you reduce',
  'reduce cost',
  'payment',
  'invoice',
  'quote',
];

/**
 * ALERT CONFIGURATION
 */
export interface AlertConfig {
  enableAutoDetection: boolean;
  minConfidenceThreshold: number; // 0-1, default 0.7
  monitorSources: ScopeSource[];
  notificationChannels: 'email' | 'slack' | 'dashboard'[];
  autoCreateChangeOrder: boolean;
  escalationRules?: Array<{
    severity: AlertSeverity;
    action: 'notify' | 'create_change_order' | 'escalate_to_manager';
    timeToAction?: number; // hours
  }>;
}
