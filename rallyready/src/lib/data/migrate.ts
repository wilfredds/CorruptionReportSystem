import { readJson, STORAGE_KEYS, writeJson } from './local/storage'
import type { Repositories } from './ports'
import type { Benchmark, Session, SessionMetric } from './types'

/**
 * Uploads a signed-out training history into an account, once.
 *
 * People will use RallyReady for weeks before they ever create an account —
 * that is the whole point of the local backend — so signing in must not look
 * like starting over.
 *
 * Local sessions reference drills by slug; the account references them by uuid,
 * so each one is resolved on the way through. The local copy is deliberately
 * left in place: it is still the offline fallback, and keeping it means a
 * failed upload never loses anything.
 */

export interface MigrationResult {
  sessions: number
  benchmarks: number
  badges: number
  skipped: boolean
}

const NOTHING: MigrationResult = { sessions: 0, benchmarks: 0, badges: 0, skipped: true }

function alreadyMigrated(userId: string): boolean {
  return Boolean(readJson<Record<string, string>>(STORAGE_KEYS.migratedAt, {})[userId])
}

function markMigrated(userId: string): void {
  const record = readJson<Record<string, string>>(STORAGE_KEYS.migratedAt, {})
  writeJson(STORAGE_KEYS.migratedAt, { ...record, [userId]: new Date().toISOString() })
}

export async function migrateLocalHistory(
  target: Repositories,
  userId: string,
): Promise<MigrationResult> {
  if (target.backend !== 'supabase' || alreadyMigrated(userId)) return NOTHING

  const localSessions = readJson<Session[]>(STORAGE_KEYS.sessions, [])
  const localMetrics = readJson<Record<string, SessionMetric[]>>(STORAGE_KEYS.metrics, {})
  const localBenchmarks = readJson<Benchmark[]>(STORAGE_KEYS.benchmarks, [])
  const localBadges = readJson<string[]>(STORAGE_KEYS.badges, [])

  if (localSessions.length === 0 && localBenchmarks.length === 0 && localBadges.length === 0) {
    markMigrated(userId)
    return { ...NOTHING, skipped: true }
  }

  // Resolve each distinct slug once rather than per session.
  const slugToId = new Map<string, string | null>()
  for (const session of localSessions) {
    if (!session.drillId || slugToId.has(session.drillId)) continue
    const drill = await target.drills.getBySlug(session.drillId)
    slugToId.set(session.drillId, drill?.id ?? null)
  }

  let sessions = 0
  // Oldest first, so the uploaded history reads in the order it happened.
  for (const session of [...localSessions].reverse()) {
    await target.sessions.create(
      {
        drillId: session.drillId ? (slugToId.get(session.drillId) ?? null) : null,
        drillName: session.drillName,
        startedAt: new Date(session.startedAt),
        durationSec: session.durationSec,
        roundsCompleted: session.roundsCompleted,
        avgShotIntervalMs: session.avgShotIntervalMs,
        notes: session.notes,
        source: session.source,
      },
      (localMetrics[session.id] ?? []).map((metric) => ({
        metricKey: metric.metricKey,
        metricValue: metric.metricValue,
      })),
    )
    sessions += 1
  }

  let benchmarks = 0
  for (const benchmark of [...localBenchmarks].reverse()) {
    await target.benchmarks.create({
      testType: benchmark.testType,
      takenAt: new Date(benchmark.takenAt),
      score: benchmark.score,
      levelReached: benchmark.levelReached,
      raw: benchmark.raw,
    })
    benchmarks += 1
  }

  await target.badges.award(localBadges)

  markMigrated(userId)
  return { sessions, benchmarks, badges: localBadges.length, skipped: false }
}
