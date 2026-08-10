import { localDateKey, weekIndex, weekIndexFromKey, weekLabel, weekStartKey } from './streaks'
import type { Session, SessionMetric } from './types'

/**
 * Every derived number the Progress dashboard and the badge engine need,
 * computed in one pure pass over the raw rows.
 *
 * Deriving rather than storing means the dashboard can never disagree with the
 * session list that produced it, and the whole thing is testable without a
 * database.
 */

export const METRIC_CALLS = 'calls_answered'
export const METRIC_COMPLETED = 'completed'
export const METRIC_DECEPTION = 'deception'
export const METRIC_BENCHMARK_LEVEL = 'benchmark_level'

export interface WeeklyBucket {
  weekIndex: number
  /** Monday of the week, `YYYY-MM-DD`. */
  weekStart: string
  label: string
  sessions: number
  minutes: number
  calls: number
}

export interface DrillStats {
  drillId: string
  drillName: string
  sessions: number
  /** Most calls answered in a single session. */
  bestCalls: number
  /** Fastest sustained shot interval achieved, in ms. */
  bestIntervalMs: number | null
  totalSec: number
  lastTrainedAt: string
}

export interface IntervalPoint {
  at: number
  date: string
  intervalMs: number
}

export interface TrainingStats {
  sessionCount: number
  totalTrainingSec: number
  totalCalls: number
  totalRounds: number
  /** Sessions run in Deception mode. */
  deceptionSessions: number
  /** Most sessions logged in any single week, ever. */
  bestWeeklySessions: number
  weekly: WeeklyBucket[]
  perDrill: DrillStats[]
  /** Fastest average interval per session, oldest first — the pace trend. */
  intervalTrend: IntervalPoint[]
}

export const EMPTY_STATS: TrainingStats = {
  sessionCount: 0,
  totalTrainingSec: 0,
  totalCalls: 0,
  totalRounds: 0,
  deceptionSessions: 0,
  bestWeeklySessions: 0,
  weekly: [],
  perDrill: [],
  intervalTrend: [],
}

function metricsBySession(metrics: SessionMetric[]): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>()
  for (const metric of metrics) {
    let entry = map.get(metric.sessionId)
    if (!entry) {
      entry = new Map()
      map.set(metric.sessionId, entry)
    }
    entry.set(metric.metricKey, metric.metricValue)
  }
  return map
}

/**
 * @param weeksBack how many weekly buckets to emit, ending with the current
 *                  week. Empty weeks are included so the chart shows the gaps.
 */
export function computeStats(
  sessions: Session[],
  metrics: SessionMetric[],
  today: Date = new Date(),
  weeksBack = 12,
): TrainingStats {
  if (sessions.length === 0) {
    return { ...EMPTY_STATS, weekly: emptyWeeks(today, weeksBack) }
  }

  const byId = metricsBySession(metrics)
  const currentWeek = weekIndex(today)

  const weekCounts = new Map<number, { sessions: number; seconds: number; calls: number }>()
  const drills = new Map<string, DrillStats>()
  const intervalTrend: IntervalPoint[] = []

  let totalTrainingSec = 0
  let totalCalls = 0
  let totalRounds = 0
  let deceptionSessions = 0

  for (const session of sessions) {
    const own = byId.get(session.id)
    const calls = own?.get(METRIC_CALLS) ?? 0
    const startedAt = new Date(session.startedAt)
    const dateKey = localDateKey(startedAt)
    const week = weekIndexFromKey(dateKey)

    totalTrainingSec += session.durationSec
    totalCalls += calls
    totalRounds += session.roundsCompleted
    if (own?.get(METRIC_DECEPTION) === 1) deceptionSessions += 1

    const bucket = weekCounts.get(week) ?? { sessions: 0, seconds: 0, calls: 0 }
    bucket.sessions += 1
    bucket.seconds += session.durationSec
    bucket.calls += calls
    weekCounts.set(week, bucket)

    if (session.avgShotIntervalMs && session.avgShotIntervalMs > 0) {
      intervalTrend.push({
        at: startedAt.getTime(),
        date: dateKey,
        intervalMs: session.avgShotIntervalMs,
      })
    }

    const key = session.drillId ?? session.drillName ?? 'custom'
    const existing = drills.get(key)
    if (!existing) {
      drills.set(key, {
        drillId: key,
        drillName: session.drillName ?? 'Custom drill',
        sessions: 1,
        bestCalls: calls,
        bestIntervalMs: session.avgShotIntervalMs ?? null,
        totalSec: session.durationSec,
        lastTrainedAt: session.startedAt,
      })
    } else {
      existing.sessions += 1
      existing.bestCalls = Math.max(existing.bestCalls, calls)
      existing.totalSec += session.durationSec
      if (session.avgShotIntervalMs && session.avgShotIntervalMs > 0) {
        existing.bestIntervalMs =
          existing.bestIntervalMs === null
            ? session.avgShotIntervalMs
            : Math.min(existing.bestIntervalMs, session.avgShotIntervalMs)
      }
      if (session.startedAt > existing.lastTrainedAt) existing.lastTrainedAt = session.startedAt
    }
  }

  const weekly: WeeklyBucket[] = []
  for (let i = weeksBack - 1; i >= 0; i--) {
    const index = currentWeek - i
    const bucket = weekCounts.get(index)
    weekly.push({
      weekIndex: index,
      weekStart: weekStartKey(index),
      label: weekLabel(index),
      sessions: bucket?.sessions ?? 0,
      minutes: Math.round((bucket?.seconds ?? 0) / 60),
      calls: bucket?.calls ?? 0,
    })
  }

  return {
    sessionCount: sessions.length,
    totalTrainingSec,
    totalCalls,
    totalRounds,
    deceptionSessions,
    bestWeeklySessions: Math.max(0, ...[...weekCounts.values()].map((b) => b.sessions)),
    weekly,
    perDrill: [...drills.values()].sort((a, b) => b.sessions - a.sessions),
    intervalTrend: intervalTrend.sort((a, b) => a.at - b.at),
  }
}

function emptyWeeks(today: Date, weeksBack: number): WeeklyBucket[] {
  const currentWeek = weekIndex(today)
  return Array.from({ length: weeksBack }, (_, i) => {
    const index = currentWeek - (weeksBack - 1 - i)
    return {
      weekIndex: index,
      weekStart: weekStartKey(index),
      label: weekLabel(index),
      sessions: 0,
      minutes: 0,
      calls: 0,
    }
  })
}
