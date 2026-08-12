/**
 * A very small JSON-over-localStorage layer.
 *
 * Every read and write is guarded: private browsing, disabled storage and a
 * full quota must degrade to "this session was not saved", never to a crash
 * in the middle of a drill (§6).
 */

const PREFIX = 'rallyready.'

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* nothing to do */
  }
}

/** `crypto.randomUUID` where available, with a plain fallback for old webviews. */
export function newId(): string {
  const cryptoRef = globalThis.crypto
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') return cryptoRef.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const STORAGE_KEYS = {
  sessions: 'sessions',
  metrics: 'session-metrics',
  profile: 'profile',
  benchmarks: 'benchmarks',
  badges: 'badges',
  readiness: 'readiness',
  programs: 'programs',
  programDays: 'program-days',
  enrollments: 'program-enrollments',
  /** Set once a local history has been uploaded, so it uploads only once. */
  migratedAt: 'migrated-at',
  drillSettings: 'drill-settings',
  cuePreferences: 'cue-preferences',
} as const
