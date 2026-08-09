/**
 * Theme resolution. Defaults to the OS setting and remembers an explicit
 * choice (§5). The same storage key is read by the inline script in
 * index.html so there is no flash of the wrong theme on first paint.
 */
export const THEME_STORAGE_KEY = 'rallyready.theme'

export type ThemePreference = 'light' | 'dark' | 'system'

function safeRead(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    /* storage unavailable (private mode, embedded webview) */
  }
  return 'system'
}

function safeWrite(preference: ThemePreference): void {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    /* non-fatal: the choice just will not survive a reload */
  }
}

export function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') return prefersDark() ? 'dark' : 'light'
  return preference
}

export function readThemePreference(): ThemePreference {
  return safeRead()
}

export function applyTheme(preference: ThemePreference): 'light' | 'dark' {
  const resolved = resolveTheme(preference)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  safeWrite(preference)
  return resolved
}

/** Fires when the OS theme changes; only meaningful while preference is `system`. */
export function onSystemThemeChange(handler: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  query.addEventListener('change', handler)
  return () => query.removeEventListener('change', handler)
}
