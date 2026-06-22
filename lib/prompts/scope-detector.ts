// lib/prompts/scope-detector.ts
// Gemini Prompts for AI Scope Creep Detector Feature

/**
 * SYSTEM PROMPT FOR SCOPE ANALYSIS
 * This is the base instruction set for Gemini
 */
export function getScopeDetectionSystemPrompt(): string {
  return `You are an expert scope creep detector for professional service agencies. Your role is to:

1. ANALYZE communications for scope expansion indicators
2. IDENTIFY new requirements not in original scope
3. CALCULATE financial and timeline impact
4. ASSESS risk level and severity
5. RECOMMEND actions to protect project

SCOPE CREEP TYPES:
- New Features: Completely new functionality requested
- Requirement Expansion: Existing features asked to do more
- Timeline Pressure: "Can you do it sooner?"
- Integrations: "Can it connect to..."
- Quality Increases: "Better graphics", "Faster performance"
- Phase Additions: "Can we add this as a phase?"

IMPORTANT RULES:
- Be precise and specific about what changed
- Look for implicit scope changes, not just explicit requests
- Consider client sentiment (are they satisfied or demanding?)
- Quantify financial impact in dollar ranges
- Flag even "small" additions that could compound
- Don't flag clarifications or standard communications
- Include confidence score (0-1)

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON
- No markdown formatting
- All fields must be populated
- Use null for unknown data
- Include exact quotes as evidence

DATE CONTEXT:
- Current date is 2026-06-08
- All dates must be 2026-06-08 or later
- ISO 8601 format for timestamps`;
}

/**
 * PROMPT FOR ANALYZING SCOPE CHANGES IN EMAIL/MESSAGE
 */
export function buildScopeAnalysisPrompt(
  content: string,
  projectContext: ScopeAnalysisContext
): string {
  return `
SCOPE ANALYSIS REQUEST
Project: ${projectContext.projectName}
Client: ${projectContext.clientName}
Original Scope: ${projectContext.originalScope}
Original Budget: $${projectContext.originalBudget}
Original Timeline: ${projectContext.originalTimeline}

CONTENT TO ANALYZE:
${content}

TASK:
Analyze this communication for scope changes. For EACH change detected, extract:

1. What is being requested or implied?
2. Is this within original scope or NEW?
3. What is the financial impact (time/cost)?
4. What is the timeline impact?
5. How confident are you (0-1)?
6. What is the severity (low/medium/high/critical)?

Return JSON:
{
  "scopeChangesDetected": [
    {
      "id": "change_1",
      "changeType": "new_feature|requirement_expansion|timeline_change|integration_request|quality_increase|phase_addition|other",
      "description": "Specific change detected",
      "originalRequirement": "What was originally promised",
      "newRequirement": "What they're now asking for",
      "severity": "low|medium|high|critical",
      "financialImpact": {
        "min": 500,
        "max": 2000,
        "reasoning": "Why this cost estimate"
      },
      "timelineImpact": "3-5 days",
      "effortImpact": "15-20 hours",
      "confidenceScore": 0.85,
      "evidenceQuote": "Exact quote from content",
      "clientSentiment": "positive|neutral|negative",
      "communicationNeeded": true,
      "recommendedAction": "What should you do about this?"
    }
  ],
  "totalFinancialRisk": {
    "min": 1000,
    "max": 4000,
    "reasoning": "Summary of all impacts"
  },
  "totalTimelineRisk": "1-2 weeks",
  "overallRiskLevel": "low|medium|high|critical",
  "requiresChangeOrder": true,
  "recommendedNextSteps": [
    "Send change order for $X",
    "Clarify requirements with client",
    "Re-plan timeline"
  ],
  "urgency": "immediate|soon|monitor",
  "confidenceLevel": 0.88
}

IMPORTANT:
- Only identify ACTUAL scope changes mentioned or strongly implied
- Do NOT invent changes
- Include confidence score for each change
- Provide exact quotes as evidence
- Consider client satisfaction (are they complaining or just mentioning?)
- Return ONLY valid JSON
`;
}

/**
 * PROMPT FOR DETAILED RISK ASSESSMENT
 */
export function buildDetailedRiskAssessmentPrompt(
  alerts: Array<{ description: string; severity: string; impact: number }>
): string {
  return `
RISK ASSESSMENT REQUEST

DETECTED SCOPE CHANGES:
${alerts.map((a, i) => `${i + 1}. ${a.description} (${a.severity}, $${a.impact})`).join('\n')}

TASK:
Assess the overall risk to this project:

1. What is the total financial exposure?
2. What is the cumulative timeline impact?
3. How does this affect client relationship?
4. What is the probability these happen?
5. What should the team do?

Return JSON:
{
  "overallRiskScore": 72,
  "riskLevel": "high",
  "riskFactors": [
    {
      "type": "Financial Exposure",
      "weight": 0.4,
      "score": 80,
      "description": "Potential $3-5K additional cost"
    },
    {
      "type": "Timeline Risk",
      "weight": 0.3,
      "score": 70,
      "description": "2-3 week slip if all changes happen"
    },
    {
      "type": "Relationship Risk",
      "weight": 0.2,
      "score": 50,
      "description": "Client seems demanding but satisfied"
    },
    {
      "type": "Resource Risk",
      "weight": 0.1,
      "score": 40,
      "description": "Team capacity for additional work"
    }
  ],
  "clientHealthImpact": -15,
  "revenueImpact": -3000,
  "probability": 0.65,
  "recommendations": [
    "Proactively send change order",
    "Schedule clarification meeting",
    "Set boundaries on out-of-scope requests",
    "Create detailed change log"
  ],
  "urgentActions": [
    "Send change order within 24 hours",
    "Brief team on potential scope changes"
  ]
}

Return ONLY valid JSON.
`;
}

/**
 * PROMPT FOR GENERATING CHANGE ORDER CONTENT
 */
export function buildChangeOrderPrompt(
  scopeChanges: Array<{
    description: string;
    financialImpact: { min: number; max: number };
    timelineImpact: string;
  }>,
  projectContext: ScopeAnalysisContext
): string {
  return `
CHANGE ORDER GENERATION REQUEST

Project: ${projectContext.projectName}
Client: ${projectContext.clientName}
Current Budget: $${projectContext.originalBudget}
Current Timeline: ${projectContext.originalTimeline}

REQUESTED CHANGES:
${scopeChanges
  .map((c) => `- ${c.description} (Cost: $${c.financialImpact.min}-${c.financialImpact.max}, Timeline: ${c.timelineImpact})`)
  .join('\n')}

TASK:
Generate professional change order content in JSON format:

{
  "title": "Change Order 001 - [Brief Description]",
  "scopeSummary": "Professional summary of changes",
  "detailedScope": {
    "additions": ["addition 1", "addition 2"],
    "removals": [],
    "modifications": []
  },
  "financialImpact": {
    "additionalCost": 1500,
    "totalProjectCost": ${projectContext.originalBudget + 1500},
    "costBreakdown": "Line item explanation",
    "paymentTerms": "Net 30 from approval"
  },
  "timelineImpact": {
    "additionalDays": 10,
    "newEndDate": "2026-07-15",
    "impactSummary": "Specific impact on timeline"
  },
  "effortBreakdown": {
    "hoursAdded": 40,
    "resourcesNeeded": ["Designer", "Developer"],
    "risks": ["Risk 1", "Risk 2"]
  },
  "businessJustification": "Why these changes make sense",
  "consequences": {
    "ifNotApproved": "What happens if we don't do this?",
    "ifApproved": "What's the benefit?"
  },
  "approvalInstructions": "How client should approve",
  "deadline": "2026-06-10"
}

Make it professional but clear. Include specific reasons.
Return ONLY valid JSON.
`;
}

/**
 * PROMPT FOR CLIENT COMMUNICATION RECOMMENDATIONS
 */
export function buildClientCommunicationPrompt(
  alert: {
    description: string;
    severity: string;
    impact: number;
    clientSentiment: string;
  }
): string {
  return `
CLIENT COMMUNICATION STRATEGY REQUEST

Scope Change: ${alert.description}
Severity: ${alert.severity}
Financial Impact: $${alert.impact}
Client Sentiment: ${alert.clientSentiment}

TASK:
Recommend how to communicate this to the client:

{
  "communicationStrategy": "proactive|reactive|escalated",
  "recommendedTiming": "immediate|within 24 hours|within a week",
  "communicationMethod": "email|call|meeting|change order",
  "keyPoints": [
    "Point 1 to emphasize",
    "Point 2 to emphasize"
  ],
  "emailTemplate": {
    "subject": "Change Order: [Name]",
    "opening": "Professional opening",
    "body": "Main explanation",
    "call_to_action": "What we need from them"
  },
  "negotiationPoints": ["Possible concessions"],
  "worstCase": "If they reject the change order",
  "bestCase": "If they accept immediately",
  "riskOfNoAction": "What happens if we don't address this?"
}

Return ONLY valid JSON.
`;
}

/**
 * INTERFACE FOR SCOPE ANALYSIS CONTEXT
 */
export interface ScopeAnalysisContext {
  projectName: string;
  clientName: string;
  originalScope: string;
  originalBudget: number;
  originalTimeline: string;
  serviceType?: string;
  projectPhase?: string;
  currentBudgetRemaining?: number;
  daysRemaining?: number;
}

/**
 * PREDEFINED SCOPE EXPANSION PATTERNS
 * Used for keyword-based pre-filtering
 */
export const SCOPE_EXPANSION_PATTERNS = [
  {
    pattern: /also\s+(need|want|require|add|include)/i,
    category: 'requirement_expansion',
    severity: 'medium',
  },
  {
    pattern: /can\s+(you|we)\s+(add|include|integrate|support)/i,
    category: 'new_feature',
    severity: 'medium',
  },
  {
    pattern: /(while|since)\s+you[\'']?re\s+(at\s+)?it/i,
    category: 'requirement_expansion',
    severity: 'medium',
  },
  {
    pattern: /would\s+(it\s+)?be\s+(possible|feasible)\s+to/i,
    category: 'new_feature',
    severity: 'low',
  },
  {
    pattern: /(one|another)\s+more\s+(thing|feature|request)/i,
    category: 'requirement_expansion',
    severity: 'medium',
  },
  {
    pattern: /(sooner|faster|ASAP|urgent|accelerate|rush)/i,
    category: 'timeline_change',
    severity: 'high',
  },
  {
    pattern: /(instead\s+of|rather\s+than|change.*to)/i,
    category: 'deliverable_change',
    severity: 'medium',
  },
  {
    pattern: /(integrate|connect|api|webhook|sync).*with/i,
    category: 'integration_request',
    severity: 'high',
  },
  {
    pattern: /(higher\s+quality|better|faster|more|improved)/i,
    category: 'quality_increase',
    severity: 'medium',
  },
];
