import type {
  Benchmark,
  Drill,
  EnrollmentStatus,
  NewBenchmark,
  NewProgram,
  NewReadinessCheck,
  NewSession,
  NewSessionMetric,
  Profile,
  Program,
  ProgramDay,
  ProgramEnrollment,
  ReadinessCheck,
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
  /**
   * Sets one metric on an existing session, replacing any previous value.
   *
   * Needed because not every metric is known when the session ends: an effort
   * rating is given a moment later, on the summary screen, and rating twice
   * must correct the first answer rather than record two.
   */
  setMetric(sessionId: string, metricKey: string, metricValue: number): Promise<void>
  getById(id: string): Promise<Session | null>
  listRecent(limit?: number): Promise<Session[]>
  listMetrics(sessionId: string): Promise<SessionMetric[]>
  /**
   * Every metric the user owns, in one call. The dashboard needs metrics for
   * the whole history; fetching them per session would be N+1.
   */
  listAllMetrics(): Promise<SessionMetric[]>
  /** Every session date, oldest first — the basis for streaks and trends. */
  listSessionDates(): Promise<string[]>
}

export interface BenchmarkRepository {
  create(input: NewBenchmark): Promise<Benchmark>
  list(testType?: Benchmark['testType']): Promise<Benchmark[]>
  getById(id: string): Promise<Benchmark | null>
}

export interface ProgramRepository {
  list(): Promise<Program[]>
  getBySlug(slug: string): Promise<Program | null>
  /** The whole plan, ordered by week then day. */
  listDays(programId: string): Promise<ProgramDay[]>
  /** Creates a program owned by the current user, with a generated plan. */
  create(input: NewProgram): Promise<Program>
  update(programId: string, patch: Partial<NewProgram>): Promise<Program>
  saveDay(day: ProgramDay): Promise<void>
  remove(programId: string): Promise<void>

  /** At most one enrolment is active at a time. */
  activeEnrollment(): Promise<ProgramEnrollment | null>
  listEnrollments(): Promise<ProgramEnrollment[]>
  enroll(programId: string): Promise<ProgramEnrollment>
  /** Moves to a specific position, or marks the program finished. */
  setPosition(enrollmentId: string, weekNo: number, dayNo: number): Promise<ProgramEnrollment>
  setStatus(enrollmentId: string, status: EnrollmentStatus): Promise<ProgramEnrollment>
}

export interface BadgeRepository {
  /** Slugs the user has already been awarded. */
  listEarned(): Promise<string[]>
  /** Records newly-earned slugs; already-held ones are ignored. */
  award(slugs: string[]): Promise<void>
}

export interface StreakRepository {
  get(): Promise<Streak>
}

export interface ReadinessRepository {
  /** Today's check-in, or null if it has not been done yet. */
  today(date: string): Promise<ReadinessCheck | null>
  /** Records a check-in, replacing any earlier one for the same day. */
  save(input: NewReadinessCheck): Promise<ReadinessCheck>
  /** Recent check-ins, newest first, for the trend. */
  listRecent(limit?: number): Promise<ReadinessCheck[]>
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
  benchmarks: BenchmarkRepository
  badges: BadgeRepository
  programs: ProgramRepository
  readiness: ReadinessRepository
  /** Which backend is actually serving this bundle. */
  readonly backend: 'local' | 'supabase'
}
