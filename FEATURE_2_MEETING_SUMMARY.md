# FEATURE 2: AI MEETING SUMMARY
## Production Implementation Guide

---

## 1. USER FLOW

### Flow Diagram
```
Meeting Scheduling
    ↓
Integration Options:
    ├─ Auto-record from Zoom/Google Meet
    ├─ Upload meeting transcript
    ├─ Upload audio/video file
    ├─ Paste manual notes
    └─ Import from Otter.ai API
    ↓
Processing (30-90 seconds depending on length)
    ├─ Transcription cleaning
    ├─ Speaker identification
    ├─ Context analysis
    └─ AI processing
    ↓
Meeting Summary Generated
    ├─ Executive Summary
    ├─ Key Decisions
    ├─ Action Items (with assignments)
    ├─ Risks & Blockers
    ├─ Client Requests
    ├─ Deadlines Mentioned
    ├─ Follow-Up Tasks
    └─ Sentiment Analysis
    ↓
Integration Actions (Automatic)
    ├─ Create tasks in project
    ├─ Add calendar reminders
    ├─ Send meeting recap email
    ├─ Update CRM client record
    ├─ Link to project
    ├─ Notify assignees
    └─ Archive transcript
    ↓
User Review & Refinement
    ├─ Edit action items
    ├─ Reassign tasks
    ├─ Mark decisions as confirmed
    └─ Add additional notes
```

---

## 2. DATABASE SCHEMA

```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Meeting Info
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMP NOT NULL,
  duration_minutes INT,
  attendees JSONB, -- [{name, email, role}]
  
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  
  -- Source Information
  source ENUM ('zoom', 'google_meet', 'manual', 'audio_upload', 'otter_ai') NOT NULL,
  source_url TEXT, -- URL to original meeting
  source_meeting_id TEXT, -- Zoom ID, etc
  
  -- Transcript
  transcript_raw TEXT, -- Raw transcription
  transcript_cleaned TEXT, -- Cleaned version
  transcript_full_search tsvector, -- Full-text search index
  
  -- Generated Summary (JSONB)
  meeting_summary JSONB NOT NULL,
  -- {
  --   "executive_summary": "2-3 paragraph summary",
  --   "key_decisions": ["decision 1", "decision 2"],
  --   "action_items": [
  --     {
  --       "task": "description",
  --       "assigned_to": "email",
  --       "due_date": "YYYY-MM-DD",
  --       "priority": "high|medium|low"
  --     }
  --   ],
  --   "risks": ["risk 1", "risk 2"],
  --   "client_requests": ["request 1"],
  --   "deadlines": [{"item": "description", "date": "YYYY-MM-DD"}],
  --   "follow_up_tasks": [{"task": "", "owner": ""}],
  --   "sentiment_analysis": { "overall": "positive|neutral|negative", "score": 0.8 }
  -- }
  
  -- Processing
  processing_status ENUM ('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  processing_error TEXT,
  processing_time_ms INT,
  ai_model_used TEXT DEFAULT 'gemini-2.5-flash',
  
  -- Metadata
  tags JSONB, -- Custom tags
  is_archived BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Action Items tracking
CREATE TABLE meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  assigned_to_user_id UUID REFERENCES auth.users(id),
  due_date DATE,
  priority ENUM ('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM ('pending', 'in_progress', 'completed', 'blocked') DEFAULT 'pending',
  
  related_task_id UUID REFERENCES tasks(id), -- Links to task management
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Meeting Participants & Engagement
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  
  participant_email TEXT NOT NULL,
  participant_name TEXT,
  organization TEXT,
  
  join_time TIMESTAMP,
  leave_time TIMESTAMP,
  speaking_duration_seconds INT,
  message_count INT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meeting Insights
CREATE TABLE meeting_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Analysis
  sentiment_overall ENUM ('very_negative', 'negative', 'neutral', 'positive', 'very_positive'),
  sentiment_score DECIMAL, -- 0-1
  
  engagement_level ENUM ('low', 'medium', 'high'),
  meeting_productivity ENUM ('unproductive', 'somewhat_productive', 'productive'),
  
  -- Topics mentioned
  topics JSONB, -- {topic: frequency}
  keywords JSONB,
  
  -- Decisions made
  decisions_count INT,
  decisions_confirmed BOOLEAN,
  
  -- Action items
  action_items_count INT,
  action_items_assigned BOOLEAN,
  
  -- Risks identified
  risks_identified JSONB,
  follow_ups_required BOOLEAN,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integration History
CREATE TABLE meeting_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  
  integration_type ENUM ('task_creation', 'email_send', 'crm_update', 'calendar_event', 'slack_notification'),
  action_status ENUM ('pending', 'success', 'failed'),
  integration_details JSONB,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. API ENDPOINTS

### POST /api/v1/meetings/upload

**Purpose**: Upload meeting recording or transcript

```typescript
Request (multipart/form-data):
- file: File (audio, video, or text)
- title: string
- meeting_date: ISO 8601 timestamp
- attendees: JSON array
- project_id?: UUID
- client_id?: UUID

Response (Streaming):
{
  "success": true,
  "meeting_id": "uuid",
  "processing_status": "processing",
  "stream": "Server-Sent Events"
}

// Streamed:
event: progress
data: { "stage": "transcribing", "percent": 30 }

event: progress
data: { "stage": "analyzing", "percent": 60 }

event: complete
data: { 
  "meeting_id": "uuid",
  "summary": {...},
  "action_items_created": 5,
  "processing_time_ms": 45000
}
```

### POST /api/v1/meetings/import-zoom

**Purpose**: Automatically pull meeting from Zoom

```typescript
Request Body:
{
  "zoom_meeting_id": "string",
  "include_recording": boolean,
  "sync_to_crm": boolean
}

Response:
{
  "success": true,
  "meeting_id": "uuid",
  "transcript_fetched": true,
  "participants_synced": 8
}
```

### GET /api/v1/meetings/{id}

**Purpose**: Get full meeting details and summary

```typescript
Response:
{
  "id": "uuid",
  "title": "Q2 Planning Session",
  "meeting_date": "2026-06-08T14:00:00Z",
  "duration_minutes": 45,
  "attendees": [...],
  "transcript_cleaned": "...",
  "meeting_summary": {
    "executive_summary": "...",
    "key_decisions": [...],
    "action_items": [...],
    "risks": [...],
    "sentiment_analysis": { "overall": "positive", "score": 0.82 }
  },
  "insights": {
    "engagement_level": "high",
    "meeting_productivity": "productive",
    "topics": { "pricing": 8, "timeline": 6 }
  }
}
```

### POST /api/v1/meetings/{id}/action-items

**Purpose**: Create tasks from action items

```typescript
Request Body:
{
  "auto_assign": true,
  "sync_to_project": true,
  "set_calendar_reminders": true,
  "assign_to": [
    {
      "action_item_id": "item_1",
      "user_id": "uuid",
      "due_date": "2026-06-15"
    }
  ]
}

Response:
{
  "success": true,
  "tasks_created": 5,
  "task_ids": ["task_1", "task_2", ...],
  "reminders_set": 5,
  "email_notifications_sent": 5
}
```

### POST /api/v1/meetings/{id}/send-recap

**Purpose**: Send meeting recap email to attendees

```typescript
Request Body:
{
  "recipients": ["email1@company.com", "email2@company.com"],
  "include_action_items": true,
  "include_transcript": false,
  "custom_message": "Please review and confirm action items"
}

Response:
{
  "success": true,
  "emails_sent": 8,
  "sent_at": "2026-06-08T15:00:00Z"
}
```

### PUT /api/v1/meetings/{id}/action-items/{item_id}

**Purpose**: Update action item status

```typescript
Request Body:
{
  "status": "completed",
  "notes": "Completed as of June 10",
  "assigned_to": "new_user_email@company.com"
}

Response:
{
  "success": true,
  "updated_at": "2026-06-10T14:00:00Z"
}
```

---

## 4. GEMINI PROMPT ENGINEERING

### System Prompt

```
You are an expert meeting analyst specializing in translating business conversations
into actionable intelligence. You excel at extracting:
- Strategic decisions
- Explicit action items
- Hidden risks and concerns
- Client requests and expectations
- Financial implications
- Timeline impacts

Your analysis helps teams stay aligned and accountable.
```

### User Prompt Template

```
Analyze this {duration_minutes}-minute meeting transcript and generate a comprehensive meeting summary.

MEETING CONTEXT
Title: {meeting_title}
Date: {meeting_date}
Attendees: {attendees_list}
Client: {client_name if applicable}
Project: {project_name if applicable}

TRANSCRIPT
{transcript_text}

REQUIRED OUTPUT (JSON ONLY - NO MARKDOWN):
{
  "executive_summary": "2-3 paragraphs summarizing the meeting outcome and key points",
  "key_decisions": [
    "Decision 1 - include WHO decided and WHEN it's effective",
    "Decision 2",
    "..."
  ],
  "action_items": [
    {
      "task": "Specific, measurable action",
      "owner": "Name or role of responsible person",
      "due_date": "YYYY-MM-DD (infer from context)",
      "priority": "high|medium|low",
      "success_metric": "How to know it's done"
    }
  ],
  "risks": [
    "Risk 1 - describe potential impact",
    "Risk 2"
  ],
  "client_requests": ["Request 1", "Request 2"],
  "deadlines": [
    {
      "item": "What's due",
      "date": "YYYY-MM-DD",
      "owner": "Who owns it"
    }
  ],
  "follow_up_required": boolean,
  "follow_up_tasks": [
    {
      "task": "Description",
      "owner": "Person to follow up with",
      "reason": "Why this follow-up is needed"
    }
  ],
  "sentiment_analysis": {
    "overall": "positive|neutral|negative",
    "score": 0.8,
    "notes": "Why this sentiment?"
  },
  "topics_discussed": {
    "topic1": count,
    "topic2": count
  },
  "budget_implications": "Any budget changes mentioned",
  "timeline_impacts": "Any timeline adjustments needed"
}

CRITICAL RULES:
1. Be specific - no vague action items
2. Assign owners based on conversation context
3. Infer reasonable due dates from discussion
4. Identify hidden risks and concerns
5. Capture ALL client requests, even if not committed to
6. Look for scope creep indicators
7. Flag timeline compression risks
```

### Variations by Meeting Type

**Client Meeting**
```json
{
  "extra_fields": {
    "client_sentiment_toward_project": "How does client feel?",
    "client_concerns": ["concern1", "concern2"],
    "approval_status": "approved|pending|needs_revision",
    "scope_changes": "Any scope expansion or reduction?",
    "budget_discussion": "What was said about budget?"
  }
}
```

**Team Meeting**
```json
{
  "extra_fields": {
    "decisions_requiring_confirmation": ["decision1"],
    "blockers_discussed": ["blocker1"],
    "resource_allocation": "Any team changes?",
    "inter_team_dependencies": "Cross-team coordination needed?"
  }
}
```

**Status Review Meeting**
```json
{
  "extra_fields": {
    "projects_on_track": ["project1"],
    "projects_at_risk": ["project2"],
    "health_status_changes": {"project1": "green_to_yellow"},
    "resource_constraints": "Any mentioned?"
  }
}
```

---

## 5. TYPESCRIPT INTERFACES

```typescript
// src/lib/types/meetings.ts

export interface MeetingParticipant {
  name: string;
  email: string;
  role?: string;
  organization?: string;
}

export interface ActionItem {
  task: string;
  owner: string;
  due_date: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  success_metric?: string;
}

export interface Deadline {
  item: string;
  date: string; // YYYY-MM-DD
  owner: string;
}

export interface FollowUp {
  task: string;
  owner: string;
  reason: string;
}

export interface SentimentAnalysis {
  overall: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  score: number; // 0-1
  notes: string;
}

export interface MeetingSummary {
  executive_summary: string;
  key_decisions: string[];
  action_items: ActionItem[];
  risks: string[];
  client_requests: string[];
  deadlines: Deadline[];
  follow_up_required: boolean;
  follow_up_tasks: FollowUp[];
  sentiment_analysis: SentimentAnalysis;
  topics_discussed: Record<string, number>;
  budget_implications?: string;
  timeline_impacts?: string;
}

export interface Meeting {
  id: string;
  org_id: string;
  created_by: string;
  
  title: string;
  meeting_date: string;
  duration_minutes: number;
  attendees: MeetingParticipant[];
  
  client_id?: string;
  project_id?: string;
  
  source: 'zoom' | 'google_meet' | 'manual' | 'audio_upload' | 'otter_ai';
  transcript_raw: string;
  transcript_cleaned: string;
  
  meeting_summary: MeetingSummary;
  
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_model_used: string;
  
  created_at: string;
  updated_at: string;
}

export interface MeetingInsights {
  meeting_id: string;
  sentiment_overall: string;
  engagement_level: 'low' | 'medium' | 'high';
  meeting_productivity: 'unproductive' | 'somewhat_productive' | 'productive';
  action_items_count: number;
  risks_identified: string[];
  follow_ups_required: boolean;
}
```

---

## 6. AUTOMATION & WORKFLOWS

### Auto-Create Tasks Flow

```typescript
// When meeting is processed:
1. Extract action_items from summary
2. For each action_item:
   a. Look up user by "owner" field
   b. Create task in project management
   c. Set due date
   d. Set priority
   e. Link back to meeting
   f. Send notification to assignee
3. Set calendar reminders for due dates
4. Add to CRM activity log
```

### Integration with CRM

```typescript
// Update client record when:
1. Meeting is with client → Update last_contact_date
2. Client requests mentioned → Add to opportunity field
3. Concerns flagged → Create follow-up task
4. Budget discussed → Update deal amount if applicable
5. Timeline changed → Update close date
```

### Email Recap Workflow

```typescript
// Generate and send:
1. Meeting summary email
2. Include: executive summary, action items, deadlines
3. Format: HTML with clear call-to-action buttons
4. Recipients: all attendees by default
5. Track: opens, clicks (optional)
6. Archive: in meeting record
```

---

## 7. COST ANALYSIS

### Per-Meeting Cost

```
Transcription (if audio):
  - Average 45-min meeting: 30K tokens
  - If using OpenAI Whisper: $0.30-0.50
  - If using Gemini Video: $0.05-0.10

AI Summary Generation:
  - ~3K tokens input + 2K tokens output
  - Cost: ~$0.375

Storage & Indexing:
  - Average transcript: 50KB
  - Amortized: $0.01

Total Cost per Meeting: ~$0.50-1.00
```

### ROI Calculation

```
Time saved per meeting:
  - Manual summarization: 30-45 minutes
  - Agency rate: $100/hour
  - Value generated: $50-75

Cost: $0.50-1.00
ROI: 5000% per meeting
```

---

## 8. IMPLEMENTATION CHECKLIST

- [ ] Database schema created
- [ ] Zoom/Google Meet integration connected
- [ ] Transcription service integrated
- [ ] Gemini prompt optimized
- [ ] Streaming SSE working
- [ ] Task creation automation working
- [ ] CRM integration verified
- [ ] Email recap template designed
- [ ] Action item tracking working
- [ ] Sentiment analysis accurate
- [ ] UI components built
- [ ] Mobile responsive
- [ ] Error handling complete
- [ ] Rate limiting set
- [ ] Analytics tracking added
- [ ] Unit tests written
- [ ] Documentation complete
- [ ] Security (RLS) policies set

---

## 9. SUCCESS METRICS

```
Primary:
├── Meeting processing success rate (target: 97%)
├── Average processing time (target: <90 seconds)
├── Action items creation accuracy (target: >90%)
├── Action item completion rate (target: >70%)
└── User feature adoption (target: >50%)

Secondary:
├── Meeting recap email open rate (target: >60%)
├── Task assignment accuracy (target: >95%)
├── Risk identification accuracy (target: >85%)
├── Sentiment analysis accuracy (target: >80%)
└── Time saved per meeting (target: 40+ minutes)
```

