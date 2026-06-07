-- ═══════════════════════════════════════════════════════════════════════════
-- Database Migration: Settings & Profile Extensions
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- ═══════════════════════════════════════════════════════════════════════════

-- Check and add columns to profiles table if they don't exist
-- These columns support the complete Settings functionality

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

-- ═══════════════════════════════════════════════════════════════════════════
-- Add indexes for performance
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON public.profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_website ON public.profiles(website);

-- ═══════════════════════════════════════════════════════════════════════════
-- Add comments to columns for documentation
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN public.profiles.company_name IS 'Business/Agency name';
COMMENT ON COLUMN public.profiles.phone IS 'Business phone number (10-15 digits)';
COMMENT ON COLUMN public.profiles.website IS 'Business website URL (must start with http:// or https://)';
COMMENT ON COLUMN public.profiles.address IS 'Business physical address';
COMMENT ON COLUMN public.profiles.logo_url IS 'URL to company logo stored in Supabase Storage';
COMMENT ON COLUMN public.profiles.currency IS 'Default currency for expenses (e.g., PKR, USD, EUR)';
COMMENT ON COLUMN public.profiles.language IS 'Preferred dashboard language (e.g., en, ur, ar)';
COMMENT ON COLUMN public.profiles.dark_mode IS 'Dark mode preference (true/false)';
COMMENT ON COLUMN public.profiles.notification_prefs IS 'JSON object containing notification preferences';
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
COMMENT ON COLUMN public.profiles.bio IS 'User bio or professional title';

-- ═══════════════════════════════════════════════════════════════════════════
-- Verify the schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Run this to verify all columns exist:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'profiles' ORDER BY ordinal_position;
