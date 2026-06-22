# FEATURE 3: AI SCOPE CREEP DETECTOR
## Production Implementation Guide

---

## 1. EXECUTIVE OVERVIEW

**Problem**: Agencies lose 15-30% of project revenue to unpaid scope creep. This happens incrementally through:
- New client requests in emails
- Meeting notes expanding deliverables
- "Quick asks" that become full features
- Timeline compressions without fee adjustments
- Missing deliverables discovered mid-project

**Solution**: AgencyFlow continuously monitors all communication channels (emails, notes, messages, meeting summaries) and alerts teams when scope expansion is detected.

**Impact**:
- Recover 20-30% of revenue loss
- Reduce team frustration
- Improve project profitability
- Enable proactive client conversations

---

## 2. DATABASE SCHEMA

```sql
CREATE TABLE scope_creep_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Alert Classification
  alert_type ENUM (
    'new_request',           -- Client asking for new deliverable
    'scope_expansion',       -- Existing deliverable expanded
    'hidden_deliverable',    -- Implied work not explicitly discussed
    'timeline_compression',  -- Timeline shortened without fee adjustment
    'resource_increase',     -- More people/effort needed
    'quality_increase'       -- Higher quality bar implied
  ) NOT NULL,
  
  risk_level ENUM ('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  
  -- Source Information
  detected_in ENUM ('email', 'note', 'meeting', 'task', 'message', 'comment') NOT NULL,
  source_reference_id TEXT, -- Email ID, meeting ID, etc
  source_context TEXT, -- Exact snippet that triggered alert
  
  -- Alert Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suspected_deliverable TEXT, -- What the client is asking for
  
  -- Business Impact
  estimated_hours INT, -- How many hours of work
  estimated_cost DECIMAL, -- Financial impact
  affected_milestone TEXT, -- Which milestone impacted
  timeline_impact_days INT, -- Days of delay
  
  -- Suggested Actions
  suggested_action ENUM (
    'change_order',        -- Create formal change order
    'additional_invoice',  -- Invoice for extra work
    'approval_needed',     -- Need client approval before proceeding
    'negotiate_timeline',  -- Adjust timeline + fees
    'descope_item'         -- Reduce scope to fit budget
  ) DEFAULT 'approval_needed',
  
  action_notes TEXT,
  
  -- Status Tracking
  status ENUM ('new', 'acknowledged', 'addressed', 'ignored', 'resolved') DEFAULT 'new',
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES auth.users(id),
  
  action_taken TEXT,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- AI Analysis
  confidence_score DECIMAL, -- 0-1, how confident is this a scope issue?
  ai_model_used TEXT DEFAULT 'gemini-2.5-flash',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scope_creep_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Cumulative tracking
  total_alerts INT DEFAULT 0,
  total_additional_hours INT DEFAULT 0,
  total_additional_cost DECIMAL DEFAULT 0,
  
  -- High risk items
  critical_alerts_count INT DEFAULT 0,
  unresolved_alerts INT DEFAULT 0,
  
  -- Historical
  alerts_this_week INT DEFAULT 0,
  alerts_this_month INT DEFAULT 0,
  
  -- Project metrics
  original_budget DECIMAL,
  original_hours INT,
  original_timeline_days INT,
  
  current_burn_rate DECIMAL, -- Hours used / estimated total
  projected_overrun DECIMAL, -- $ projected over budget
  
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scope_change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES scope_creep_alerts(id),
  
  title TEXT NOT NULL,
  description TEXT,
  additional_scope TEXT,
  
  cost DECIMAL NOT NULL,
  hours INT NOT NULL,
  timeline_extension_days INT,
  
  status ENUM ('draft', 'sent_to_client', 'approved', 'rejected') DEFAULT 'draft',
  
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  approved_at TIMESTAMP,
  
  client_approval_date TIMESTAMP
);
```

---

## 3. DETECTION LOGIC

### Sources Analyzed

```
1. EMAILS
   └── Check for keywords: "also need", "can you add", "one more thing",
       "forgot to mention", "is it possible to", "what if we", "additional"

2. MEETING NOTES
   └── Cross-reference commitments vs original scope
   └── Detect timeline compression mentions

3. PROJECT COMMENTS/MESSAGES
   └── Slack/Teams messages mentioning project
   └── Task comments showing expanding expectations

4. CLIENT FEEDBACK
   └── Review responses implying new work
   └── Track approval cycles (implies rework)

5. TASK CREEP
   └── New tasks created outside scope
   └── Task descriptions changing mid-project
   └── Subtasks expanding original deliverable
```

### Risk Scoring Algorithm

```typescript
function calculateRiskLevel(alert: ScopeAlert): number {
  let score = 0;

  // Financial impact (0-40 points)
  if (alert.estimated_cost) {
    score += Math.min(40, (alert.estimated_cost / alert.project_budget) * 40);
  }

  // Timeline impact (0-30 points)
  if (alert.timeline_impact_days) {
    score += Math.min(30, (alert.timeline_impact_days / alert.project_timeline) * 30);
  }

  // Urgency (0-20 points)
  const daysUntilMilestone = daysBetween(now, alert.affected_milestone_date);
  if (daysUntilMilestone < 7) score += 20;
  else if (daysUntilMilestone < 14) score += 15;
  else if (daysUntilMilestone < 30) score += 10;

  // Pattern matching (0-10 points)
  if (isPatternedScope(alert.client_id)) score += 10;

  // Confidence (0-10 points)
  score += (alert.ai_confidence_score || 0.5) * 10;

  return Math.min(100, score);
}

// Risk levels
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 20) return 'low';
  if (score < 40) return 'medium';
  if (score < 70) return 'high';
  return 'critical';
}
```

---

## 4. API ENDPOINTS

### POST /api/v1/scope-detector/analyze

**Purpose**: Analyze content for scope creep

```typescript
Request Body:
{
  "project_id": "uuid",
  "content_type": "email|note|meeting|message",
  "content": "Full text to analyze",
  "source_reference_id": "email_id_or_meeting_id"
}

Response:
{
  "success": true,
  "alerts": [
    {
      "id": "uuid",
      "alert_type": "new_request",
      "risk_level": "medium",
      "confidence_score": 0.85,
      "title": "Client requesting additional reporting dashboard",
      "description": "In email, client mentioned 'we'd also like a dashboard for daily reporting'",
      "estimated_hours": 40,
      "estimated_cost": 4000,
      "suggested_action": "change_order"
    }
  ]
}
```

### GET /api/v1/scope-detector/project/{id}

**Purpose**: Get scope tracking for project

```typescript
Response:
{
  "project_id": "uuid",
  "total_alerts": 5,
  "total_additional_cost": 12500,
  "total_additional_hours": 125,
  "critical_alerts": 1,
  "unresolved_alerts": 3,
  "projected_overrun": 2500,
  "health_status": "at_risk",
  "alerts": [
    {
      "id": "uuid",
      "alert_type": "scope_expansion",
      "risk_level": "high",
      "status": "acknowledged",
      "title": "...",
      "created_at": "..."
    }
  ]
}
```

### PUT /api/v1/scope-detector/alerts/{id}

**Purpose**: Update alert status

```typescript
Request Body:
{
  "status": "acknowledged|addressed|resolved|ignored",
  "action_notes": "We decided to include this in the base scope",
  "suggested_action_chosen": "descope_item"
}

Response:
{
  "success": true,
  "alert": {...},
  "updated_at": "2026-06-08T15:00:00Z"
}
```

### POST /api/v1/scope-detector/alerts/{id}/create-change-order

**Purpose**: Generate formal change order

```typescript
Request Body:
{
  "send_to_client": true,
  "client_email": "client@company.com",
  "custom_message": "We've identified some additional scope..."
}

Response:
{
  "success": true,
  "change_order_id": "uuid",
  "cost": 5000,
  "hours": 50,
  "status": "sent_to_client",
  "sent_at": "2026-06-08T15:05:00Z"
}
```

### GET /api/v1/scope-detector/dashboard

**Purpose**: Organization-wide scope health dashboard

```typescript
Response:
{
  "organization_metrics": {
    "total_projects_tracked": 12,
    "projects_at_risk": 3,
    "total_unaddressed_scope": 45000,
    "total_unaddressed_hours": 450
  },
  "top_risky_projects": [
    {
      "project_id": "uuid",
      "project_name": "E-Commerce Platform",
      "risk_level": "critical",
      "unresolved_alerts": 5,
      "projected_overrun": 25000
    }
  ]
}
```

---

## 5. GEMINI PROMPT

### System Prompt

```
You are an expert at detecting scope creep in agency projects.
Your job is to analyze communication (emails, notes, meeting transcripts, messages)
and identify when clients are requesting work beyond the original scope.

You understand:
- Agency project structures
- Common scope creep patterns
- Financial implications
- Timeline impacts
- How to quantify additional work

Be thorough but avoid false positives. Only flag genuine scope concerns.
```

### User Prompt Template

```
Analyze this {content_type} for scope creep in the context of this project:

PROJECT CONTEXT
Name: {project_name}
Original Scope: {original_scope}
Deliverables: {deliverables_list}
Timeline: {project_timeline}
Budget: {budget_amount}
Current Status: {project_status}
Days Elapsed: {days_elapsed}
Days Remaining: {days_remaining}

CONTENT TO ANALYZE
{content_text}

DETECTION RULES:
1. Flag new requests not in original scope
2. Flag expanded existing deliverables
3. Flag timeline compression requests
4. Flag quality or performance increases
5. Flag implied work not explicitly discussed
6. Note urgency signals ("ASAP", "this week")
7. Identify financial impact

OUTPUT (JSON ONLY):
{
  "alerts_found": [
    {
      "alert_type": "new_request|scope_expansion|hidden_deliverable|timeline_compression|resource_increase|quality_increase",
      "confidence_score": 0.85,
      "risk_level": "low|medium|high|critical",
      "title": "Brief title of scope issue",
      "description": "Detailed description with exact quote from content",
      "exact_quote": "The client said: '...'",
      "affected_deliverable": "Which original deliverable is impacted",
      "estimated_hours_additional": 40,
      "estimated_cost_additional": 4000,
      "timeline_impact_days": 5,
      "suggested_action": "change_order|additional_invoice|approval_needed|negotiate_timeline|descope_item",
      "action_priority": "urgent|high|medium|low"
    }
  ],
  "overall_risk_assessment": "No concerns|Minor scope drift|Significant scope expansion|Critical scope breach",
  "total_estimated_additional_cost": 4000,
  "total_estimated_additional_hours": 40
}

IMPORTANT:
- Only flag ACTUAL scope expansion, not clarifications
- Consider client tone (question vs demand)
- Flag even small items that accumulate
- Quantify impact conservatively
```

---

## 6. INTEGRATION WITH PROJECT MONITORING

### Real-Time Monitoring

```typescript
// Trigger scope detection on:
1. New email received from client
   └── Auto-analyze with background job

2. Meeting completed
   └── Use existing meeting summary
   └── Cross-reference with project scope

3. New comment added to project
   └── Real-time analysis
   └── Immediate alert if critical

4. Task description updated
   └── Check if work expanded vs original

5. Timeline milestone discussed
   └── Track if timeline compressed
```

### Daily Digest for Project Managers

```
Scope Creep Daily Digest
For: 12 projects you're managing

CRITICAL ALERTS
├─ Project "E-Commerce" - $25K additional scope detected
├─ Project "Mobile App" - Timeline compression imminent
└─ Project "CMS Redesign" - 4 unresolved scope items

NEW ALERTS THIS WEEK
├─ 8 new scope items detected
├─ Total additional cost: $42,000
└─ Total additional hours: 420

ACTION ITEMS
├─ 3 change orders awaiting client approval
├─ 2 projects need budget renegotiation
└─ 1 project needs descoping decision

[View Full Dashboard]
```

---

## 7. CHANGE ORDER WORKFLOW

### Automated Change Order Generation

```typescript
// When scope creep is detected and user chooses to create change order:

1. Pull scope details from alert
2. Calculate additional cost:
   - Based on project hourly rate
   - Or fixed rate per deliverable
   - Add 15% contingency

3. Generate change order document
   - Professional formatting
   - Clear scope additions
   - Pricing breakdown
   - New timeline (if affected)
   - Approval process steps

4. Send to client
   - Email with embedded PDF
   - Clear call-to-action
   - Deadline for approval
   - Reference to original scope

5. Track response
   - Email open tracking
   - Approval/rejection notification
   - Auto-remind if no response after 48 hours
   - Update project timeline when approved
```

---

## 8. SUCCESS METRICS

```
Primary:
├── Scope creep alerts accuracy (target: >90%)
├── False positive rate (target: <10%)
├── Average time to detect scope expansion (target: <24 hours)
├── Scope items caught before starting (target: >70%)
└── Change orders generated (target: >50% of alerts)

Financial:
├── Revenue recovered per month (target: >$5K per customer)
├── Average change order value (target: $3K-5K)
├── Percentage of scope creep prevented (target: >30%)
└── Average deal recovery rate (target: >60%)

Operational:
├── Project budget variance (target: <5%)
├── Project timeline variance (target: <10%)
├── Client satisfaction with scope clarity (target: >4/5)
└── Team confidence in budget accuracy (target: >4.5/5)
```

---

## 9. IMPLEMENTATION PRIORITY

### MVP (Week 1-2)
- Email analysis
- Basic alert classification
- Risk scoring
- Alert dashboard

### V2 (Week 3-4)
- Meeting analysis integration
- Change order generation
- Client communication templates

### V3 (Week 5-6)
- Real-time Slack/Teams monitoring
- Predictive scope creep
- Historical pattern analysis
- Advanced analytics

