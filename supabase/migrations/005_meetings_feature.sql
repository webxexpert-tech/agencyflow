-- supabase/migrations/005_meetings_feature.sql
-- Feature 2: AI Meeting Summary Database Schema

-- ============================================
-- MEETINGS TABLE
-- ============================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMP NOT NULL,
  duration INT NOT NULL DEFAULT 0, -- in minutes
  source TEXT NOT NULL CHECK (source IN ('zoom', 'google_meet', 'upload', 'manual', 'teams', 'slack')),
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'transcribing', 'analyzing', 'completed', 'failed')),
  
  -- Content
  transcript TEXT,
  recording_url TEXT,
  
  -- Summary JSON
  summary JSONB, -- { executiveSummary, keyDecisions, nextSteps, risks, followUps, sentiment, topics }
  
  -- Participants JSON
  participants JSONB DEFAULT '[]', -- Array of { name, email, role, speakingTime, sentiment }
  
  -- Insights JSON
  insights JSONB, -- { mainTopics, clientNeedsIdentified, scopeChangesDetected, opportunitiesIdentified, concernsRaised }
  
  -- AI Usage Tracking
  ai_tokens_used INT DEFAULT 0,
  ai_cost_usd DECIMAL(10, 4) DEFAULT 0,
  ai_model TEXT DEFAULT 'gemini-2.5-flash',
  
  -- Sharing
  shared_with TEXT[] DEFAULT '{}', -- array of emails
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX idx_meetings_organization_id ON meetings(organization_id);
CREATE INDEX idx_meetings_project_id ON meetings(project_id);
CREATE INDEX idx_meetings_client_id ON meetings(client_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);
CREATE INDEX idx_meetings_source ON meetings(source);

-- RLS Policies
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org meetings"
  ON meetings
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create meetings in their org"
  ON meetings
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org meetings"
  ON meetings
  FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their org meetings"
  ON meetings
  FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

-- ============================================
-- ACTION ITEMS TABLE
-- ============================================
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  assignee_email TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  
  -- Integration
  linked_task_id TEXT, -- external task management ID
  linked_slack_thread_id TEXT,
  
  -- Reference
  transcript_timestamp INT, -- seconds into transcript
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX idx_action_items_organization_id ON action_items(organization_id);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_priority ON action_items(priority);

ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org action items"
  ON action_items
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage org action items"
  ON action_items
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

-- ============================================
-- MEETING PARTICIPANTS TABLE
-- ============================================
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT, -- 'internal', 'client', 'vendor', etc
  speaking_time_percent DECIMAL(5, 2), -- 0-100
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);

-- ============================================
-- MEETING INSIGHTS TABLE
-- ============================================
CREATE TABLE meeting_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Main Topics
  main_topics JSONB DEFAULT '[]', -- [{ topic, frequency, duration, sentiment, importance }]
  
  -- Client Understanding
  client_needs_identified TEXT[],
  
  -- Scope Changes Detected
  scope_changes JSONB DEFAULT '[]', -- [{ description, estimatedImpact, timelineImpact, costImpact }]
  
  -- Opportunities
  opportunities_identified TEXT[],
  
  -- Concerns
  concerns_raised TEXT[],
  
  -- Overall Analysis
  confidence_score DECIMAL(3, 2), -- 0-1
  requires_human_review BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);

-- ============================================
-- MEETING PROCESSING JOBS TABLE
-- ============================================
CREATE TABLE meeting_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retrying')),
  stage TEXT NOT NULL DEFAULT 'upload' CHECK (stage IN ('upload', 'transcription', 'analysis', 'insights', 'completion')),
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  error_message TEXT,
  retry_count INT DEFAULT 0,
  
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  metadata JSONB -- additional processing info
);

CREATE INDEX idx_meeting_jobs_meeting_id ON meeting_processing_jobs(meeting_id);
CREATE INDEX idx_meeting_jobs_status ON meeting_processing_jobs(status);
CREATE INDEX idx_meeting_jobs_organization_id ON meeting_processing_jobs(organization_id);

-- ============================================
-- MEETING HISTORY TABLE
-- ============================================
CREATE TABLE meeting_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  previous_value JSONB,
  new_value JSONB,
  notes TEXT
);

CREATE INDEX idx_meeting_history_meeting_id ON meeting_history(meeting_id);

-- ============================================
-- MEETING SHARE LINKS TABLE
-- ============================================
CREATE TABLE meeting_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  
  token TEXT NOT NULL UNIQUE,
  shared_with TEXT[] NOT NULL, -- emails
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  view_count INT DEFAULT 0,
  last_viewed_at TIMESTAMP
);

CREATE INDEX idx_meeting_share_links_meeting_id ON meeting_share_links(meeting_id);
CREATE INDEX idx_meeting_share_links_token ON meeting_share_links(token);

-- ============================================
-- MEETING TEMPLATES TABLE
-- ============================================
CREATE TABLE meeting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  default_attendees TEXT[],
  suggested_topics TEXT[],
  expected_duration INT,
  follow_up_template TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meeting_templates_organization_id ON meeting_templates(organization_id);

-- ============================================
-- AI USAGE LOGGING TABLE
-- ============================================
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  feature TEXT NOT NULL CHECK (feature IN ('proposal_generator', 'meeting_summary', 'scope_detector', 'health_score', 'agency_gpt')),
  tokens_input INT NOT NULL DEFAULT 0,
  tokens_output INT NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  
  related_id UUID, -- proposal_id, meeting_id, etc
  related_type TEXT, -- 'proposal', 'meeting', etc
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_usage_log_organization_id ON ai_usage_log(organization_id);
CREATE INDEX idx_ai_usage_log_feature ON ai_usage_log(feature);
CREATE INDEX idx_ai_usage_log_created_at ON ai_usage_log(created_at DESC);

-- RLS for AI usage
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org AI usage"
  ON ai_usage_log
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));
