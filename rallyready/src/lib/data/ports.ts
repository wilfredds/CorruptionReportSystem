import type {
  Drill,
  NewSession,
  NewSessionMetric,
  Profile,
  Session,
  SessionMetric,
  Streak,
} from './types'

/**
 * The repository layer (§2). Everything above this line is UI; everything
 * below is storage. Swapping Supabase for anything else means writing new
 * implementations of these interfaces and nothing more.
 *
 * Ports grow phase by phase — programs, benchmarks and badges arrive with the
 * phases that use them. The Postgres schema already covers them all.
 */

export interface DrillRepository {
  list(): Promise<Drill[]>
  getBySlug(slug: string): Promise<Drill | null>
  getById(id: string): Promise<Drill | null>
}

export interface SessionRepository {
  create(input: NewSession, metrics?: NewSessionMetric[]): Promise<Session>
  getById(id: string): Promise<Session | null>
  listRecent(limit?: number): Promise<Session[]>
  listMetrics(sessionId: string): Promise<SessionMetric[]>
  /** Every session date, oldest first — the basis for streaks and trends. */
  listSessionDates(): Promise<string[]>
}

export interface StreakRepository {
  get(): Promise<Streak>
}

export interface ProfileRepository {
  get(): Promise<Profile | null>
  save(profile: Partial<Profile>): Promise<Profile>
}

export interface Repositories {
  drills: DrillRepository
  sessions: SessionRepository
  streaks: StreakRepository
  profiles: ProfileRepository
  /** Which backend is actually serving this bundle. */
  readonly backend: 'local' | 'supabase'
}
