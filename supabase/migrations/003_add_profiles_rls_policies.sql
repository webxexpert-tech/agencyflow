-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies for Profiles Table
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- This fixes the "Failed to load settings" error
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- DROP existing policies if they exist (to avoid conflicts)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- ═══════════════════════════════════════════════════════════════════════════
-- CREATE NEW POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Policy 1: SELECT - Allow users to read their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: UPDATE - Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: INSERT - Allow users to insert their own profile (during signup)
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY POLICIES (copy and run this separately to check)
-- ═══════════════════════════════════════════════════════════════════════════

-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
