import { createContext, useContext } from 'react'

import { createRepositories } from './index'
import type { Repositories } from './ports'

export const RepositoriesContext = createContext<Repositories>(createRepositories(null))

/** The only way a component is allowed to reach storage. */
export function useRepositories(): Repositories {
  return useContext(RepositoriesContext)
}
