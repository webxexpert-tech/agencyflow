# FEATURE 5: AGENCYGPT
## Production Implementation Guide - AI COO for Agencies

---

## 1. STRATEGIC OVERVIEW

**AgencyGPT** is an AI-powered Chief Operating Officer that provides real-time business intelligence to agency leaders. Instead of digging through dashboards, executives ask natural language questions and get actionable insights instantly.

### Example Queries AgencyGPT Answers

```
"Which clients are at risk of churning?"
→ Pulls client health scores, identifies critical-risk clients, suggests actions

"How much revenue will we make this month?"
→ Analyzes active projects, pending proposals, payment schedules, calculates forecast

"What projects are behind schedule?"
→ Compares timelines to milestones, identifies delays, estimates impact

"Which team members are overutilized?"
→ Aggregates task assignments, estimates capacity, flags burnout risks

"What should I focus on today?"
→ Daily briefing with critical items, upcoming deadlines, key decisions needed

"Are we profitable on this project?"
→ Calculates labor costs vs project value, identifies margin issues

"What's our cash flow forecast?"
→ Projects revenue vs expenses, identifies cash crunches

"Which invoices are overdue?"
→ Lists overdue invoices by client, suggests follow-up actions

"Who's been most productive this month?"
→ Aggregates output metrics, team performance

"Can we take on this new project?"
→ Analyzes team capacity, project conflicts, recommends timeline/staffing
```

---

## 2. ARCHITECTURE

### Context Management System

```
AgencyGPT maintains a persistent context of:

ORGANIZATIONAL CONTEXT
├─ Org metrics (ARR, client count, project count)
├─ Team structure (departments, roles, capacity)
├─ Financial data (revenue, expenses, margins)
├─ KPIs and targets

CLIENT CONTEXT
├─ All client data (health, history, contracts)
├─ Recent communications
├─ Project history
├─ Payment history

PROJECT CONTEXT
├─ Active projects (status, timeline, team)
├─ Project health (on-time, on-budget)
├─ Risks and blockers
├─ Milestone status

TEAM CONTEXT
├─ Team member availability
├─ Current assignments
├─ Utilization rate
├─ Skills and expertise

FINANCIAL CONTEXT
├─ Revenue (actual and forecast)
├─ Expenses (labor, overhead)
├─ Margins by project
├─ Cash flow
```

### Data Retrieval Strategy

```
For each query:

1. INTENT DETECTION
   ├─ Parse natural language query
   ├─ Identify entities (clients, projects, dates)
   ├─ Determine required data sources
   └─ Estimate response complexity

2. CONTEXT GATHERING (Smart caching)
   ├─ Check 15-minute cache first
   ├─ Query relevant tables if stale
   ├─ Aggregate related data
   └─ Join with historical data for trends

3. ANALYSIS
   ├─ Apply business logic
   ├─ Calculate metrics
   ├─ Identify patterns/anomalies
   └─ Generate insights

4. RESPONSE GENERATION
   ├─ Format answer for readability
   ├─ Provide actionable recommendations
   ├─ Include supporting data
   └─ Suggest follow-up actions
```

---

## 3. DATABASE SCHEMA

```sql
CREATE TABLE agency_gpt_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  session_start TIMESTAMP DEFAULT NOW(),
  session_end TIMESTAMP,
  
  context_snapshot JSONB, -- Cached org state at session start
  message_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agency_gpt_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES agency_gpt_sessions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  query TEXT NOT NULL,
  query_intent ENUM (
    'business_intelligence',
    'client_analysis',
    'project_status',
    'team_management',
    'financial_analysis',
    'risk_identification',
    'daily_briefing',
    'recommendation',
    'forecasting'
  ),
  
  query_entities JSONB, -- {clients: [], projects: [], dates: []}
  query_complexity ENUM ('simple', 'moderate', 'complex'),
  
  -- Response
  response TEXT,
  response_type ENUM ('text', 'chart', 'table', 'list', 'mixed'),
  
  -- Data sources used
  data_sources JSONB, -- Tables queried
  query_time_ms INT,
  
  -- Quality
  confidence_score DECIMAL, -- 0-1
  user_feedback INT, -- -1=incorrect, 0=neutral, 1=helpful
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agency_gpt_context_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  context_type ENUM (
    'org_metrics',
    'client_summary',
    'project_summary',
    'team_summary',
    'financial_summary'
  ),
  
  context_data JSONB,
  cache_expires_at TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agency_gpt_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  insight_type ENUM (
    'revenue_forecast',
    'churn_risk',
    'opportunity',
    'risk',
    'efficiency',
    'anomaly'
  ),
  
  title TEXT,
  description TEXT,
  metric_value DECIMAL,
  metric_name TEXT,
  
  confidence_score DECIMAL,
  recommended_action TEXT,
  
  relevant_entities JSONB, -- {clients: [], projects: []}
  
  discovered_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE
);

CREATE TABLE agency_gpt_saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  name TEXT NOT NULL,
  description TEXT,
  
  report_type ENUM ('daily_briefing', 'weekly_summary', 'revenue_forecast', 'team_performance', 'client_health'),
  report_config JSONB, -- Customization parameters
  
  generated_content JSONB,
  
  scheduled BOOLEAN DEFAULT FALSE,
  schedule_frequency ENUM ('daily', 'weekly', 'monthly'),
  last_generated TIMESTAMP,
  next_generation TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. API ENDPOINTS

### POST /api/v1/agency-gpt/chat

**Purpose**: Core AgencyGPT conversation endpoint

```typescript
Request Body:
{
  "message": "Which clients are at risk of churning?",
  "session_id": "uuid (optional, for continuation)",
  "include_charts": true,
  "include_recommendations": true
}

Response (Streaming):
{
  "success": true,
  "session_id": "uuid",
  "message_id": "uuid",
  "stream": "Server-Sent Events"
}

// Streamed:
event: thinking
data: { "stage": "analyzing_client_data", "percent": 20 }

event: data_processing
data: { "stage": "calculating_churn_scores", "percent": 40 }

event: response_chunk
data: { "text": "Based on latest client health scores, I've identified..." }

event: insights
data: { 
  "insights": [
    { "client": "Risk Corp", "churn_risk": 0.78, "recommendation": "Schedule executive check-in" }
  ]
}

event: recommendations
data: {
  "actions": [
    "Contact Risk Corp immediately",
    "Offer discount on renewal",
    "Schedule executive briefing"
  ]
}

event: complete
data: { "message_id": "uuid", "response_time_ms": 2500 }
```

### GET /api/v1/agency-gpt/daily-briefing

**Purpose**: Get AI-generated daily briefing

```typescript
Response:
{
  "date": "2026-06-08",
  "executive_summary": "Good morning! Here's your agency briefing for today...",
  "critical_items": [
    {
      "type": "overdue_invoice",
      "details": "Invoice INV-001 from Acme Corp is 15 days overdue",
      "amount": 5000,
      "action_recommended": "Send follow-up email"
    }
  ],
  "today_agenda": [
    "Client meeting with TechCorp at 2 PM",
    "Project status review for E-Commerce",
    "Approve change order for Marketing Project"
  ],
  "this_week": {
    "key_deadlines": [
      { "item": "Final design delivery - WebApp", "date": "2026-06-10", "status": "on_track" }
    ],
    "upcoming_renewals": [
      { "client": "Growth Corp", "renewal_date": "2026-06-20", "days_remaining": 12 }
    ]
  },
  "financial_highlights": {
    "revenue_today": 2500,
    "revenue_week": 15000,
    "revenue_forecast_month": 120000,
    "margin_performance": "Above target"
  },
  "risk_alerts": [
    { "risk": "WebApp Project may miss deadline", "action": "Review with team" }
  ]
}
```

### POST /api/v1/agency-gpt/forecast

**Purpose**: Revenue/resource forecasting

```typescript
Request Body:
{
  "forecast_type": "revenue|resources|timeline",
  "time_horizon": "30|60|90|180|365", // days
  "include_scenarios": true // optimistic, realistic, pessimistic
}

Response:
{
  "forecast_type": "revenue",
  "time_horizon_days": 30,
  "base_forecast": 120000,
  "scenarios": {
    "optimistic": 150000,
    "realistic": 120000,
    "pessimistic": 90000
  },
  "confidence": 0.82,
  "assumptions": [
    "Current projects complete on schedule",
    "Pending proposals approved at 60%",
    "Historical churn rate continues"
  ],
  "drivers": {
    "active_projects": 12,
    "avg_project_value": 8000,
    "pending_proposals": 5,
    "historical_close_rate": 0.6
  }
}
```

### GET /api/v1/agency-gpt/suggestions

**Purpose**: Get proactive AI suggestions

```typescript
Response:
{
  "timestamp": "2026-06-08T10:00:00Z",
  "suggestions": [
    {
      "category": "revenue_opportunity",
      "suggestion": "GrowthCorp has strong health score and is due for renewal in 12 days. Recommend scheduling pre-renewal conversation.",
      "priority": "high",
      "estimated_impact": 15000,
      "recommended_action": "Schedule call"
    },
    {
      "category": "risk",
      "suggestion": "WebApp project is trending 5 days behind schedule. Resource allocation may need adjustment.",
      "priority": "high",
      "recommended_action": "Review team capacity"
    },
    {
      "category": "efficiency",
      "suggestion": "Your team billable utilization is 78%, which is optimal. Maintain current staffing levels.",
      "priority": "low"
    }
  ]
}
```

---

## 5. GEMINI SYSTEM PROMPT

### Master System Prompt

```
You are AgencyGPT, the AI Chief Operating Officer for a digital agency.

You have real-time access to:
- All client data (contracts, health scores, communication history)
- All project data (timelines, budgets, team assignments)
- All financial data (revenue, expenses, forecasts)
- All team data (availability, utilization, performance)

YOUR PURPOSE:
Provide intelligent business insights that help agency leaders:
- Make faster decisions
- Identify risks before they become problems
- Spot revenue opportunities
- Optimize team utilization
- Improve profitability
- Maintain client relationships

CAPABILITIES:
- Answer natural language questions about business state
- Forecast revenue, cash flow, and resource needs
- Identify churn risks and opportunities
- Detect project health issues
- Recommend actions based on data

GUIDELINES:
1. Be specific with data - cite sources
2. Always include confidence levels
3. Provide actionable recommendations
4. Flag assumptions and limitations
5. Suggest follow-up questions if needed
6. Use plain business language
7. Be honest about uncertainty
8. Proactively identify risks

TONE: Professional, insightful, action-oriented
```

### Query-Specific Prompts

**Financial Analysis**
```
Analyze the financial health of {org_name}.

Provide:
1. Revenue summary (YTD, this month, forecast)
2. Margin analysis by project/client
3. Cash flow forecast
4. Expense trends
5. Profitability drivers
6. Risk areas

Use data from: projects, invoices, expenses, team capacity.
```

**Client Health Analysis**
```
Analyze client portfolio and identify risks/opportunities.

For each client:
- Health score trend
- Churn risk
- Engagement level
- Contract renewal status
- Upsell opportunities

Identify:
1. High-risk clients needing intervention
2. High-opportunity clients for expansion
3. Trends in portfolio health
```

**Project Status**
```
Provide comprehensive project status across portfolio.

For each active project:
- Timeline health (on track/at risk/delayed)
- Budget health (on budget/trending over)
- Team allocation
- Risk indicators
- Next milestones

Aggregate:
1. Portfolio timeline health
2. Portfolio budget health
3. Team utilization rate
4. Critical path analysis
```

---

## 6. CONVERSATION FLOW EXAMPLE

### Query: "Are we profitable on our client projects?"

```
USER QUERY
"Are we profitable on our client projects?"

INTENT DETECTION
- Intent: financial_analysis
- Entity: projects
- Time frame: current
- Scope: profitability by project

DATA GATHERING
1. Query active projects
2. Get labor costs (team time * hourly rate)
3. Get project revenue (contract value)
4. Calculate margins
5. Identify trends
6. Benchmark against targets

ANALYSIS
Calculate for each project:
  Margin = (Revenue - Labor_Cost) / Revenue
  Margin_Pct = Margin * 100

Aggregate:
  - Average margin across projects
  - Projects above target
  - Projects below target
  - Margin trends
  - Cost drivers

RESPONSE GENERATION
Executive Summary:
"Your agency projects are running at 42% average margin,
which is above your 35% target. However, 3 projects are
trending below profitability targets."

Detailed breakdown:
- Project A: 52% margin (on track)
- Project B: 38% margin (acceptable)
- Project C: 15% margin (at risk)
  └─ Driver: Scope creep detected
  └─ Recommendation: Negotiate change order or descope

Insights & Recommendations:
1. Project C needs immediate attention
2. Team utilization is the primary margin driver
3. Consider implementing change order process

Follow-up questions:
- "What's causing the scope creep on Project C?"
- "Should we adjust pricing for similar projects?"
- "What's our target utilization rate?"
```

---

## 7. CACHING & PERFORMANCE STRATEGY

### Cache Hierarchy

```
TIER 1: Query Cache (15 minutes)
├─ Frequently asked metrics (revenue, margin, utilization)
├─ Client health scores
├─ Project status summaries
└─ Team capacity

TIER 2: Context Cache (1 hour)
├─ Organizational metrics
├─ Client portfolio summary
├─ Project portfolio summary
├─ Financial summaries

TIER 3: Historical Cache (24 hours)
├─ Trend data
├─ Historical comparisons
├─ Forecast models
└─ Archived insights
```

### Query Optimization

```
For each query:
1. Check if exact query in cache (5 second TTL)
2. Identify required data sources
3. Query only needed fields
4. Use indexes on:
   - client_id, project_id, status, created_at
   - org_id + created_at for date ranges
5. Batch aggregate queries
6. Cache result for similar future queries
```

---

## 8. SUCCESS METRICS

```
Primary:
├── Query accuracy (target: >90%)
├── Response time (target: <5 seconds average)
├── Conversation continuation rate (target: >60%)
├── User satisfaction (target: 4.5/5)
├── Monthly active users (target: >70% of team)

Business Impact:
├── Revenue decisions based on AgencyGPT (target: >40% of decisions)
├── Actions taken on recommendations (target: >50%)
├── Revenue recovered from suggested actions (target: >$10K/month)
├── Time saved in decision-making (target: 5+ hours/week)
├── Forecast accuracy (target: >80% within ±10%)

Engagement:
├── Daily active users (target: >50% of team)
├── Average session length (target: >10 minutes)
├── Queries per user per week (target: 10+)
├── Feature adoption (target: 90% of relevant users)
└── Repeat question rate (target: <5%)
```

---

## 9. INTEGRATION POINTS

### Data Sources AgencyGPT Accesses

```
Core Tables:
├─ organizations
├─ clients
├─ projects
├─ tasks
├─ invoices
├─ team_members
├─ time_tracking
├─ proposals
├─ meetings
├─ client_health_scores
├─ scope_creep_alerts
└─ project_milestones

External Integrations:
├─ Salesforce CRM (client data)
├─ Stripe API (payment data)
├─ Slack API (team communication analysis)
├─ Google Calendar (team availability)
├─ Github API (engineering project tracking)
└─ Time tracking tools (actual utilization)
```

### Output Destinations

```
AgencyGPT can:
├─ Send emails with insights
├─ Create Slack notifications
├─ Update CRM opportunities
├─ Generate PDF reports
├─ Schedule automated briefings
├─ Trigger workflows
└─ Update project management tools
```

---

## 10. IMPLEMENTATION ROADMAP

### MVP (Week 1-2)
- Basic Q&A interface
- Revenue & project queries
- Client health Q&A
- Context caching

### V2 (Week 3-4)
- Proactive insights
- Forecasting engine
- Daily briefings
- Saved reports

### V3 (Week 5-6)
- Multi-turn conversations
- Integration with tools (Slack, Salesforce)
- Advanced analytics
- Custom KPI tracking

### V4 (Week 7-8)
- Team collaboration features
- Workflow automation triggers
- Real-time alerts
- Mobile app support

