-- ═══════════════════════════════════════════════════════════════════════════
-- AI Proposal Generator Tables
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Create proposals table
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
  
  -- Proposal content (JSON)
  proposal_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status: draft, sent, accepted, rejected
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create proposal_versions table (for history)
CREATE TABLE IF NOT EXISTS public.proposal_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  proposal_content jsonb NOT NULL,
  change_summary text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create proposal_history table (for tracking)
CREATE TABLE IF NOT EXISTS public.proposal_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'sent', 'viewed', 'accepted', 'rejected')),
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes for Performance
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_client_name ON public.proposals(client_name);

CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON public.proposal_versions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_version_number ON public.proposal_versions(version_number);

CREATE INDEX IF NOT EXISTS idx_proposal_history_proposal_id ON public.proposal_history(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_history_action ON public.proposal_history(action);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies - Proposals
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Users can view their own proposals
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.proposals;
CREATE POLICY "Users can view their own proposals" ON public.proposals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create proposals
DROP POLICY IF EXISTS "Users can create proposals" ON public.proposals;
CREATE POLICY "Users can create proposals" ON public.proposals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own proposals
DROP POLICY IF EXISTS "Users can update their own proposals" ON public.proposals;
CREATE POLICY "Users can update their own proposals" ON public.proposals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own proposals
DROP POLICY IF EXISTS "Users can delete their own proposals" ON public.proposals;
CREATE POLICY "Users can delete their own proposals" ON public.proposals
  FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies - Proposal Versions
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions of their own proposals
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

-- Users can create versions for their proposals
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

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies - Proposal History
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.proposal_history ENABLE ROW LEVEL SECURITY;

-- Users can view history of their proposals
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

-- Users can create history entries for their proposals
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
-- Comments
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.proposals IS 'AI-generated and user-created proposals for clients';
COMMENT ON TABLE public.proposal_versions IS 'Version history of proposals';
COMMENT ON TABLE public.proposal_history IS 'Action history for proposals (sent, viewed, accepted, etc)';

COMMENT ON COLUMN public.proposals.proposal_content IS 'JSON object containing executive summary, overview, scope, etc';
COMMENT ON COLUMN public.proposals.status IS 'Current status: draft, sent, accepted, rejected';

-- ═══════════════════════════════════════════════════════════════════════════
-- Verify
-- ═══════════════════════════════════════════════════════════════════════════

-- Run this to verify:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'proposal%';
