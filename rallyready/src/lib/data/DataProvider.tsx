import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'

import { useAuth } from '@/lib/auth/context'

import { RepositoriesContext } from './context'
import { createRepositories } from './index'
import { migrateLocalHistory } from './migrate'

interface DataProviderProps {
  children: ReactNode
  /** Overrides the signed-in user; used by tests. */
  userId?: string | null
}

/**
 * Picks the backend for the whole app based on who is signed in, and hands a
 * signed-out history over to the account the first time someone signs in.
 */
export function DataProvider({ children, userId }: DataProviderProps) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const resolvedUserId = userId !== undefined ? userId : (auth.user?.id ?? null)

  const repositories = useMemo(() => createRepositories(resolvedUserId), [resolvedUserId])

  const migratedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!resolvedUserId || repositories.backend !== 'supabase') return
    if (migratedFor.current === resolvedUserId) return
    migratedFor.current = resolvedUserId

    void migrateLocalHistory(repositories, resolvedUserId)
      .then((result) => {
        if (result.skipped) return
        // The dashboard was very likely already rendered from an empty account.
        void queryClient.invalidateQueries()
      })
      .catch(() => {
        // A failed upload leaves the local copy intact and the marker unset,
        // so the next sign-in tries again. Nothing is lost either way.
        migratedFor.current = null
      })
  }, [repositories, resolvedUserId, queryClient])

  return (
    <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
  )
}
