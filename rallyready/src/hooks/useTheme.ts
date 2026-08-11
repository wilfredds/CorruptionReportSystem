import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import {
  applyTheme,
  onSystemThemeChange,
  prefersDark,
  readThemePreference,
  type ThemePreference,
} from '@/lib/theme'

/**
 * The OS colour scheme as an external store, so the resolved theme is derived
 * during render instead of being mirrored into state by an effect.
 */
function subscribeToSystemTheme(onChange: () => void) {
  return onSystemThemeChange(onChange)
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readThemePreference)

  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    prefersDark,
    () => false, // server snapshot; the app is client-only but this keeps SSR honest
  )

  const resolved: 'light' | 'dark' =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  // The only side effect: push the resolved theme onto <html> and remember it.
  useEffect(() => {
    applyTheme(preference)
  }, [preference, resolved])

  const cycle = useCallback(() => {
    setPreference((current) =>
      current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system',
    )
  }, [])

  return { preference, resolved, setPreference, cycle }
}
