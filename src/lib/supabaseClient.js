import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Supabase env vars missing. Copy .env.example to .env and fill in your values from supabase.com → Settings → API'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)