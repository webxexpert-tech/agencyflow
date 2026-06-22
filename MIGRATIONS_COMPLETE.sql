-- ═══════════════════════════════════════════════════════════════════════════
-- AGENCYFLOW - COMPLETE DATABASE MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this entire file in Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 001: DASHBOARD TABLES
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  client_name text not null,
  client_email text not null,
  amount numeric not null default 0,
  status text not null default 'Pending',
  invoice_date date not null default current_date,
  due_date date,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

DROP POLICY IF EXISTS "Users manage own invoices" ON public.invoices;
create policy "Users manage own invoices"
  on public.invoices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric not null,
  color text default '#6366f1',
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.budgets enable row level security;

DROP POLICY IF EXISTS "Users manage own budgets" ON public.budgets;
create policy "Users manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'Member',
  status text not null default 'Pending',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

DROP POLICY IF EXISTS "Users manage own team" ON public.team_members;
create policy "Users manage own team"
  on public.team_members for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.roi_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client_name text not null,
  invested numeric not null default 0,
  returned numeric not null default 0,
  status text not null default 'Active',
  category text not null default 'Paid Ads',
  start_date text,
  created_at timestamptz not null default now()
);

alter table public.roi_campaigns enable row level security;

DROP POLICY IF EXISTS "Users manage own campaigns" ON public.roi_campaigns;
create policy "Users manage own campaigns"
  on public.roi_campaigns for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 002: SETTINGS PROFILE EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'PKR',
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS dark_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS bio text;

CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON public.profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_website ON public.profiles(website);

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 003: RLS POLICIES FOR PROFILES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 004: PROPOSALS TABLES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  company_name text NOT NULL,
  industry text NOT NULL,
  service_type text NOT NULL,
  project_description text NOT NULL,
  goals text,
  budget decimal(15, 2),
  timeline text,
  additional_notes text,
  proposal_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proposal_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  proposal_content jsonb NOT NULL,
  change_summary text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.proposal_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'sent', 'viewed', 'accepted', 'rejected')),
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_client_name ON public.proposals(client_name);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON public.proposal_versions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_version_number ON public.proposal_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_proposal_history_proposal_id ON public.proposal_history(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_history_action ON public.proposal_history(action);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own proposals" ON public.proposals;
CREATE POLICY "Users can view their own proposals" ON public.proposals
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create proposals" ON public.proposals;
CREATE POLICY "Users can create proposals" ON public.proposals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own proposals" ON public.proposals;
CREATE POLICY "Users can update their own proposals" ON public.proposals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own proposals" ON public.proposals;
CREATE POLICY "Users can delete their own proposals" ON public.proposals
  FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their proposal versions" ON public.proposal_versions;
CREATE POLICY "Users can view their proposal versions" ON public.proposal_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_versions.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create proposal versions" ON public.proposal_versions;
CREATE POLICY "Users can create proposal versions" ON public.proposal_versions
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_versions.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

ALTER TABLE public.proposal_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their proposal history" ON public.proposal_history;
CREATE POLICY "Users can view their proposal history" ON public.proposal_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_history.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create proposal history" ON public.proposal_history;
CREATE POLICY "Users can create proposal history" ON public.proposal_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_history.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 005: MEETINGS FEATURE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID NOT NULL,
  client_id UUID,
  
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMP NOT NULL,
  duration INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL CHECK (source IN ('zoom', 'google_meet', 'upload', 'manual', 'teams', 'slack')),
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'transcribing', 'analyzing', 'completed', 'failed')),
  
  transcript TEXT,
  recording_url TEXT,
  summary JSONB,
  participants JSONB DEFAULT '[]',
  insights JSONB,
  
  ai_tokens_used INT DEFAULT 0,
  ai_cost_usd DECIMAL(10, 4) DEFAULT 0,
  ai_model TEXT DEFAULT 'gemini-2.5-flash',
  
  shared_with TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meetings_organization_id ON meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_source ON meetings(source);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org meetings" ON meetings;
CREATE POLICY "Users can view their org meetings"
  ON meetings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create meetings in their org" ON meetings;
CREATE POLICY "Users can create meetings in their org"
  ON meetings
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their org meetings" ON meetings;
CREATE POLICY "Users can update their org meetings"
  ON meetings
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete their org meetings" ON meetings;
CREATE POLICY "Users can delete their org meetings"
  ON meetings
  FOR DELETE
  USING (true);

CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  description TEXT NOT NULL,
  assignee_email TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  
  linked_task_id TEXT,
  linked_slack_thread_id TEXT,
  transcript_timestamp INT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_action_items_organization_id ON action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);

ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org action items" ON action_items;
CREATE POLICY "Users can view org action items"
  ON action_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage org action items" ON action_items;
CREATE POLICY "Users can manage org action items"
  ON action_items
  FOR INSERT
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  speaking_time_percent DECIMAL(5, 2),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);

CREATE TABLE IF NOT EXISTS meeting_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  main_topics JSONB DEFAULT '[]',
  client_needs_identified TEXT[],
  scope_changes JSONB DEFAULT '[]',
  opportunities_identified TEXT[],
  concerns_raised TEXT[],
  confidence_score DECIMAL(3, 2),
  requires_human_review BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);

CREATE TABLE IF NOT EXISTS meeting_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retrying')),
  stage TEXT NOT NULL DEFAULT 'upload' CHECK (stage IN ('upload', 'transcription', 'analysis', 'insights', 'completion')),
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  error_message TEXT,
  retry_count INT DEFAULT 0,
  
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_meeting_jobs_meeting_id ON meeting_processing_jobs(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_jobs_status ON meeting_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_meeting_jobs_organization_id ON meeting_processing_jobs(organization_id);

CREATE TABLE IF NOT EXISTS meeting_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  previous_value JSONB,
  new_value JSONB,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_meeting_history_meeting_id ON meeting_history(meeting_id);

CREATE TABLE IF NOT EXISTS meeting_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  
  token TEXT NOT NULL UNIQUE,
  shared_with TEXT[] NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  view_count INT DEFAULT 0,
  last_viewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_share_links_meeting_id ON meeting_share_links(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_share_links_token ON meeting_share_links(token);

CREATE TABLE IF NOT EXISTS meeting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
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

CREATE INDEX IF NOT EXISTS idx_meeting_templates_organization_id ON meeting_templates(organization_id);

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  feature TEXT NOT NULL CHECK (feature IN ('proposal_generator', 'meeting_summary', 'scope_detector', 'health_score', 'agency_gpt')),
  tokens_input INT NOT NULL DEFAULT 0,
  tokens_output INT NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  
  related_id UUID,
  related_type TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_organization_id ON ai_usage_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature ON ai_usage_log(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON ai_usage_log(created_at DESC);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org AI usage" ON ai_usage_log;
CREATE POLICY "Users can view their org AI usage"
  ON ai_usage_log
  FOR SELECT
  USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 006: SCOPE CREEP DETECTOR
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS scope_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  original_scope TEXT NOT NULL,
  original_budget INT NOT NULL,
  original_timeline TEXT NOT NULL,
  
  current_scope TEXT,
  total_alerts INT DEFAULT 0,
  open_alerts INT DEFAULT 0,
  acknowledged_alerts INT DEFAULT 0,
  
  total_financial_impact DECIMAL(15, 2) DEFAULT 0,
  total_timeline_impact TEXT,
  
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scope_tracking_project_id ON scope_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_scope_tracking_organization_id ON scope_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_scope_tracking_risk_level ON scope_tracking(risk_level);

ALTER TABLE scope_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org scope tracking" ON scope_tracking;
CREATE POLICY "Users can view their org scope tracking"
  ON scope_tracking
  FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS scope_change_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  scope_tracking_id UUID NOT NULL REFERENCES scope_tracking(id) ON DELETE CASCADE,
  
  change_type TEXT NOT NULL CHECK (change_type IN (
    'new_feature', 'requirement_expansion', 'timeline_change', 
    'budget_mention', 'integration_request', 'deliverable_change', 
    'phase_addition', 'quality_increase', 'performance_requirement', 'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'actioned', 'resolved', 'false_positive')),
  
  description TEXT NOT NULL,
  original_requirement TEXT,
  new_requirement TEXT,
  
  financial_impact_min DECIMAL(15, 2),
  financial_impact_max DECIMAL(15, 2),
  financial_impact_currency TEXT DEFAULT 'USD',
  
  timeline_impact TEXT,
  effort_impact TEXT,
  
  confidence_score DECIMAL(3, 2) NOT NULL,
  evidence_quote TEXT,
  
  source TEXT NOT NULL CHECK (source IN ('email', 'manual', 'slack', 'teams', 'meeting', 'document')),
  source_reference TEXT,
  
  risk_score INT CHECK (risk_score >= 0 AND risk_score <= 100),
  recommended_action TEXT,
  
  client_sentiment TEXT CHECK (client_sentiment IN ('positive', 'neutral', 'negative')),
  communication_needed BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  resolved_by UUID
);

CREATE INDEX IF NOT EXISTS idx_scope_alerts_project_id ON scope_change_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_scope_alerts_organization_id ON scope_change_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_scope_alerts_status ON scope_change_alerts(status);
CREATE INDEX IF NOT EXISTS idx_scope_alerts_severity ON scope_change_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_scope_alerts_created_at ON scope_change_alerts(created_at DESC);

ALTER TABLE scope_change_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org scope alerts" ON scope_change_alerts;
CREATE POLICY "Users can view their org scope alerts"
  ON scope_change_alerts
  FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID NOT NULL,
  alert_id UUID NOT NULL REFERENCES scope_change_alerts(id) ON DELETE CASCADE,
  
  number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reason TEXT,
  
  scope_additions TEXT[],
  scope_removals TEXT[],
  scope_modifications TEXT[],
  
  additional_cost DECIMAL(15, 2) NOT NULL,
  cost_reason TEXT,
  cost_currency TEXT DEFAULT 'USD',
  
  additional_days INT,
  new_end_date DATE,
  timeline_impact_summary TEXT,
  
  hours_added INT,
  resources_needed TEXT[],
  risks TEXT[],
  
  approval_status TEXT NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft', 'sent', 'acknowledged', 'approved', 'rejected')),
  sent_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by UUID,
  rejection_reason TEXT,
  
  payment_terms TEXT,
  deadline DATE,
  conditions TEXT[],
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_organization_id ON change_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(approval_status);
CREATE INDEX IF NOT EXISTS idx_change_orders_alert_id ON change_orders(alert_id);

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org change orders" ON change_orders;
CREATE POLICY "Users can view their org change orders"
  ON change_orders
  FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS scope_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  overall_risk_score INT CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  risk_factors JSONB DEFAULT '[]',
  client_health_impact INT,
  revenue_impact DECIMAL(15, 2),
  
  historical_trend TEXT CHECK (historical_trend IN ('improving', 'stable', 'worsening')),
  trend_data JSONB DEFAULT '[]',
  
  recommendations TEXT[],
  urgent_actions TEXT[],
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_project_id ON scope_risk_assessments(project_id);

CREATE TABLE IF NOT EXISTS scope_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  change_date TIMESTAMP NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'alert_created', 'alert_acknowledged', 'change_order_sent', 
    'change_order_approved', 'resolution'
  )),
  
  alert_ids UUID[],
  change_order_id UUID,
  
  details TEXT,
  initiated_by UUID,
  
  budget_before DECIMAL(15, 2),
  budget_after DECIMAL(15, 2),
  timeline_before TEXT,
  timeline_after TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scope_history_project_id ON scope_change_history(project_id);
CREATE INDEX IF NOT EXISTS idx_scope_history_change_date ON scope_change_history(change_date DESC);

CREATE TABLE IF NOT EXISTS email_monitoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  email_addresses TEXT[] NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY['also', 'additionally', 'can you add'],
  
  scan_frequency TEXT DEFAULT 'realtime' CHECK (scan_frequency IN ('realtime', 'hourly', 'daily')),
  auto_alert BOOLEAN DEFAULT TRUE,
  min_confidence_threshold DECIMAL(3, 2) DEFAULT 0.7,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_rules_organization_id ON email_monitoring_rules(organization_id);

CREATE TABLE IF NOT EXISTS scope_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  
  content_hash TEXT NOT NULL,
  analysis_result JSONB,
  
  ai_tokens_used INT,
  ai_cost_usd DECIMAL(10, 4),
  ai_model TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_project_id ON scope_analysis_cache(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires_at ON scope_analysis_cache(expires_at);

CREATE TABLE IF NOT EXISTS scope_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  content_preview TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  result JSONB,
  error_message TEXT,
  
  alerts_created INT DEFAULT 0,
  high_risk_found BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project_id ON scope_analysis_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON scope_analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_organization_id ON scope_analysis_jobs(organization_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════
-- All tables, indexes, and policies have been created successfully!
-- The database is now ready for the AgencyFlow application.
