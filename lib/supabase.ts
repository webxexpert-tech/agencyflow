import { createBrowserClient } from '@supabase/ssr'
import { createClient as createServerClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Named export — createClient (dashboard page use karta hai)
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// Default export — supabase (baaki pages use karte hain)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key
export const getServerSupabase = () => {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createServerClient(supabaseUrl, supabaseServiceKey)
}