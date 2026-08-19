import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useRepositories } from '@/lib/data/context'
import { computeLoad, EMPTY_LOAD } from '@/lib/data/load'
import { computeStats, EMPTY_STATS } from '@/lib/data/stats'
import { EMPTY_STREAK } from '@/lib/data/streaks'
import type { SkillLevel } from '@/lib/data/types'
import { countSessionsToday, pickToday, type CoachPick } from '@/lib/coach/pick'
import { computeRating, EMPTY_RATING, type PlayerRating } from '@/lib/coach/rating'
import { localDateKey } from '@/lib/data/streaks'
import { isStillWarm, useUiStore } from '@/store/uiStore'

import { useProgramState } from '../programs/useProgramState'

/**
 * Everything the coach needs, assembled from the queries the rest of the app is
 * already running. Shares query keys throughout, so opening Train costs no
 * extra reads.
 */

export interface CoachState {
  loading: boolean
  pick: CoachPick
  rating: PlayerRating
  /** Whether a warm-up is still in date. */
  warm: boolean
}

const SESSION_LIMIT = 500

export function useCoach(): CoachState {
  const repositories = useRepositories()
  const program = useProgramState()
  const lastWarmupAt = useUiStore((state) => state.lastWarmupAt)
  const storedLevel = useUiStore((state) => state.browseLevel)

  const drillsQuery = useQuery({ queryKey: ['drills'], queryFn: () => repositories.drills.list() })
  const sessionsQuery = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => repositories.sessions.listRecent(SESSION_LIMIT),
  })
  const metricsQuery = useQuery({
    queryKey: ['metrics', 'all'],
    queryFn: () => repositories.sessions.listAllMetrics(),
  })
  const streakQuery = useQuery({ queryKey: ['streak'], queryFn: () => repositories.streaks.get() })
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => repositories.profiles.get(),
  })
  const benchmarksQuery = useQuery({
    queryKey: ['benchmarks'],
    queryFn: () => repositories.benchmarks.list(),
  })
  const readinessQuery = useQuery({
    queryKey: ['readiness', localDateKey(new Date())],
    queryFn: () => repositories.readiness.today(localDateKey(new Date())),
  })

  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data])
  const metrics = useMemo(() => metricsQuery.data ?? [], [metricsQuery.data])
  const drills = useMemo(() => drillsQuery.data ?? [], [drillsQuery.data])
  const benchmarks = useMemo(() => benchmarksQuery.data ?? [], [benchmarksQuery.data])

  const stats = useMemo(() => computeStats(sessions, metrics), [sessions, metrics])
  const load = useMemo(() => computeLoad(sessions, metrics), [sessions, metrics])
  const streak = streakQuery.data ?? EMPTY_STREAK
  const level: SkillLevel = storedLevel ?? profileQuery.data?.skillLevel ?? 'beginner'

  const lastBenchmarkAt = useMemo(() => {
    if (benchmarks.length === 0) return null
    return benchmarks.reduce(
      (newest, entry) => (entry.takenAt > newest ? entry.takenAt : newest),
      benchmarks[0]!.takenAt,
    )
  }, [benchmarks])

  const loading =
    drillsQuery.isLoading ||
    sessionsQuery.isLoading ||
    metricsQuery.isLoading ||
    readinessQuery.isLoading

  const pick = useMemo(
    () =>
      pickToday({
        drills,
        stats: loading ? EMPTY_STATS : stats,
        streak,
        loadStatus: loading ? EMPTY_LOAD.status : load.status,
        readiness: readinessQuery.data ?? null,
        level,
        warm: isStillWarm(lastWarmupAt),
        programDrillSlug: program.today?.drillSlugs[0] ?? null,
        programIsRestDay: program.today?.focus === 'rest',
        sessionsToday: countSessionsToday(sessions.map((session) => session.startedAt)),
        lastBenchmarkAt,
      }),
    [
      drills,
      loading,
      stats,
      streak,
      load.status,
      readinessQuery.data,
      level,
      lastWarmupAt,
      program.today,
      sessions,
      lastBenchmarkAt,
    ],
  )

  const rating = useMemo(
    () => (loading ? EMPTY_RATING : computeRating({ stats, streak, load, benchmarks })),
    [loading, stats, streak, load, benchmarks],
  )

  return { loading, pick, rating, warm: isStillWarm(lastWarmupAt) }
}
