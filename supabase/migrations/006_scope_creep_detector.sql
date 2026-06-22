-- supabase/migrations/006_scope_creep_detector.sql
-- Feature 3: AI Scope Creep Detector Database Schema

-- ============================================
-- SCOPE TRACKING TABLE
-- ============================================
CREATE TABLE scope_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
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

CREATE INDEX idx_scope_tracking_project_id ON scope_tracking(project_id);
CREATE INDEX idx_scope_tracking_organization_id ON scope_tracking(organization_id);
CREATE INDEX idx_scope_tracking_risk_level ON scope_tracking(risk_level);

ALTER TABLE scope_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org scope tracking"
  ON scope_tracking
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

-- ============================================
-- SCOPE CHANGE ALERTS TABLE
-- ============================================
CREATE TABLE scope_change_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
  
  confidence_score DECIMAL(3, 2) NOT NULL, -- 0-1
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
  acknowledged_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_scope_alerts_project_id ON scope_change_alerts(project_id);
CREATE INDEX idx_scope_alerts_organization_id ON scope_change_alerts(organization_id);
CREATE INDEX idx_scope_alerts_status ON scope_change_alerts(status);
CREATE INDEX idx_scope_alerts_severity ON scope_change_alerts(severity);
CREATE INDEX idx_scope_alerts_created_at ON scope_change_alerts(created_at DESC);

ALTER TABLE scope_change_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org scope alerts"
  ON scope_change_alerts
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

-- ============================================
-- CHANGE ORDERS TABLE
-- ============================================
CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES scope_change_alerts(id) ON DELETE CASCADE,
  
  number TEXT NOT NULL UNIQUE, -- CO-001, CO-002, etc
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
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  payment_terms TEXT,
  deadline DATE,
  conditions TEXT[],
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX idx_change_orders_organization_id ON change_orders(organization_id);
CREATE INDEX idx_change_orders_status ON change_orders(approval_status);
CREATE INDEX idx_change_orders_alert_id ON change_orders(alert_id);

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org change orders"
  ON change_orders
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members 
    WHERE user_id = auth.uid()
  ));

-- ============================================
-- SCOPE RISK ASSESSMENT TABLE
-- ============================================
CREATE TABLE scope_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  overall_risk_score INT CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  risk_factors JSONB DEFAULT '[]', -- [{ type, weight, score, description }]
  
  client_health_impact INT, -- -100 to 100
  revenue_impact DECIMAL(15, 2),
  
  historical_trend TEXT CHECK (historical_trend IN ('improving', 'stable', 'worsening')),
  trend_data JSONB DEFAULT '[]', -- [{ date, alertCount, riskScore }]
  
  recommendations TEXT[],
  urgent_actions TEXT[],
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_assessments_project_id ON scope_risk_assessments(project_id);

-- ============================================
-- SCOPE CHANGE HISTORY TABLE
-- ============================================
CREATE TABLE scope_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  change_date TIMESTAMP NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'alert_created', 'alert_acknowledged', 'change_order_sent', 
    'change_order_approved', 'resolution'
  )),
  
  alert_ids UUID[],
  change_order_id UUID REFERENCES change_orders(id),
  
  details TEXT,
  initiated_by UUID REFERENCES auth.users(id),
  
  budget_before DECIMAL(15, 2),
  budget_after DECIMAL(15, 2),
  timeline_before TEXT,
  timeline_after TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scope_history_project_id ON scope_change_history(project_id);
CREATE INDEX idx_scope_history_change_date ON scope_change_history(change_date DESC);

-- ============================================
-- EMAIL MONITORING RULES TABLE
-- ============================================
CREATE TABLE email_monitoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  is_active BOOLEAN DEFAULT TRUE,
  email_addresses TEXT[] NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY['also', 'additionally', 'can you add'],
  
  scan_frequency TEXT DEFAULT 'realtime' CHECK (scan_frequency IN ('realtime', 'hourly', 'daily')),
  auto_alert BOOLEAN DEFAULT TRUE,
  min_confidence_threshold DECIMAL(3, 2) DEFAULT 0.7,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_rules_organization_id ON email_monitoring_rules(organization_id);

-- ============================================
-- SCOPE ANALYSIS CACHE TABLE
-- ============================================
CREATE TABLE scope_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  content_hash TEXT NOT NULL, -- hash of analyzed content
  analysis_result JSONB,
  
  ai_tokens_used INT,
  ai_cost_usd DECIMAL(10, 4),
  ai_model TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_analysis_cache_project_id ON scope_analysis_cache(project_id);
CREATE INDEX idx_analysis_cache_expires_at ON scope_analysis_cache(expires_at);

-- ============================================
-- AUTOMATED ANALYSIS JOB STATUS TABLE
-- ============================================
CREATE TABLE scope_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  source TEXT NOT NULL, -- email, message, document, etc
  source_id TEXT NOT NULL, -- email ID, message ID, etc
  content_preview TEXT, -- first 500 chars
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  result JSONB,
  error_message TEXT,
  
  alerts_created INT DEFAULT 0,
  high_risk_found BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_analysis_jobs_project_id ON scope_analysis_jobs(project_id);
CREATE INDEX idx_analysis_jobs_status ON scope_analysis_jobs(status);
CREATE INDEX idx_analysis_jobs_organization_id ON scope_analysis_jobs(organization_id);
