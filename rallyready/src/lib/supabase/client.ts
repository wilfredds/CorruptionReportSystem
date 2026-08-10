import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/data/supabase/database.types'

/**
 * The one place a Supabase client is constructed. Everything else reaches it
 * through the repository layer (§2) — the ESLint config enforces that.
 *
 * Both env vars are optional on purpose: with them unset the app runs entirely
 * on local storage, which is exactly what Phase 1 needs.
 */

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export type RallyReadyClient = SupabaseClient<Database>

let client: RallyReadyClient | null = null

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

export function getSupabaseClient(): RallyReadyClient | null {
  if (!url || !anonKey) return null
  client ??= createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}
