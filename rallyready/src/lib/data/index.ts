import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'

import { createLocalRepositories } from './local/repositories'
import type { Repositories } from './ports'
import { createSupabaseRepositories } from './supabase/repositories'

export type { Repositories } from './ports'
export type * from './types'

/**
 * Chooses a backend.
 *
 * Signed in with Supabase configured → Postgres. Anything else → local
 * storage. Phase 1 ships without auth, so this always resolves to local today;
 * Phase 2 supplies a real `userId` and the whole app moves over without a
 * single component changing.
 */
export function createRepositories(userId: string | null = null): Repositories {
  const client = getSupabaseClient()
  if (client && userId) return createSupabaseRepositories(client, userId)
  return createLocalRepositories()
}

export { isSupabaseConfigured }
