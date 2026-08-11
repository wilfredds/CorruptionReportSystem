import { useEffect, useRef } from 'react'

interface UseSessionGuardOptions {
  /** True while there is a session worth protecting — running or paused. */
  active: boolean
  /** Called when the user tries to leave. Show them the end-session dialog. */
  onLeaveAttempt: () => void
}

/**
 * Stops a drill in progress being thrown away by accident.
 *
 * Two ways out of a running session were silently destructive: a refresh (or
 * closing the tab) and the browser or phone back gesture. Both binned eight
 * minutes of work with no warning and nothing logged, which for an app that
 * *is* an eight-minute timer is the worst thing it could do.
 *
 * `beforeunload` covers the refresh and the close — the browser asks first.
 * Back is covered with a sentinel history entry: the first Back lands on it
 * instead of leaving, and we push it again and ask. Pressing Back repeatedly
 * keeps asking rather than escaping.
 *
 * Deliberately not hooked to `pagehide`: it fires when the app is merely
 * backgrounded, and ending someone's drill because they glanced at a message
 * would be a worse bug than the one this fixes.
 */
export function useSessionGuard({ active, onLeaveAttempt }: UseSessionGuardOptions) {
  const activeRef = useRef(active)
  const onLeaveAttemptRef = useRef(onLeaveAttempt)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    onLeaveAttemptRef.current = onLeaveAttempt
  }, [onLeaveAttempt])

  useEffect(() => {
    if (!active) return

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    const catchBack = () => {
      if (!activeRef.current) return
      window.history.pushState({ rallyready: 'session-guard' }, '')
      onLeaveAttemptRef.current()
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    window.addEventListener('popstate', catchBack)
    window.history.pushState({ rallyready: 'session-guard' }, '')

    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      window.removeEventListener('popstate', catchBack)
    }
  }, [active])
}
