import type {
  DrillRepository,
  ProfileRepository,
  Repositories,
  SessionRepository,
  StreakRepository,
} from '../ports'
import { SEED_DRILLS, findSeedDrill } from '../seed/drills'
import { computeStreak, localDateKey } from '../streaks'
import type {
  NewSession,
  NewSessionMetric,
  Profile,
  Session,
  SessionMetric,
  Streak,
} from '../types'
import { newId, readJson, STORAGE_KEYS, writeJson } from './storage'

/**
 * The offline / signed-out backend.
 *
 * This is the active repository set for Phase 1 and the permanent fallback
 * afterwards: RallyReady has to work on a dead connection in a garage, and
 * nothing about training solo requires an account.
 */

const drills: DrillRepository = {
  async list() {
    return SEED_DRILLS
  },
  async getBySlug(slug) {
    return findSeedDrill(slug) ?? null
  },
  async getById(id) {
    // Locally a drill's id is its slug — there is no server to allocate uuids.
    return findSeedDrill(id) ?? null
  },
}

function loadSessions(): Session[] {
  return readJson<Session[]>(STORAGE_KEYS.sessions, [])
}

function loadMetrics(): Record<string, SessionMetric[]> {
  return readJson<Record<string, SessionMetric[]>>(STORAGE_KEYS.metrics, {})
}

const sessions: SessionRepository = {
  async create(input: NewSession, metrics: NewSessionMetric[] = []) {
    const session: Session = {
      id: newId(),
      userId: null,
      drillId: input.drillId,
      drillName: input.drillName,
      startedAt: input.startedAt.toISOString(),
      durationSec: input.durationSec,
      roundsCompleted: input.roundsCompleted,
      avgShotIntervalMs: input.avgShotIntervalMs,
      notes: input.notes ?? null,
      source: input.source,
    }

    // Newest first: every read path wants recent sessions.
    writeJson(STORAGE_KEYS.sessions, [session, ...loadSessions()])

    if (metrics.length > 0) {
      const store = loadMetrics()
      store[session.id] = metrics.map((metric) => ({
        id: newId(),
        sessionId: session.id,
        metricKey: metric.metricKey,
        metricValue: metric.metricValue,
      }))
      writeJson(STORAGE_KEYS.metrics, store)
    }

    return session
  },

  async getById(id) {
    return loadSessions().find((session) => session.id === id) ?? null
  },

  async listRecent(limit = 20) {
    return loadSessions().slice(0, limit)
  },

  async listMetrics(sessionId) {
    return loadMetrics()[sessionId] ?? []
  },

  async listSessionDates() {
    return loadSessions()
      .map((session) => localDateKey(new Date(session.startedAt)))
      .sort()
  },
}

const streaks: StreakRepository = {
  async get(): Promise<Streak> {
    return computeStreak(await sessions.listSessionDates())
  },
}

const profiles: ProfileRepository = {
  async get() {
    return readJson<Profile | null>(STORAGE_KEYS.profile, null)
  },
  async save(patch) {
    const existing = readJson<Profile | null>(STORAGE_KEYS.profile, null)
    const profile: Profile = {
      id: existing?.id ?? newId(),
      displayName: patch.displayName ?? existing?.displayName ?? 'Player',
      avatarUrl: patch.avatarUrl ?? existing?.avatarUrl ?? null,
      skillLevel: patch.skillLevel ?? existing?.skillLevel ?? 'intermediate',
      primaryDiscipline: patch.primaryDiscipline ?? existing?.primaryDiscipline ?? 'both',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    writeJson(STORAGE_KEYS.profile, profile)
    return profile
  },
}

export function createLocalRepositories(): Repositories {
  return { drills, sessions, streaks, profiles, backend: 'local' }
}
