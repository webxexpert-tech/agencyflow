import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Named export — createClient (dashboard page use karta hai)
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// Default export — supabase (baaki pages use karte hain)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)