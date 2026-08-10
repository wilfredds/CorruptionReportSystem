import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { badgeStates, evaluateBadges, type BadgeInput, type BadgeState } from '@/lib/data/badges'
import { useRepositories } from '@/lib/data/context'
import { computeStats, type TrainingStats } from '@/lib/data/stats'
import { EMPTY_STREAK } from '@/lib/data/streaks'
import type { Benchmark, Profile, Session, Streak } from '@/lib/data/types'

/**
 * Everything the Progress screen needs, fetched once and derived in one place,
 * plus the side effect of recording any badge the history has just earned.
 *
 * Awarding is reconciliation, not an event: on every load the derived set is
 * compared against what is stored and the difference is written. A badge can
 * therefore never be missed because the app was closed at the wrong moment,
 * and it can never be awarded twice.
 */

export interface TrainingData {
  loading: boolean
  sessions: Session[]
  stats: TrainingStats
  streak: Streak
  benchmarks: Benchmark[]
  profile: Profile | null
  badges: BadgeState[]
  earnedCount: number
}

const SESSION_LIMIT = 500

export function useTrainingData(): TrainingData {
  const repositories = useRepositories()
  const queryClient = useQueryClient()

  const sessionsQuery = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => repositories.sessions.listRecent(SESSION_LIMIT),
  })
  const metricsQuery = useQuery({
    queryKey: ['metrics', 'all'],
    queryFn: () => repositories.sessions.listAllMetrics(),
  })
  const streakQuery = useQuery({
    queryKey: ['streak'],
    queryFn: () => repositories.streaks.get(),
  })
  const benchmarksQuery = useQuery({
    queryKey: ['benchmarks'],
    queryFn: () => repositories.benchmarks.list(),
  })
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => repositories.profiles.get(),
  })
  const earnedQuery = useQuery({
    queryKey: ['badges', 'earned'],
    queryFn: () => repositories.badges.listEarned(),
  })

  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data])
  const metrics = useMemo(() => metricsQuery.data ?? [], [metricsQuery.data])
  const benchmarks = useMemo(() => benchmarksQuery.data ?? [], [benchmarksQuery.data])
  const streak = streakQuery.data ?? EMPTY_STREAK
  const profile = profileQuery.data ?? null

  const stats = useMemo(() => computeStats(sessions, metrics), [sessions, metrics])

  const badgeInput = useMemo<BadgeInput>(
    () => ({
      stats,
      streak,
      benchmarkCount: benchmarks.length,
      hasProfile: profile !== null,
    }),
    [stats, streak, benchmarks.length, profile],
  )

  const loading =
    sessionsQuery.isLoading ||
    metricsQuery.isLoading ||
    streakQuery.isLoading ||
    benchmarksQuery.isLoading ||
    earnedQuery.isLoading

  // Reconcile earned badges against the history.
  const writingRef = useRef(false)
  const earned = earnedQuery.data
  useEffect(() => {
    if (loading || !earned || writingRef.current) return
    const deserved = evaluateBadges(badgeInput)
    const missing = deserved.filter((slug) => !earned.includes(slug))
    if (missing.length === 0) return

    writingRef.current = true
    void repositories.badges
      .award(missing)
      .then(() => queryClient.invalidateQueries({ queryKey: ['badges', 'earned'] }))
      .catch(() => {
        /* storage refused; the next load reconciles again */
      })
      .finally(() => {
        writingRef.current = false
      })
  }, [badgeInput, earned, loading, queryClient, repositories])

  const badges = useMemo(() => {
    const stored = new Set(earned ?? [])
    // Trust the derived state for display so a badge appears the moment it is
    // earned, without waiting for the write to land.
    return badgeStates(badgeInput).map((badge) => ({
      ...badge,
      earned: badge.earned || stored.has(badge.slug),
    }))
  }, [badgeInput, earned])

  return {
    loading,
    sessions,
    stats,
    streak,
    benchmarks,
    profile,
    badges,
    earnedCount: badges.filter((badge) => badge.earned).length,
  }
}
