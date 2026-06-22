// lib/prompts/meeting-analyzer.ts
// Gemini Prompts for AI Meeting Summary Feature

/**
 * SYSTEM PROMPT FOR MEETING ANALYSIS
 * This is the base instruction set for Gemini
 */
export function getMeetingAnalysisSystemPrompt(): string {
  return `You are an expert AI meeting analyst for professional service agencies. Your role is to:

1. ANALYZE meeting transcripts and recordings
2. EXTRACT actionable insights
3. IDENTIFY decisions and action items
4. DETECT scope changes or expansion
5. ASSESS meeting sentiment and client satisfaction
6. GENERATE concise, professional summaries

IMPORTANT RULES:
- Write in clear, professional language
- Focus on business impact
- Identify revenue-related implications
- Flag any potential scope creep or changes
- Be specific (no generic statements)
- Use exact quotes from transcript when possible
- Consider client satisfaction and relationship health

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON
- No markdown formatting
- All fields must be populated
- Use null for missing data, never skip fields
- Include confidence scores where applicable

DATE CONTEXT:
- Current date is 2026-06-08
- All dates in output must be 2026-06-08 or later
- All timestamps must be in ISO 8601 format`;
}

/**
 * PROMPT FOR SUMMARIZING MEETING TRANSCRIPT
 */
export function buildMeetingSummaryPrompt(transcript: string, meetingContext: MeetingContext): string {
  return `
MEETING TRANSCRIPT ANALYSIS REQUEST
Date: ${new Date(meetingContext.meetingDate).toISOString().split('T')[0]}
Duration: ${meetingContext.duration} minutes
Attendees: ${meetingContext.attendees.join(', ')}
Project: ${meetingContext.projectName}
Client: ${meetingContext.clientName}

TRANSCRIPT:
${transcript}

TASK:
Analyze this meeting transcript and provide a comprehensive summary in JSON format.

Extract the following:
1. Executive Summary (2-3 sentences)
2. Key Decisions (decisions that were made)
3. Next Steps (action items and follow-ups)
4. Risks (any concerns or red flags)
5. Follow-ups (suggested follow-up meetings)
6. Sentiment Analysis (overall tone and satisfaction)
7. Main Topics (topics that were discussed)

Return JSON with this structure (EXACTLY):
{
  "executiveSummary": "2-3 sentence overview of meeting",
  "keyDecisions": ["decision 1", "decision 2"],
  "nextSteps": ["action 1", "action 2"],
  "risks": [{"description": "risk description", "severity": "high|medium|low"}],
  "followUps": [{"description": "follow-up", "suggestedDate": "2026-06-15", "priority": "high|medium|low"}],
  "sentiment": {
    "overall": "positive|neutral|negative|mixed",
    "score": 0.5,
    "clientSentiment": "positive|neutral|negative",
    "concernAreas": ["concern 1"]
  },
  "topics": ["topic 1", "topic 2"],
  "confidence": 0.95
}
`;
}

/**
 * PROMPT FOR EXTRACTING ACTION ITEMS
 */
export function buildActionItemExtractionPrompt(
  transcript: string,
  meetingDate: string,
  attendees: string[]
): string {
  return `
ACTION ITEM EXTRACTION REQUEST

MEETING TRANSCRIPT:
${transcript}

ATTENDEES:
${attendees.join(', ')}

TASK:
Extract all action items from this meeting. For each action item:
1. Identify WHAT needs to be done
2. Identify WHO should do it (if mentioned)
3. Identify WHEN it should be done (if mentioned)
4. Assess PRIORITY (critical, high, medium, low)

Be VERY specific. Do not create generic action items.

Return a JSON array of action items:
[
  {
    "description": "Very specific description of what needs to be done",
    "assignee": "Name or email if mentioned, otherwise null",
    "dueDateHint": "When it should be done (e.g., '2026-06-15' or '1 week' or null)",
    "priority": "critical|high|medium|low",
    "transcriptQuote": "Exact quote from transcript supporting this action item"
  }
]

IMPORTANT:
- Only include ACTUAL action items mentioned in the meeting
- Do NOT invent action items
- Be specific about WHO is responsible
- Include priority based on urgency mentioned
- Return ONLY valid JSON array
`;
}

/**
 * PROMPT FOR DETECTING SCOPE CHANGES
 */
export function buildScopeChangeDetectionPrompt(
  transcript: string,
  projectScope: string,
  currentBudget: number,
  currentTimeline: string
): string {
  return `
SCOPE CHANGE DETECTION REQUEST

CURRENT PROJECT SCOPE:
${projectScope}

CURRENT BUDGET: $${currentBudget}
CURRENT TIMELINE: ${currentTimeline}

MEETING TRANSCRIPT:
${transcript}

TASK:
Analyze the meeting transcript for ANY mentions of:
1. NEW requirements not in original scope
2. CHANGES to existing requirements
3. EXPANSIONS to project
4. ADDITIONS that weren't discussed before
5. TIMELINE changes
6. BUDGET implications

Return a JSON object:
{
  "scopeChangesDetected": [
    {
      "id": "change_1",
      "description": "Specific change mentioned",
      "type": "new_requirement|change|expansion|addition",
      "estimatedImpact": "Impact description",
      "timelineImpact": "X days additional needed",
      "costImpact": "$X - $Y additional cost",
      "severity": "low|medium|high|critical",
      "transcriptQuote": "Exact quote from transcript"
    }
  ],
  "totalEstimatedCostImpact": "$X - $Y or null if not determinable",
  "totalTimelineImpact": "X days or null if not determinable",
  "requiresChangeOrder": true|false,
  "confidence": 0.95
}

IMPORTANT:
- Only include ACTUAL scope changes mentioned
- Be specific about what changed
- Include financial impact if possible
- Return ONLY valid JSON
`;
}

/**
 * PROMPT FOR SENTIMENT ANALYSIS
 */
export function buildSentimentAnalysisPrompt(
  transcript: string,
  attendees: string[]
): string {
  return `
SENTIMENT ANALYSIS REQUEST

MEETING TRANSCRIPT:
${transcript}

ATTENDEES: ${attendees.join(', ')}

TASK:
Analyze the sentiment and emotional tone of this meeting.

For each attendee mentioned:
1. Assess their sentiment (positive, neutral, negative)
2. Identify tone indicators
3. Note any concerns or frustrations
4. Note any enthusiasm or agreement

Return JSON:
{
  "overallSentiment": "positive|neutral|negative|mixed",
  "sentimentScore": 0.5 (range: -1 to 1, where -1 is very negative, 1 is very positive),
  "clientSentiment": "positive|neutral|negative",
  "teamSentiment": "positive|neutral|negative",
  "concernAreas": ["concern 1", "concern 2"],
  "positiveIndicators": ["indicator 1"],
  "redFlags": ["flag 1"],
  "relationshipHealthScore": 0.8 (0-1 scale),
  "analysis": "Paragraph explaining the sentiment assessment"
}

IMPORTANT:
- Focus on client satisfaction indicators
- Identify relationship health
- Flag any concerning tones
- Return ONLY valid JSON
`;
}

/**
 * PROMPT FOR IDENTIFYING OPPORTUNITIES
 */
export function buildOpportunityIdentificationPrompt(
  transcript: string,
  clientName: string,
  currentServices: string
): string {
  return `
OPPORTUNITY IDENTIFICATION REQUEST

CLIENT: ${clientName}
CURRENT SERVICES: ${currentServices}

MEETING TRANSCRIPT:
${transcript}

TASK:
Identify potential upsell or cross-sell opportunities mentioned in this meeting.

Look for:
1. Mentioned pain points we could solve
2. Hinted at future needs
3. Complimentary services that could help
4. Industry trends they mentioned
5. Budget flexibility signals

Return JSON:
{
  "upsellOpportunities": [
    {
      "description": "Specific opportunity",
      "clientPain": "What pain point they mentioned",
      "suggestedService": "What we could offer",
      "estimatedValue": "$X - $Y",
      "timeframe": "When they might need it",
      "transcriptQuote": "Supporting quote"
    }
  ],
  "totalOpportunityValue": "$X - $Y",
  "recommendedNextSteps": ["step 1", "step 2"],
  "confidenceLevel": 0.85
}

Return ONLY valid JSON.
`;
}

/**
 * PROMPT FOR CLIENT INSIGHTS
 */
export function buildClientInsightsPrompt(
  transcript: string,
  clientName: string
): string {
  return `
CLIENT INSIGHTS EXTRACTION REQUEST

CLIENT: ${clientName}

MEETING TRANSCRIPT:
${transcript}

TASK:
Extract insights about the client's business, needs, and priorities.

Identify:
1. Client's main business challenges
2. Their success metrics
3. Budget constraints or flexibility
4. Decision-making process
5. Key stakeholders and their interests
6. Timeline pressures
7. Competitive situation
8. Strategic priorities

Return JSON:
{
  "clientChallenges": ["challenge 1", "challenge 2"],
  "successMetrics": ["metric 1", "metric 2"],
  "budgetSituation": "constrained|moderate|flexible|unknown",
  "decisionProcess": "Description of how they make decisions",
  "keyStakeholders": [
    {
      "name": "Name",
      "role": "Their role",
      "interest": "Their interest/concern"
    }
  ],
  "timelinePressure": "urgent|moderate|flexible",
  "competitiveSituation": "Description of competitive landscape",
  "strategicPriorities": ["priority 1", "priority 2"],
  "relationshipStrength": "weak|moderate|strong"
}

Return ONLY valid JSON.
`;
}

/**
 * INTERFACE FOR MEETING CONTEXT
 */
export interface MeetingContext {
  meetingDate: string;
  duration: number;
  attendees: string[];
  projectName: string;
  clientName: string;
  clientId?: string;
  projectScope?: string;
  currentBudget?: number;
  currentTimeline?: string;
  currentServices?: string;
}
