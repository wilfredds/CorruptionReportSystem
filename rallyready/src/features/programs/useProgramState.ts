import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { useRepositories } from '@/lib/data/context'
import type { Program, ProgramDay, ProgramEnrollment } from '@/lib/data/types'

/**
 * The active enrolment and everything derived from it, in one place: the
 * program, its plan, today's day, and the two ways to move through it.
 */

export interface ProgramState {
  loading: boolean
  enrollment: ProgramEnrollment | null
  program: Program | null
  days: ProgramDay[]
  /** The day the enrolment is currently pointing at. */
  today: ProgramDay | null
  /** 0..1 through the whole plan. */
  progress: number
  completedDays: number
  totalDays: number
  advance: () => Promise<void>
  goTo: (weekNo: number, dayNo: number) => Promise<void>
  abandon: () => Promise<void>
}

export function useProgramState(): ProgramState {
  const repositories = useRepositories()
  const queryClient = useQueryClient()

  const enrollmentQuery = useQuery({
    queryKey: ['program-enrollment'],
    queryFn: () => repositories.programs.activeEnrollment(),
  })
  const enrollment = enrollmentQuery.data ?? null

  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: () => repositories.programs.list(),
  })

  const program = useMemo(
    () =>
      enrollment
        ? ((programsQuery.data ?? []).find((candidate) => candidate.id === enrollment.programId) ??
          null)
        : null,
    [enrollment, programsQuery.data],
  )

  const daysQuery = useQuery({
    queryKey: ['program-days', program?.id],
    queryFn: () => repositories.programs.listDays(program?.id ?? ''),
    enabled: Boolean(program),
  })
  const days = useMemo(() => daysQuery.data ?? [], [daysQuery.data])

  const today = useMemo(() => {
    if (!enrollment) return null
    return (
      days.find(
        (day) => day.weekNo === enrollment.currentWeek && day.dayNo === enrollment.currentDay,
      ) ?? null
    )
  }, [days, enrollment])

  const totalDays = program ? program.totalWeeks * 7 : 0
  const completedDays = enrollment
    ? (enrollment.currentWeek - 1) * 7 + enrollment.currentDay - 1
    : 0

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['program-enrollment'] })
    // Separate key, so prefix matching does not reach it: the detail screen
    // reads the full history to know whether the program has been finished.
    await queryClient.invalidateQueries({ queryKey: ['program-enrollments'] })
  }, [queryClient])

  /** Steps to the next day, rolling into the next week and finishing at the end. */
  const advance = useCallback(async () => {
    if (!enrollment || !program) return
    const nextDay = enrollment.currentDay + 1
    const rollsOver = nextDay > 7
    const week = rollsOver ? enrollment.currentWeek + 1 : enrollment.currentWeek
    const day = rollsOver ? 1 : nextDay

    if (week > program.totalWeeks) {
      await repositories.programs.setStatus(enrollment.id, 'completed')
    } else {
      await repositories.programs.setPosition(enrollment.id, week, day)
    }
    await refresh()
  }, [enrollment, program, refresh, repositories])

  const goTo = useCallback(
    async (weekNo: number, dayNo: number) => {
      if (!enrollment) return
      await repositories.programs.setPosition(enrollment.id, weekNo, dayNo)
      await refresh()
    },
    [enrollment, refresh, repositories],
  )

  const abandon = useCallback(async () => {
    if (!enrollment) return
    await repositories.programs.setStatus(enrollment.id, 'abandoned')
    await refresh()
  }, [enrollment, refresh, repositories])

  return {
    loading: enrollmentQuery.isLoading || programsQuery.isLoading,
    enrollment,
    program,
    days,
    today,
    progress: totalDays > 0 ? Math.min(1, completedDays / totalDays) : 0,
    completedDays,
    totalDays,
    advance,
    goTo,
    abandon,
  }
}
