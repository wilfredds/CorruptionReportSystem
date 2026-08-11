import { createContext, useContext } from 'react'

import type { AuthContextValue } from './types'

const UNAVAILABLE: AuthContextValue = {
  status: 'unavailable',
  user: null,
  error: null,
  busy: false,
  signInWithPassword: async () => false,
  signUpWithPassword: async () => false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  clearError: () => {},
}

export const AuthContext = createContext<AuthContextValue>(UNAVAILABLE)

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
