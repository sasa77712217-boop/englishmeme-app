import { createClient } from '@supabase/supabase-js'

// These are intentionally public browser values. Never replace the key with a service-role key.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://ujwthidkvnrkqcolivvg.supabase.co'
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || 'sb_publishable_22Qd57wNwPDpoVubbTksBw_QRwrpUIX'

export const supabase = url && key ? createClient(url, key, {
  // Supabase procesa automáticamente el código OAuth al volver desde Google.
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null

export const hasSupabase = Boolean(supabase)
