# AgencyFlow AI Operating System
## Master Architecture Document
### A $100M SaaS Platform for Modern Agencies

---

## EXECUTIVE OVERVIEW

**Mission**: Transform agency operations through AI-powered automation, intelligence, and decision-making.

**Platform Pillars**:
1. **AI Proposal Generator** - Generate $50K+ proposals in 30 seconds
2. **AI Meeting Summary** - Convert meetings into actionable intelligence
3. **AI Scope Creep Detector** - Prevent revenue leakage automatically
4. **AI Client Health Score** - Predict churn before it happens
5. **AgencyGPT** - AI COO for real-time business intelligence

**Target Market**: 
- Mid-market agencies ($2M-$50M ARR)
- Fast-growing agencies (10-100 employees)
- Service-based businesses requiring proposal velocity

**Total Addressable Market**: $12B+ (3,000+ qualifying agencies in US alone)

---

## TECHNOLOGY STACK

### Core Infrastructure
```
Frontend:     Next.js 16 + React 19 + TypeScript
UI Library:   Tailwind CSS + shadcn/ui components
State:        React hooks + Context API
Database:     PostgreSQL (Supabase)
Auth:         Supabase Auth + OAuth2
API:          Next.js API Routes (REST)
AI Model:     Google Gemini 2.5 Flash (primary), GPT-4 (fallback)
File Storage: Supabase Storage (S3-compatible)
Queue:        Bull Redis (async tasks)
Cache:        Redis (session, rate limiting)
Search:       PostgreSQL Full-Text Search
Real-time:    Supabase Realtime
Deployment:   Vercel (auto-scaling)
Monitoring:   Datadog + Sentry
Analytics:    Mixpanel + PostHog
```

### API Architecture
```
REST Endpoints:
  /api/v1/proposals/*
  /api/v1/meetings/*
  /api/v1/scope-detector/*
  /api/v1/client-health/*
  /api/v1/agency-gpt/*
  /api/v1/webhooks/*
  /api/v1/integrations/*

WebSocket (Realtime):
  /socket/collaborate
  /socket/notifications
  /socket/stream-responses

Streaming Responses:
  AI proposal generation
  Meeting transcription processing
  Client health recalculation
```

---

## DATABASE ARCHITECTURE

### Core Tables

#### 1. ORGANIZATIONS (Multi-tenant)
```sql
organizations
├── id (UUID, PK)
├── name (TEXT)
├── slug (TEXT, UNIQUE)
├── logo_url (TEXT)
├── subscription_tier (ENUM: 'starter', 'pro', 'enterprise')
├── ai_credits (INT) - Monthly allowance
├── ai_credits_used (INT)
├── features_enabled (JSONB) - Feature flags
├── settings (JSONB) - Org-wide settings
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
```

#### 2. PROPOSALS
```sql
proposals
├── id (UUID, PK)
├── org_id (UUID, FK) - Organization
├── client_id (UUID, FK) - Client reference
├── title (TEXT)
├── description (TEXT)
├── status (ENUM: 'draft', 'sent', 'viewed', 'accepted', 'rejected')
├── proposal_content (JSONB)
│   ├── executiveSummary
│   ├── scope
│   ├── deliverables[]
│   ├── timeline
│   ├── milestones[]
│   ├── pricing{ breakdown, total, currency }
│   ├── paymentTerms
│   ├── assumptions
│   ├── nextSteps
├── template_id (UUID, FK) - Template used
├── version (INT)
├── metadata (JSONB)
├── view_count (INT)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── sent_at (TIMESTAMP)
├── accepted_at (TIMESTAMP)
```

#### 3. MEETINGS
```sql
meetings
├── id (UUID, PK)
├── org_id (UUID, FK)
├── client_id (UUID, FK)
├── project_id (UUID, FK)
├── title (TEXT)
├── transcript_raw (TEXT) - Raw meeting transcript
├── transcript_cleaned (TEXT)
├── duration_minutes (INT)
├── meeting_date (TIMESTAMP)
├── source (ENUM: 'zoom', 'google_meet', 'manual', 'audio_upload')
├── source_url (TEXT)
├── meeting_summary (JSONB)
│   ├── summary
│   ├── key_decisions[]
│   ├── action_items[]
│   ├── risks[]
│   ├── client_requests[]
│   ├── deadlines[]
│   ├── missing_info[]
├── sentiment_analysis (JSONB)
├── attendees (JSONB)
├── created_at (TIMESTAMP)
```

#### 4. SCOPE_CREEP_ALERTS
```sql
scope_creep_alerts
├── id (UUID, PK)
├── org_id (UUID, FK)
├── project_id (UUID, FK)
├── client_id (UUID, FK)
├── alert_type (ENUM: 'new_request', 'expansion', 'hidden_deliverable', 'timeline_impact')
├── risk_level (ENUM: 'low', 'medium', 'high')
├── description (TEXT)
├── detected_in (ENUM: 'email', 'note', 'meeting', 'task', 'message')
├── source_data (JSONB)
├── suggested_action (ENUM: 'change_order', 'invoice', 'approval_needed')
├── estimated_cost (DECIMAL)
├── estimated_hours (INT)
├── acknowledged_at (TIMESTAMP)
├── action_taken (TEXT)
├── created_at (TIMESTAMP)
```

#### 5. CLIENT_HEALTH_SCORES
```sql
client_health_scores
├── id (UUID, PK)
├── org_id (UUID, FK)
├── client_id (UUID, FK)
├── health_score (INT) - 0-100
├── category (ENUM: 'excellent', 'healthy', 'warning', 'critical')
├── churn_risk_probability (DECIMAL) - 0-1
├── upsell_score (DECIMAL)
├── retention_probability (DECIMAL)
├── factors (JSONB)
│   ├── payment_health
│   ├── engagement_level
│   ├── support_sentiment
│   ├── response_speed
│   ├── activity_trend
├── trend_30d (INT[]) - Daily scores
├── calculated_at (TIMESTAMP)
└── next_calculation (TIMESTAMP)
```

#### 6. AGENCY_GPT_CONTEXT
```sql
agency_gpt_context
├── id (UUID, PK)
├── org_id (UUID, FK)
├── user_id (UUID, FK)
├── query (TEXT)
├── context_data (JSONB)
│   ├── clients_summary
│   ├── projects_status
│   ├── revenue_forecast
│   ├── team_utilization
│   ├── recent_proposals
│   ├── overdue_items
├── response (TEXT)
├── sources (TEXT[]) - Data sources used
├── confidence_score (DECIMAL)
├── feedback_rating (INT) - 1-5 user rating
├── created_at (TIMESTAMP)
```

#### 7. AI_USAGE_LOG
```sql
ai_usage_log
├── id (UUID, PK)
├── org_id (UUID, FK)
├── feature (ENUM: 'proposal', 'meeting', 'scope_detector', 'health_score', 'agency_gpt')
├── model (TEXT) - 'gemini-2.5-flash', etc
├── tokens_input (INT)
├── tokens_output (INT)
├── cost_usd (DECIMAL)
├── latency_ms (INT)
├── status (ENUM: 'success', 'error', 'rate_limited')
├── created_at (TIMESTAMP)
```

---

## API RATE LIMITING & QUOTAS

### Free Tier
- 5 proposals/month
- 10 meeting summaries/month
- Scope creep detection: Limited
- Health scores: Manual only
- AgencyGPT: 5 queries/day

### Pro Tier ($99/month)
- Unlimited proposals
- 50 meeting summaries/month
- Unlimited scope detection
- Automated health scores
- 100 AgencyGPT queries/day
- Advanced analytics

### Enterprise (Custom)
- Unlimited everything
- Dedicated support
- Custom integrations
- On-premise deployment option
- SLA guarantees

---

## SECURITY ARCHITECTURE

### Authentication & Authorization
```
├── OAuth2 + JWT tokens
├── Role-based access control (RBAC)
│   ├── Admin
│   ├── Manager
│   ├── Team Member
│   └── Client (limited access)
├── Row-level security (RLS) policies
├── API key authentication for integrations
└── 2FA support
```

### Data Protection
```
├── AES-256 encryption at rest
├── TLS 1.3 in transit
├── PII masking in logs
├── Regular penetration testing
├── SOC 2 Type II compliance
└── GDPR data export/deletion
```

### Rate Limiting
```
├── IP-based: 1000 requests/minute
├── User-based: 100 requests/minute
├── AI feature: Token-based (monthly quota)
├── Endpoint-specific limits
└── Graceful degradation
```

---

## MONETIZATION STRATEGY

### Pricing Tiers

**Free**
- Limited AI usage
- Basic proposal templates
- Single user
- 30-day data retention
- Community support

**Pro** ($99/month)
- 10,000 monthly AI tokens
- Unlimited proposals
- Team collaboration (5 users)
- All features
- Priority email support
- 1-year data retention

**Business** ($299/month)
- 50,000 monthly AI tokens
- Advanced analytics
- Unlimited users
- Custom templates
- Email + Slack support
- Custom integrations

**Enterprise** (Custom)
- Unlimited AI tokens
- Dedicated account manager
- SLA guarantee (99.9% uptime)
- On-premise deployment
- Custom feature development
- Phone + priority support

### Expansion Revenue
```
Add-ons:
├── Extra AI tokens: $0.001 per token
├── Advanced analytics: +$50/month
├── Custom integrations: +$100-1000
├── White-label solution: +$500/month
└── Priority support: +$200/month

Upsell triggers:
├── Using 80%+ monthly quota
├── Team size > 10
├── Revenue > $5M/year
└── Enterprise features used
```

---

## DEVELOPMENT ROADMAP

### Phase 1: MVP (Weeks 1-4)
- ✅ AI Proposal Generator (basic)
- Database schema setup
- Core UI components
- Authentication

### Phase 2: Intelligence Layer (Weeks 5-8)
- AI Meeting Summary
- Basic health scoring
- Scope creep detection (simple)
- Analytics dashboard

### Phase 3: Automation & Prediction (Weeks 9-12)
- Advanced health scoring
- Automated alerts
- Scope creep automation
- Integration framework

### Phase 4: AgencyGPT (Weeks 13-16)
- Conversational AI interface
- Context management
- Multi-source data integration
- Proactive recommendations

### Phase 5: Scale & Polish (Weeks 17-20)
- Performance optimization
- Enterprise features
- Advanced analytics
- Customer success tools

---

## COMPETITIVE ADVANTAGES

### Why AgencyFlow Wins:

**1. Proposal Velocity**
- Competitors: Proposify (2-5 min), PandaDoc (1-3 min)
- AgencyFlow: 30 seconds with AI customization
- Moat: Proprietary agency-specific prompt training

**2. Meeting Intelligence**
- Competitors: None do this well in agency space
- AgencyFlow: Automatic action item creation + CRM integration
- Moat: Real-time transcription + project linking

**3. Scope Creep Detection**
- Competitors: Nobody doing this
- AgencyFlow: Predictive scope expansion alerts
- Moat: AI analyzes all communication channels

**4. Integrated Operating System**
- Competitors: Fragmented tools (Asana + Salesforce + Proposify)
- AgencyFlow: Unified platform with AI at core
- Moat: Network effects + data integration

**5. Agency-First Design**
- Built by agencies, for agencies
- Understands agency metrics (project margin, utilization, ARR)
- Industry-specific templates and workflows

### Market Positioning

```
Proposify:        Proposal tool
PandaDoc:         Proposal + document tool
HubSpot:          Broad CRM (not agency-focused)
ClickUp:          Project management
Monday.com:       Project management

AgencyFlow:       Unified AI Operating System
                  (Proposals + Projects + Clients + Intelligence)
```

---

## COST STRUCTURE & PROFITABILITY

### COGS per Customer (Monthly)

```
AI Model Costs:
├── Proposal generation: $0.05-0.15
├── Meeting processing: $0.10-0.30
├── Scope detection: $0.02-0.08
├── Health scoring: $0.01-0.03
├── AgencyGPT queries: $0.03-0.10
└── Total/customer: ~$0.50-1.00

Infrastructure:
├── Database: $2-5 per customer
├── Storage: $0.50-2
├── Compute: $1-3
└── Total: ~$5-15 per customer

Payment Processing:
├── Stripe fees: 2.9% of revenue
└── Total: $2-5 depending on plan

Total COGS per customer: $8-20
```

### Unit Economics (Pro Tier @ $99/month)

```
Revenue:              $99
COGS:                -$15
Gross Profit:         $84 (85% margin)
Support:             -$10
R&D allocation:      -$20
Sales/Marketing:     -$25
Overhead allocation: -$10
Net Margin:           $19 (19%)

LTV (3-year):        $1,425
CAC:                 $200
LTV/CAC ratio:       7.1x ✓ (Excellent)
```

### Growth Projections (Year 1)

```
Q1: 50 customers → $5K MRR
Q2: 150 customers → $15K MRR  
Q3: 300 customers → $30K MRR
Q4: 600 customers → $60K MRR

Year 1 Total: ~$110K ARR
```

---

## INFRASTRUCTURE SCALING STRATEGY

### Database Scaling
```
├── Replication: Multi-region read replicas
├── Sharding: By org_id for horizontal scaling
├── Indexing: Composite indexes on common queries
├── Caching: Redis for frequently accessed data
└── Archive: Move old data to cold storage
```

### API Scaling
```
├── Horizontal: Vercel auto-scaling
├── Load balancing: Geographic distribution
├── Queue: Bull Redis for async tasks
├── CDN: Vercel edge caching
└── Rate limiting: Redis-based token bucket
```

### AI Model Optimization
```
├── Prompt caching: Gemini cached prompts
├── Batch processing: Off-peak AI calls
├── Model selection: Smaller models for simple tasks
├── Cost optimization: Mix of Flash + Pro models
└── Fallback: GPT-4 for high-complexity tasks
```

---

## NEXT STEPS

This master architecture provides the foundation. Each feature will have:

1. **Detailed User Flows** (Figma wireframes)
2. **Complete Database Schemas** (SQL)
3. **Full API Specifications** (OpenAPI)
4. **TypeScript Interfaces** (Type definitions)
5. **Gemini Prompt Engineering** (System + User prompts)
6. **UI Component Library** (React components)
7. **Security Checklist** (Implementation details)
8. **Deployment Guide** (Vercel + Supabase)

See FEATURE_IMPLEMENTATIONS for detailed specs for each feature.
