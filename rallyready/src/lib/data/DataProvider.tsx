import { useMemo, type ReactNode } from 'react'

import { RepositoriesContext } from './context'
import { createRepositories } from './index'

interface DataProviderProps {
  children: ReactNode
  /** Supplied by auth in Phase 2; null means the local backend. */
  userId?: string | null
}

export function DataProvider({ children, userId = null }: DataProviderProps) {
  const repositories = useMemo(() => createRepositories(userId), [userId])
  return (
    <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
  )
}
