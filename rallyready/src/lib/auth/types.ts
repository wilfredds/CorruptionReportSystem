export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
}

/**
 * `unavailable` is a first-class state, not an error: with no Supabase project
 * configured RallyReady still runs entirely on local storage, and the UI should
 * say so rather than offering a sign-in button that cannot work.
 */
export type AuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'unavailable'

export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  /** Set by the last failed credential attempt. */
  error: string | null
  /** True while a sign-in/sign-up request is in flight. */
  busy: boolean
}

export interface AuthActions {
  signInWithPassword(email: string, password: string): Promise<boolean>
  signUpWithPassword(email: string, password: string, displayName: string): Promise<boolean>
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
  clearError(): void
}

export type AuthContextValue = AuthState & AuthActions
