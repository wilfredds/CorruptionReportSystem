import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { getSupabaseClient } from '@/lib/supabase/client'

import { AuthContext } from './context'
import type { AuthContextValue, AuthUser } from './types'

/**
 * Supabase auth, wrapped so the rest of the app never imports the client.
 *
 * With no Supabase project configured the provider settles on `unavailable`
 * and everything keeps working against local storage — training solo has never
 * required an account and still does not.
 */

type SupabaseUserLike = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}

function toAuthUser(user: SupabaseUserLike): AuthUser {
  const meta = user.user_metadata ?? {}
  const pick = (key: string) => (typeof meta[key] === 'string' ? (meta[key] as string) : null)
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: pick('full_name') ?? pick('name') ?? (user.email?.split('@')[0] ?? null),
    avatarUrl: pick('avatar_url') ?? pick('picture'),
  }
}

/** Supabase error messages are terse and occasionally cryptic. */
function humanizeAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'That email and password do not match an account.'
  }
  if (lower.includes('already registered')) {
    return 'There is already an account with that email. Try signing in instead.'
  }
  if (lower.includes('password should be')) {
    return 'Password must be at least 6 characters.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Check your inbox and confirm your email address first.'
  }
  if (lower.includes('provider is not enabled')) {
    return 'Google sign-in is not enabled on this Supabase project yet.'
  }
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getSupabaseClient(), [])
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>(
    client ? 'loading' : 'unavailable',
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!client) return
    let active = true

    void client.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session ? toAuthUser(data.session.user) : null)
      setStatus(data.session ? 'signed-in' : 'signed-out')
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session ? toAuthUser(session.user) : null)
      setStatus(session ? 'signed-in' : 'signed-out')
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [client])

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!client) return false
      setBusy(true)
      setError(null)
      const { error: authError } = await client.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (authError) {
        setError(humanizeAuthError(authError.message))
        return false
      }
      return true
    },
    [client],
  )

  const signUpWithPassword = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!client) return false
      setBusy(true)
      setError(null)
      const { data, error: authError } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: displayName } },
      })
      setBusy(false)
      if (authError) {
        setError(humanizeAuthError(authError.message))
        return false
      }
      // With email confirmation switched on, sign-up succeeds without a session.
      if (!data.session) {
        setError('Account created. Check your inbox to confirm your email, then sign in.')
        return false
      }
      return true
    },
    [client],
  )

  const signInWithGoogle = useCallback(async () => {
    if (!client) return
    setError(null)
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (authError) setError(humanizeAuthError(authError.message))
  }, [client])

  const signOut = useCallback(async () => {
    if (!client) return
    await client.auth.signOut()
  }, [client])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      busy,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [
      status,
      user,
      error,
      busy,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      clearError,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
