import type { LoadStatus } from '@/lib/data/load'
import type { Adjustment } from '@/lib/data/readiness'
import { autoRegulate } from '@/lib/data/readiness'
import type { TrainingStats } from '@/lib/data/stats'
import { localDateKey } from '@/lib/data/streaks'
import type { Drill, ReadinessAnswers, SkillLevel, Streak } from '@/lib/data/types'
import { isConditioning, isPrepOrRecovery } from '@/lib/data/seed/drills'

import { withinLevel } from '@/lib/library/focus'

/**
 * What to do today, decided rather than listed.
 *
 * This is the closest thing in the app to the thing people pay a coach for.
 * Everything it needs already existed — readiness, load, the periodiser, the
 * history — but the player was left to hold all of it in their head and choose.
 * A coach does not hand you a catalogue; they look at you, look at the last
 * fortnight, and say "today we do this, and here is why".
 *
 * The rules are deliberately few and readable. A recommendation nobody can
 * explain is one nobody trusts, and the reason it gives is checked against the
 * same inputs a human would use.
 *
 * Pure: takes a snapshot, returns a choice. No clock, no storage, no React.
 */

export type PickReasonCode =
  | 'rest'
  | 'warm-up-first'
  | 'programme'
  | 'recover'
  | 'neglected'
  | 'benchmark'
  | 'variety'
  | 'default'

export interface CoachPick {
  /** The drill to do, or null when the answer is "nothing today". */
  drill: Drill | null
  /** Headline, in the imperative — this is an instruction, not a menu. */
  headline: string
  /** Why, in one sentence a player can argue with. */
  reason: string
  code: PickReasonCode
  /** Applied to the session if the player takes the advice. */
  adjustment: Adjustment
  /** True when the honest answer is to do nothing at all today. */
  restDay: boolean
}

export interface CoachInput {
  drills: Drill[]
  stats: TrainingStats
  streak: Streak
  loadStatus: LoadStatus
  readiness: ReadinessAnswers | null
  level: SkillLevel
  /** Whether a warm-up is still counted as done. */
  warm: boolean
  /** The program's session for today, if enrolled — it outranks everything. */
  programDrillSlug: string | null
  programIsRestDay: boolean
  /** Sessions already logged today. */
  sessionsToday: number
  /**
   * When the last benchmark was taken, or null if never. A timestamp rather
   * than an elapsed count so the caller never has to read a clock — that is
   * this function's job, via `today`, and it keeps the React side pure.
   */
  lastBenchmarkAt: string | null
  today?: Date
}

/** Retest roughly monthly: often enough to see a change, rarely enough to matter. */
const BENCHMARK_DUE_DAYS = 28

/** Two sessions in a day is a choice; a third is how people get hurt. */
const MAX_SESSIONS_A_DAY = 2

function trainable(drills: Drill[], level: SkillLevel): Drill[] {
  return drills.filter(
    (drill) => !isPrepOrRecovery(drill) && withinLevel(drill.level, level, false),
  )
}

/** The drill trained least recently, preferring one never trained at all. */
function mostNeglected(drills: Drill[], stats: TrainingStats, today: Date): Drill | null {
  const byId = new Map(stats.perDrill.map((entry) => [entry.drillId, entry]))
  let best: { drill: Drill; staleness: number } | null = null

  for (const drill of drills) {
    // A drill matches its stats by slug locally and by uuid once signed in;
    // both are checked so the pick does not silently reset on sign-in.
    const stat = byId.get(drill.slug) ?? byId.get(drill.id)
    const staleness = stat
      ? (today.getTime() - new Date(stat.lastTrainedAt).getTime()) / 86_400_000
      : Infinity
    if (!best || staleness > best.staleness) best = { drill, staleness }
  }
  return best?.drill ?? null
}

export function pickToday(input: CoachInput): CoachPick {
  const today = input.today ?? new Date()
  const pool = trainable(input.drills, input.level)
  const advice = autoRegulate({ answers: input.readiness, load: input.loadStatus })
  const adjustment = advice.adjustment

  /* -------------------------------------------------- reasons not to train */

  if (input.sessionsToday >= MAX_SESSIONS_A_DAY) {
    return {
      drill: null,
      headline: 'That is enough for today',
      reason: `You have already trained ${input.sessionsToday} times today. A third session buys you nothing that tomorrow would not buy more cheaply.`,
      code: 'rest',
      adjustment: 'as-planned',
      restDay: true,
    }
  }

  if (input.programIsRestDay) {
    return {
      drill: null,
      headline: 'Rest day — take it',
      reason:
        'Your plan has today down as rest, and rest is where the last few sessions actually turn into fitness. Walk, stretch, sleep.',
      code: 'rest',
      adjustment: 'as-planned',
      restDay: true,
    }
  }

  if (input.loadStatus === 'spiking' && input.readiness && advice.adjustment === 'lighter') {
    // Both the numbers and the player agree it has been too much.
    const light = pool.find((drill) => drill.level === 'beginner' && !isConditioning(drill))
    return {
      drill: light ?? pool[0] ?? null,
      headline: 'Keep today short',
      reason: advice.reason,
      code: 'recover',
      adjustment: 'lighter',
      restDay: false,
    }
  }

  /* ------------------------------------------------------ the plan first */

  if (input.programDrillSlug) {
    const planned = input.drills.find((drill) => drill.slug === input.programDrillSlug)
    if (planned) {
      return {
        drill: planned,
        headline: `Today: ${planned.name}`,
        reason:
          adjustment === 'lighter'
            ? `${advice.reason} Do the planned session, cut back.`
            : 'This is what your program has scheduled, and the plan knows where it is going better than a good mood does.',
        code: 'programme',
        adjustment,
        restDay: false,
      }
    }
  }

  if (pool.length === 0) {
    return {
      drill: null,
      headline: 'Nothing at your level yet',
      reason: 'Move your level up on the Train screen, or start with the basics.',
      code: 'default',
      adjustment: 'as-planned',
      restDay: false,
    }
  }

  /* ------------------------------------------------ otherwise, choose one */

  const daysSinceBenchmark =
    input.lastBenchmarkAt === null
      ? null
      : (today.getTime() - new Date(input.lastBenchmarkAt).getTime()) / 86_400_000

  if (
    daysSinceBenchmark !== null &&
    daysSinceBenchmark >= BENCHMARK_DUE_DAYS &&
    adjustment !== 'lighter'
  ) {
    return {
      drill: null,
      headline: 'Time to retest',
      reason: `It has been ${Math.round(daysSinceBenchmark)} days since your last benchmark. Retest today — a number you never recheck stops meaning anything.`,
      code: 'benchmark',
      adjustment: 'as-planned',
      restDay: false,
    }
  }

  const neglected = mostNeglected(pool, input.stats, today)
  const trainedIds = new Set(input.stats.perDrill.map((entry) => entry.drillId))
  const untouched = neglected && !trainedIds.has(neglected.slug) && !trainedIds.has(neglected.id)

  if (neglected) {
    return {
      drill: neglected,
      headline: `Today: ${neglected.name}`,
      reason: untouched
        ? 'You have not tried this one yet. Training the same drill for ever is the fastest way to plateau.'
        : adjustment === 'harder'
          ? `${advice.reason} This is the one you have left alone longest.`
          : 'This is the drill you have left alone longest, and the gaps are where progress hides.',
      code: untouched ? 'variety' : 'neglected',
      adjustment,
      restDay: false,
    }
  }

  return {
    drill: pool[0] ?? null,
    headline: `Today: ${pool[0]?.name ?? 'Train'}`,
    reason: advice.reason,
    code: 'default',
    adjustment,
    restDay: false,
  }
}

/** Whether a warm-up should be pushed before this pick. */
export function needsWarmUp(pick: CoachPick, warm: boolean): boolean {
  return !warm && !pick.restDay && pick.drill !== null
}

/** Sessions logged today, from their start timestamps. */
export function countSessionsToday(startedAt: string[], today = new Date()): number {
  const key = localDateKey(today)
  return startedAt.filter((stamp) => localDateKey(new Date(stamp)) === key).length
}
