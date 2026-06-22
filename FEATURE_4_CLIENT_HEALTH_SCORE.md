# FEATURE 4: AI CLIENT HEALTH SCORE
## Production Implementation Guide

---

## 1. HEALTH SCORE ALGORITHM

### Scoring System (0-100)

```
Health Score is calculated from 7 weighted factors:

PAYMENT HEALTH (25%)
├─ Payment timeliness (20 points)
│  ├─ Always on time: 20 points
│  ├─ Occasionally late (1-5 days): 15 points
│  ├─ Frequently late (5-15 days): 10 points
│  ├─ Consistently late (15+ days): 5 points
│  └─ Major defaults: 0 points
├─ Invoice dispute history (5 points)
│  ├─ No disputes: 5 points
│  ├─ 1-2 disputes: 3 points
│  └─ 3+ disputes: 0 points

ENGAGEMENT LEVEL (20%)
├─ Communication responsiveness (10 points)
│  ├─ Responds within 4 hours: 10 points
│  ├─ Responds within 24 hours: 7 points
│  ├─ Responds within 48 hours: 4 points
│  └─ Responds 48+ hours: 0 points
├─ Meeting attendance (10 points)
│  ├─ Never misses meetings: 10 points
│  ├─ Occasionally misses (<1 per month): 7 points
│  ├─ Frequently misses: 3 points
│  └─ Consistently absent: 0 points

ACTIVITY LEVEL (15%)
├─ Recent activity (days since last interaction)
│  ├─ Last week: 15 points
│  ├─ Last month: 10 points
│  ├─ 1-3 months: 5 points
│  └─ 3+ months: 0 points

PROJECT HEALTH (20%)
├─ Project on-time delivery
├─ Project budget adherence
├─ Milestone completion rate
├─ Task completion velocity

RELATIONSHIP STRENGTH (15%)
├─ Contract value growth trend
├─ Contract renewal proximity
├─ Upsell opportunity identification
├─ Reference-ability
```

### Risk Calculations

```
CHURN RISK PROBABILITY (0-1)
= (1 - engagement_score) × declining_activity × payment_issues × budget_variance

UPSELL OPPORTUNITY (0-1)
= growth_trajectory × engagement_level × budget_remaining × contract_room_available

RETENTION PROBABILITY (0-1)
= 1 - churn_risk - (1 - engagement_level × payment_history × project_success)
```

---

## 2. DATABASE SCHEMA

```sql
CREATE TABLE client_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Overall Score
  health_score INT CHECK (health_score >= 0 AND health_score <= 100),
  category ENUM ('excellent', 'healthy', 'warning', 'critical') NOT NULL,
  
  -- Risk Metrics
  churn_risk_probability DECIMAL, -- 0-1
  churn_risk_factors JSONB, -- Detailed breakdown
  
  upsell_score DECIMAL, -- 0-1
  upsell_opportunities JSONB, -- Opportunities identified
  
  retention_probability DECIMAL, -- 0-1
  
  -- Component Scores (0-100)
  payment_health_score INT,
  engagement_score INT,
  activity_score INT,
  project_health_score INT,
  relationship_score INT,
  
  -- Detailed Factors (JSONB)
  factors JSONB,
  -- {
  --   "payment": {
  --     "timeliness": 20,
  --     "disputes": 5,
  --     "days_overdue_avg": 2,
  --     "total_paid": 125000
  --   },
  --   "engagement": {
  --     "avg_response_time_hours": 12,
  --     "meeting_attendance_rate": 0.95,
  --     "meetings_this_month": 4
  --   },
  --   "activity": {
  --     "last_contact": "2026-06-08",
  --     "days_since_contact": 0,
  --     "contact_frequency_7d": 3,
  --     "contact_frequency_30d": 12
  --   },
  --   "projects": {
  --     "active_count": 2,
  --     "on_time_percentage": 0.95,
  --     "budget_adherence": 0.98
  --   }
  -- }
  
  -- Trend Analysis
  trend_30d INT[], -- Daily scores for last 30 days
  trend_direction ENUM ('improving', 'stable', 'declining'),
  trend_change_7d INT, -- Points changed last 7 days
  
  -- Alerts
  risk_alerts JSONB, -- {alert_type: description}
  alert_count INT DEFAULT 0,
  
  -- Next Steps
  recommended_actions JSONB, -- Actions to improve score
  
  -- Calculation Info
  calculated_at TIMESTAMP NOT NULL,
  next_calculation TIMESTAMP NOT NULL,
  calculation_method TEXT DEFAULT 'v1',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE client_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  health_score INT,
  category ENUM ('excellent', 'healthy', 'warning', 'critical'),
  churn_risk DECIMAL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  interaction_type ENUM ('email', 'call', 'meeting', 'message', 'support_ticket'),
  interaction_date TIMESTAMP NOT NULL,
  
  subject TEXT,
  sentiment ENUM ('very_negative', 'negative', 'neutral', 'positive', 'very_positive'),
  sentiment_score DECIMAL, -- 0-1
  
  related_project_id UUID REFERENCES projects(id),
  related_issue TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE churn_risk_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  factor_type ENUM (
    'payment_delays',
    'reduced_engagement',
    'negative_sentiment',
    'project_dissatisfaction',
    'competitor_mention',
    'budget_cuts_planned',
    'lack_of_activity',
    'support_complaints',
    'contract_expiring'
  ),
  
  detected_at TIMESTAMP,
  severity ENUM ('low', 'medium', 'high', 'critical'),
  
  supporting_data JSONB,
  
  action_recommended TEXT,
  action_taken TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. API ENDPOINTS

### GET /api/v1/client-health/{client_id}

**Purpose**: Get client health score

```typescript
Response:
{
  "client_id": "uuid",
  "client_name": "Acme Corp",
  "health_score": 82,
  "category": "healthy",
  "churn_risk_probability": 0.12,
  "upsell_score": 0.65,
  "retention_probability": 0.88,
  "factors": {
    "payment_health_score": 95,
    "engagement_score": 78,
    "activity_score": 85,
    "project_health_score": 80,
    "relationship_score": 75
  },
  "trend": {
    "direction": "stable",
    "change_7d": +2,
    "trend_30d": [80, 80, 81, 82, 82, 82, 82, ...]
  },
  "risk_alerts": [
    "Meeting attendance declining (1 missed in last 30 days)"
  ],
  "recommended_actions": [
    "Schedule quarterly business review",
    "Discuss upcoming project opportunities",
    "Gather feedback on recent deliverables"
  ],
  "calculated_at": "2026-06-08T10:00:00Z",
  "next_calculation": "2026-06-09T10:00:00Z"
}
```

### GET /api/v1/client-health/organization

**Purpose**: Get health scores for all clients in organization

```typescript
Response:
{
  "organization_metrics": {
    "average_health_score": 72,
    "clients_excellent": 3,
    "clients_healthy": 8,
    "clients_warning": 4,
    "clients_critical": 1,
    "average_churn_risk": 0.18
  },
  "clients": [
    {
      "client_id": "uuid",
      "name": "Acme Corp",
      "health_score": 82,
      "category": "healthy",
      "churn_risk": 0.12,
      "contract_value": 50000,
      "renewal_date": "2026-12-31"
    }
  ],
  "at_risk_clients": [
    {
      "client_id": "uuid",
      "name": "Risk Corp",
      "health_score": 35,
      "category": "critical",
      "churn_risk": 0.78,
      "recommended_action": "Immediate outreach required"
    }
  ]
}
```

### POST /api/v1/client-health/{client_id}/recalculate

**Purpose**: Manually trigger health score recalculation

```typescript
Response:
{
  "success": true,
  "new_score": 82,
  "previous_score": 80,
  "score_change": +2,
  "recalculated_at": "2026-06-08T10:05:00Z"
}
```

### POST /api/v1/client-health/{client_id}/action

**Purpose**: Record action taken to improve client health

```typescript
Request Body:
{
  "action_type": "scheduled_call|sent_survey|executive_review|discount_offered|new_project_proposed",
  "description": "Scheduled Q3 business review",
  "expected_impact": "Increase engagement and identify new opportunities"
}

Response:
{
  "success": true,
  "action_id": "uuid",
  "recorded_at": "2026-06-08T10:10:00Z"
}
```

### GET /api/v1/client-health/dashboard

**Purpose**: Executive health dashboard

```typescript
Response:
{
  "portfolio_overview": {
    "total_active_clients": 16,
    "total_contract_value": 1200000,
    "portfolio_health_score": 74,
    "average_churn_risk": 0.18
  },
  "segmentation": {
    "excellent": { count: 3, value: 200000 },
    "healthy": { count: 8, value: 700000 },
    "warning": { count: 4, value: 250000 },
    "critical": { count: 1, value: 50000 }
  },
  "risk_matrix": [
    {
      "client": "Risk Corp",
      "health_score": 35,
      "contract_value": 50000,
      "churn_risk": 0.78,
      "retention_actions_count": 0
    }
  ],
  "opportunities": [
    {
      "client": "Growth Corp",
      "health_score": 88,
      "upsell_score": 0.82,
      "recommended_services": ["Advanced Analytics", "Team Expansion"]
    }
  ]
}
```

---

## 4. GEMINI PROMPT FOR HEALTH ANALYSIS

### System Prompt

```
You are a client success analyst specializing in predicting B2B customer churn
and identifying upsell opportunities.

You analyze:
- Payment patterns
- Communication frequency and tone
- Project health indicators
- Market/competitive factors
- Contract status and trends

Your analysis helps agencies retain customers and grow revenue.
```

### Analysis Prompt

```
Calculate comprehensive health score and churn prediction for this client:

CLIENT PROFILE
Name: {client_name}
Industry: {client_industry}
Contract Value: ${contract_value}
Contract Renewal: {renewal_date}
Months as Client: {tenure_months}

PAYMENT HISTORY (Last 12 months)
├─ On-time payments: {on_time_count}/12
├─ Late payments: {late_count}
├─ Average days late: {avg_days_late}
├─ Disputes: {dispute_count}
└─ Total paid: ${total_paid}

ENGAGEMENT METRICS
├─ Avg response time: {avg_response_hours} hours
├─ Meetings this year: {meetings_count}
├─ Meeting attendance rate: {attendance_rate}%
├─ Last contact: {days_since_contact} days ago
└─ Messages this month: {messages_count}

PROJECT HEALTH
├─ Active projects: {active_projects}
├─ Completed on time: {on_time_projects}%
├─ Budget adherence: {budget_adherence}%
├─ Satisfaction score: {satisfaction_score}/10

RECENT INTERACTIONS
{recent_interactions_summary}

MARKET CONTEXT
├─ Any competitive threats mentioned: {competitive_threats}
├─ Budget discussions: {budget_discussions}
├─ Staff changes: {staff_changes}

ANALYSIS REQUESTED:
1. Overall health score (0-100)
2. Churn risk probability (0-1) with key risk factors
3. Upsell opportunities with reasoning
4. Recommended retention actions
5. 90-day forecast
6. Contract renewal risk

OUTPUT (JSON ONLY):
{
  "health_score": 82,
  "category": "healthy|excellent|warning|critical",
  "churn_risk": {
    "probability": 0.12,
    "factors": ["Payment patterns stable", "Engagement declining"],
    "risk_level": "low|medium|high|critical"
  },
  "upsell_opportunity": {
    "score": 0.65,
    "opportunities": [
      "Expand to additional team members",
      "Upgrade to premium tier"
    ]
  },
  "retention_probability": 0.88,
  "recommended_actions": [
    "Schedule quarterly business review",
    "Present case studies of similar results"
  ],
  "forecast_90d": {
    "likely_status": "retained|at_risk|expansion|contraction",
    "confidence": 0.82
  }
}
```

---

## 5. AUTOMATED ALERTS & WORKFLOWS

### Alert Triggers

```typescript
if (payment_latency > 15 days) {
  createAlert('PAYMENT_DELAY', 'medium', {
    days_late: payment_latency,
    action: 'Send payment reminder'
  });
}

if (response_time_avg > 48 hours) {
  createAlert('ENGAGEMENT_DECLINING', 'low', {
    avg_hours: response_time_avg,
    trend: 'declining',
    action: 'Schedule check-in call'
  });
}

if (days_since_contact > 30) {
  createAlert('INACTIVITY', 'medium', {
    days: days_since_contact,
    action: 'Send check-in email or schedule call'
  });
}

if (meeting_attendance_rate < 0.7) {
  createAlert('DISENGAGEMENT', 'medium', {
    attendance_rate: meeting_attendance_rate,
    action: 'Understand reasons for missed meetings'
  });
}

if (churn_probability > 0.6) {
  createAlert('CHURN_RISK_HIGH', 'critical', {
    probability: churn_probability,
    action: 'Executive intervention required'
  });
}
```

### Automated Workflows

**Weekly Client Health Check**
```
For each client:
1. Calculate new health score
2. Compare to previous week
3. If score dropped >5 points:
   a. Identify why
   b. Alert account manager
   c. Suggest action
4. If churn_risk > 0.6:
   a. Flag for leadership review
   b. Prepare retention strategy
5. Send digest to executive team
```

**Monthly Renewal Forecast**
```
For clients within 60 days of renewal:
1. Calculate renewal risk
2. Identify if upsell opportunity exists
3. Recommend pre-renewal action
4. Schedule executive touch-point
5. Prepare renewal conversation strategy
```

---

## 6. SUCCESS METRICS

```
Primary:
├── Health score prediction accuracy (target: >85%)
├── Churn risk prediction accuracy (target: >80%)
├── False positive rate for churn alerts (target: <15%)
├── Clients with documented retention actions (target: >60%)
└── User adoption of health dashboard (target: >70%)

Financial:
├── Churn prevention rate (target: >20% of at-risk clients)
├── Upsell success rate (target: >30% of high-opportunity clients)
├── Contract value increase from upsells (target: +$50K/month)
└── Cost per retained customer (target: <$500)

Operational:
├── Time spent on at-risk client management (target: <5 hrs/month)
├── Proactive vs reactive engagement ratio (target: 70/30)
├── Client satisfaction with proactive outreach (target: >4/5)
└── Account team adoption rate (target: >80%)
```

---

## 7. IMPLEMENTATION ROADMAP

### MVP (Week 1-2)
- Basic scoring algorithm
- Payment + engagement factors
- Health dashboard
- Email alerts

### V2 (Week 3-4)
- Churn prediction model
- Upsell identification
- Retention workflows
- Integration with CRM

### V3 (Week 5-6)
- Advanced ML model training
- Predictive renewal forecasting
- Executive dashboards
- Automated retention campaigns

