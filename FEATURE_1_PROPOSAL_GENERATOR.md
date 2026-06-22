# FEATURE 1: AI PROPOSAL GENERATOR
## Production Implementation Guide

---

## 1. USER FLOW

### Flow Diagram
```
User Dashboard
    ↓
Create New Proposal (Button)
    ↓
Proposal Input Form (5-10 minutes)
    ├─ Client selection or new client
    ├─ Service type selection
    ├─ Project description (textarea)
    ├─ Goals & objectives
    ├─ Budget range selector
    ├─ Timeline selector
    └─ Additional notes (optional)
    ↓
Review Generated Proposal (Auto-generated in 30s)
    ├─ Executive Summary
    ├─ Project Overview
    ├─ Scope of Work
    ├─ Deliverables List
    ├─ Timeline & Milestones
    ├─ Pricing Breakdown
    ├─ Payment Terms
    ├─ Assumptions
    └─ Next Steps
    ↓
User Actions (Choose one or multiple)
    ├─ Save as Draft
    ├─ Save & Duplicate (for variations)
    ├─ Edit Sections (inline editing)
    ├─ Change Pricing
    ├─ Regenerate (with tweaks)
    ├─ Export to PDF/Word
    ├─ Send to Client (Email)
    ├─ Share Link (Encrypted)
    └─ Create Template (Save as reusable)
    ↓
Track Engagement
    ├─ View counts
    ├─ Open tracking
    ├─ Time spent
    └─ Client acceptance/rejection
```

---

## 2. DATABASE SCHEMA

### Main Tables

```sql
-- Enhanced Proposals Table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Basic Info
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  industry TEXT,
  project_description TEXT,
  goals TEXT,
  additional_notes TEXT,
  budget_range JSONB, -- { min, max, currency }
  timeline TEXT,
  
  -- Generated Content
  proposal_content JSONB NOT NULL,
  -- Structure:
  -- {
  --   "executiveSummary": "string",
  --   "overview": "string",
  --   "scope": "string",
  --   "deliverables": ["item1", "item2"],
  --   "timeline": "string",
  --   "milestones": [{ "name", "description", "dueDate" }],
  --   "pricing": { "breakdown": "string", "total": 50000, "currency": "USD" },
  --   "paymentTerms": "string",
  --   "assumptions": "string",
  --   "nextSteps": "string"
  -- }
  
  -- Status Tracking
  status ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected') DEFAULT 'draft',
  version INT DEFAULT 1,
  parent_proposal_id UUID REFERENCES proposals(id), -- For duplicates
  template_id UUID REFERENCES proposal_templates(id),
  
  -- Engagement Metrics
  view_count INT DEFAULT 0,
  last_viewed_at TIMESTAMP,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  sent_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB, -- Custom fields, tags, etc
  ai_model_used TEXT DEFAULT 'gemini-2.5-flash',
  generation_time_ms INT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Proposal History (Version Control)
CREATE TABLE proposal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_type ENUM ('created', 'edited', 'sent', 'accepted', 'regenerated') NOT NULL,
  change_description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Proposal Templates
CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  service_type TEXT,
  template_structure JSONB NOT NULL, -- {sections, format, styling}
  base_content JSONB, -- Default sections
  
  usage_count INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Proposal Analytics
CREATE TABLE proposal_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  -- View tracking
  view_count INT DEFAULT 0,
  unique_views INT DEFAULT 0,
  total_view_time_seconds INT DEFAULT 0,
  
  -- Engagement
  page_views JSONB, -- { "page1": count, "page2": count }
  device_info JSONB, -- { os, browser, device_type }
  location_info JSONB,
  
  -- Performance
  avg_time_per_page_seconds DECIMAL,
  bounce_rate DECIMAL,
  completion_rate DECIMAL,
  
  -- Conversion
  opened_at TIMESTAMP,
  first_interaction_at TIMESTAMP,
  decision_made_at TIMESTAMP,
  decision_status ENUM ('accepted', 'rejected', 'no_decision'),
  
  tracked_at TIMESTAMP DEFAULT NOW()
);

-- Shared Proposals (Client Links)
CREATE TABLE proposal_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  share_token TEXT UNIQUE NOT NULL,
  recipient_email TEXT,
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  expires_at TIMESTAMP,
  is_expired BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0
);
```

---

## 3. API ENDPOINTS

### POST /api/v1/proposals/generate

**Purpose**: Generate proposal using AI

```typescript
Request Body:
{
  "client_name": "John Smith",
  "company_name": "TechCorp Inc",
  "industry": "SaaS",
  "service_type": "Web Development",
  "project_description": "Build a customer portal for our platform",
  "goals": "Increase customer satisfaction, reduce support tickets",
  "budget": { "min": 25000, "max": 50000 },
  "timeline": "3 months",
  "additional_notes": "Must integrate with Salesforce"
}

Response (Streaming):
{
  "success": true,
  "proposal_id": "uuid",
  "status": "generating",
  "stream": "Server-Sent Events (SSE)"
}

# Streamed content:
event: progress
data: { "stage": "generating_summary", "percent": 20 }

event: proposal_section
data: { "section": "executiveSummary", "content": "..." }

event: complete
data: { "proposal_id": "uuid", "total_time_ms": 2500 }
```

**Error Handling**:
```
400 - Invalid input (missing fields)
402 - Insufficient AI credits
429 - Rate limited
500 - AI service error
```

### GET /api/v1/proposals/{id}

**Purpose**: Fetch proposal details

```typescript
Response:
{
  "id": "uuid",
  "client_name": "John Smith",
  "status": "draft",
  "proposal_content": { ... },
  "created_at": "2026-06-08T10:00:00Z",
  "analytics": {
    "view_count": 5,
    "last_viewed_at": "2026-06-08T14:00:00Z"
  }
}
```

### PUT /api/v1/proposals/{id}

**Purpose**: Update proposal sections

```typescript
Request Body:
{
  "proposal_content": { ... }, // Partial update
  "metadata": { "tags": ["urgent"] }
}

Response:
{
  "success": true,
  "version": 2,
  "updated_at": "2026-06-08T10:05:00Z"
}
```

### POST /api/v1/proposals/{id}/duplicate

**Purpose**: Create copy of proposal

```typescript
Request Body:
{
  "new_client_name": "New Client",
  "variations": ["pricing_adjustment"] // Optional
}

Response:
{
  "success": true,
  "new_proposal_id": "uuid",
  "new_client_name": "New Client",
  "created_at": "2026-06-08T10:10:00Z"
}
```

### POST /api/v1/proposals/{id}/export-pdf

**Purpose**: Export proposal as PDF

```typescript
Request Body:
{
  "format": "pdf", // or "docx", "html"
  "include_cover_page": true,
  "custom_watermark": "PROPOSAL"
}

Response:
// Binary file download or
{
  "success": true,
  "download_url": "https://..."
}
```

### POST /api/v1/proposals/{id}/send

**Purpose**: Send proposal to client

```typescript
Request Body:
{
  "recipient_email": "client@company.com",
  "subject": "Custom subject",
  "message": "Custom message body",
  "track_opens": true
}

Response:
{
  "success": true,
  "sent_at": "2026-06-08T10:15:00Z",
  "tracking_id": "uuid"
}
```

### POST /api/v1/proposals/{id}/regenerate

**Purpose**: Regenerate proposal with modifications

```typescript
Request Body:
{
  "modifications": {
    "budget_adjustment": "+10%",
    "timeline_adjustment": "4 months",
    "focus_areas": ["cost_reduction", "faster_delivery"]
  }
}

Response:
{
  "success": true,
  "new_version": 3,
  "stream": "Server-Sent Events (SSE)"
}
```

### GET /api/v1/proposals/{id}/analytics

**Purpose**: Get proposal performance analytics

```typescript
Response:
{
  "proposal_id": "uuid",
  "views": 5,
  "unique_viewers": 3,
  "total_time_viewed": 1200, // seconds
  "pages_viewed": {
    "executiveSummary": 5,
    "pricing": 4,
    "deliverables": 3
  },
  "decision_status": "pending",
  "engagement_score": 0.75
}
```

---

## 4. GEMINI PROMPT ENGINEERING

### System Prompt

```
You are a world-class agency proposal writer with 20+ years of experience.
You write winning proposals that close deals for digital agencies, marketing firms,
and software development companies.

CRITICAL RULES:
1. Write specific, tailored proposals - NO generic content
2. Every section must reference the client's actual industry and goals
3. Write plain text - NO markdown symbols (no **, #, •)
4. All dates must be 2026-06-08 or later
5. Budgets must be realistic for the service type
6. Tone: Professional, confident, benefit-focused
7. Avoid overused phrases like "leveraging best practices" or "synergize"
8. Each section must be 2-3 substantial paragraphs

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown. No code fences.
{
  "executiveSummary": "3 compelling paragraphs specific to the client",
  "overview": "2-3 paragraphs about the project",
  "scope": "Flowing paragraphs describing work (no bullets)",
  "deliverables": ["item1", "item2", ... "item12"],
  "timeline": "Narrative timeline description",
  "milestones": [{"name": "", "description": "", "dueDate": "YYYY-MM-DD"}],
  "pricing": {"breakdown": "text", "total": 50000, "currency": "USD"},
  "paymentTerms": "Specific payment schedule",
  "assumptions": "Project assumptions",
  "nextSteps": "3-4 specific next steps"
}
```

### User Prompt Template

```
Generate a professional agency proposal for this client:

CLIENT PROFILE
Name: {client_name}
Company: {company_name}
Industry: {industry}
Current Challenge: {project_description}
Business Goals: {goals}
Preferred Timeline: {timeline}
Budget Range: ${budget_min} - ${budget_max}
{additional_notes ? `Additional Context: ${additional_notes}` : ''}

SERVICE BEING PROPOSED
Type: {service_type}

IMPORTANT:
- Tailor every section specifically to {company_name}'s {industry} industry
- Use realistic timelines and budgets
- Make it feel custom, not generic
- Confidence-building language without hyperbole
- Focus on outcomes, not just deliverables
- Assume the client will decide today if pricing is right
```

### Prompt Variations (by Service Type)

**Web Development Service**
```
Additional context for {company_name}:
- Focus on user experience improvements
- Mention security and performance
- Include browser compatibility
- Timeline should account for testing
- Deliverables: wireframes, designs, code, testing, deployment
```

**Marketing Service**
```
Additional context for {company_name}:
- Focus on ROI and measurable results
- Mention competitor analysis
- Include analytics and reporting
- Timeline should show campaign phases
- Deliverables: strategy, content, ads, tracking, reporting
```

**Consulting Service**
```
Additional context for {company_name}:
- Focus on strategic impact
- Mention stakeholder alignment
- Include implementation roadmap
- Timeline should show discovery → planning → execution
- Deliverables: audit, recommendations, roadmap, training
```

---

## 5. TYPESCRIPT INTERFACES

```typescript
// src/lib/types/proposals.ts

export interface ProposalGenerateRequest {
  client_name: string;
  company_name: string;
  industry: string;
  service_type: string;
  project_description: string;
  goals: string;
  budget?: { min: number; max: number; currency?: string };
  timeline: string;
  additional_notes?: string;
  template_id?: string; // Optional template to base on
}

export interface Milestone {
  name: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
}

export interface PricingData {
  breakdown: string;
  total: number;
  currency: string;
}

export interface ProposalContent {
  executiveSummary: string;
  overview: string;
  scope: string;
  deliverables: string[];
  timeline: string;
  milestones: Milestone[];
  pricing: PricingData;
  paymentTerms: string;
  assumptions: string;
  nextSteps: string;
}

export interface Proposal {
  id: string;
  org_id: string;
  client_id?: string;
  created_by: string;
  
  title: string;
  client_name: string;
  company_name: string;
  service_type: string;
  industry?: string;
  
  proposal_content: ProposalContent;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  version: number;
  
  view_count: number;
  last_viewed_at?: string;
  sent_at?: string;
  accepted_at?: string;
  
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProposalAnalytics {
  proposal_id: string;
  view_count: number;
  unique_views: number;
  total_view_time_seconds: number;
  page_views: Record<string, number>;
  device_info: { os: string; browser: string; device_type: string };
  engagement_score: number; // 0-1
  decision_status?: 'accepted' | 'rejected' | 'pending';
}

export interface GenerateProposalResponse {
  success: boolean;
  proposal_id: string;
  status: 'generating' | 'complete';
  stream?: EventSource; // For SSE
}
```

---

## 6. RATE LIMITING & QUOTAS

```typescript
// Quotas per tier (monthly)
const QUOTAS = {
  free: {
    proposals_per_month: 5,
    max_team_size: 1,
    template_storage: 3,
  },
  pro: {
    proposals_per_month: Infinity,
    max_team_size: 5,
    template_storage: 50,
  },
  business: {
    proposals_per_month: Infinity,
    max_team_size: 50,
    template_storage: 500,
  },
  enterprise: {
    proposals_per_month: Infinity,
    max_team_size: Infinity,
    template_storage: Infinity,
  },
};

// Rate limiting
const RATE_LIMITS = {
  'POST /api/v1/proposals/generate': '10 per minute', // Prevent spam
  'PUT /api/v1/proposals/:id': '100 per minute',
  'GET /api/v1/proposals': '60 per minute',
};
```

---

## 7. COST ANALYSIS

### Per-Proposal Cost

```
Gemini API:
  - Average tokens: 3,000 input + 2,000 output
  - Cost: $0.075 input + $0.30 output = $0.375/proposal

Storage:
  - Average proposal: 50KB
  - Cost per 1M proposals: ~$10/month = $0.00001/proposal

Infrastructure:
  - Compute amortized
  - Total: ~$0.50/proposal

TOTAL COST PER PROPOSAL: ~$0.50
```

### Profitability by Tier

```
Free tier (5 proposals/month):
  Revenue: $0
  Cost: $2.50
  Status: Loss leader

Pro tier (unlimited @ $99/month):
  Average usage: 20 proposals/month
  Cost: $10
  Revenue: $99
  Gross margin: 90%

Business tier (unlimited @ $299/month):
  Average usage: 50 proposals/month
  Cost: $25
  Revenue: $299
  Gross margin: 92%
```

---

## 8. IMPLEMENTATION CHECKLIST

- [ ] Database schema created
- [ ] API endpoints implemented
- [ ] Gemini integration tested
- [ ] Streaming response working
- [ ] Error handling complete
- [ ] Rate limiting configured
- [ ] Analytics tracking added
- [ ] Security (RLS) policies set
- [ ] PDF export working
- [ ] Email sending verified
- [ ] Version history working
- [ ] UI components built
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] Unit tests written
- [ ] Integration tests complete
- [ ] Documentation written
- [ ] Production deployment

---

## 9. SUCCESS METRICS

```
Primary Metrics:
├── Proposal generation success rate (target: 98%)
├── Average generation time (target: <30s)
├── User adoption rate (target: >60% of signups)
├── Proposal acceptance rate (target: >40%)
└── Feature retention (target: >70% weekly active)

Secondary Metrics:
├── Proposal-to-revenue conversion
├── Average proposal value
├── Time saved vs. manual writing (target: 90% faster)
├── Customer satisfaction score (target: 4.5/5)
└── Support tickets related to proposals
```

