import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { useRepositories } from '@/lib/data/context'
import { computeLoad, EMPTY_LOAD, type LoadSummary } from '@/lib/data/load'
import { autoRegulate, type Recommendation } from '@/lib/data/readiness'
import { localDateKey } from '@/lib/data/streaks'
import type { ReadinessAnswers, ReadinessCheck } from '@/lib/data/types'
import { adjustmentFor, useUiStore } from '@/store/uiStore'

/**
 * Today's check-in, the recent workload, and the single instruction the two of
 * them add up to.
 *
 * Shares query keys with the Progress dashboard, so opening Train does not
 * re-fetch a history that screen has already loaded.
 */

export interface ReadinessState {
  loading: boolean
  /** Local `YYYY-MM-DD`; what "today" means for the check-in. */
  date: string
  today: ReadinessCheck | null
  load: LoadSummary
  recommendation: Recommendation
  /** True when the player has taken the recommendation for today. */
  applied: boolean
  save(answers: ReadinessAnswers): Promise<void>
  setApplied(on: boolean): void
}

const SESSION_LIMIT = 500

export function useReadiness(): ReadinessState {
  const repositories = useRepositories()
  const queryClient = useQueryClient()
  const date = localDateKey(new Date())

  const adjustment = useUiStore((state) => state.adjustment)
  const adjustmentDate = useUiStore((state) => state.adjustmentDate)
  const setAdjustment = useUiStore((state) => state.setAdjustment)

  const todayQuery = useQuery({
    queryKey: ['readiness', date],
    queryFn: () => repositories.readiness.today(date),
  })

  const sessionsQuery = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => repositories.sessions.listRecent(SESSION_LIMIT),
  })
  const metricsQuery = useQuery({
    queryKey: ['metrics', 'all'],
    queryFn: () => repositories.sessions.listAllMetrics(),
  })

  const load = useMemo(
    () =>
      sessionsQuery.data && metricsQuery.data
        ? computeLoad(sessionsQuery.data, metricsQuery.data)
        : EMPTY_LOAD,
    [sessionsQuery.data, metricsQuery.data],
  )

  const today = todayQuery.data ?? null

  const recommendation = useMemo(
    () => autoRegulate({ answers: today, load: load.status }),
    [today, load.status],
  )

  const save = useCallback(
    async (answers: ReadinessAnswers) => {
      await repositories.readiness.save({ date, ...answers })
      await queryClient.invalidateQueries({ queryKey: ['readiness'] })
    },
    [date, queryClient, repositories],
  )

  const setApplied = useCallback(
    (on: boolean) => setAdjustment(on ? recommendation.adjustment : null, date),
    [date, recommendation.adjustment, setAdjustment],
  )

  return {
    loading: todayQuery.isLoading,
    date,
    today,
    load,
    recommendation,
    applied: adjustmentFor({ adjustment, adjustmentDate }, date) !== null,
    save,
    setApplied,
  }
}
