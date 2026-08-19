import type { LoadSummary } from '@/lib/data/load'
import type { TrainingStats } from '@/lib/data/stats'
import type { Benchmark, Streak } from '@/lib/data/types'

/**
 * One number for how well you are training, and the tiers it climbs through.
 *
 * The app already measured five separate things and asked the player to hold
 * them all in their head. A rating is the thing people actually come back for:
 * a single figure that goes up when you do the work, breaks down into parts you
 * can act on, and does not move when you do nothing.
 *
 * It rates **training**, not playing standard. A rating cannot know whether you
 * win on a Saturday, and pretending otherwise would be a lie the first tournament
 * exposes. Every component below is something the app has actually watched you
 * do.
 *
 * Deliberately hard to farm: consistency is capped by weeks, not sessions, so
 * six sessions in one day does not buy what six weeks does. And it decays — a
 * rating you keep while doing nothing is a participation trophy.
 */

export const MAX_RATING = 1000

export interface RatingComponent {
  key: 'consistency' | 'volume' | 'sharpness' | 'engine' | 'range'
  label: string
  /** Points earned of the maximum this component is worth. */
  points: number
  max: number
  /** What moves it, in one line. */
  hint: string
}

export interface PlayerRating {
  points: number
  tier: Tier
  /** Points still needed for the next tier, or null at the top. */
  toNextTier: number | null
  /** 0..1 through the current tier. */
  tierProgress: number
  components: RatingComponent[]
  /** The component with the most points left on the table. */
  weakest: RatingComponent
}

export interface Tier {
  name: string
  /** Lowest rating in the tier. */
  from: number
  blurb: string
}

export const TIERS: Tier[] = [
  {
    name: 'Newcomer',
    from: 0,
    blurb: 'Everyone starts here. Log a session and this starts moving.',
  },
  { name: 'Trainee', from: 120, blurb: 'Training is becoming a habit rather than an event.' },
  { name: 'Regular', from: 300, blurb: 'You turn up. Most club players never get this far.' },
  { name: 'Athlete', from: 500, blurb: 'Consistent, varied, and getting measurably faster.' },
  { name: 'Contender', from: 700, blurb: 'Training like someone who expects to win their league.' },
  { name: 'Machine', from: 870, blurb: 'Very few people train like this. Mind the ramp.' },
]

export function tierFor(points: number): Tier {
  let found = TIERS[0] as Tier
  for (const tier of TIERS) if (points >= tier.from) found = tier
  return found
}

/** Weights, summing to MAX_RATING. */
const WEIGHT = {
  consistency: 280,
  volume: 200,
  sharpness: 180,
  engine: 190,
  range: 150,
} as const

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0)

/**
 * Turning up, week after week. Weighted hardest because it is the only one that
 * cannot be bought in an afternoon, and it is what actually makes players
 * better.
 */
function consistencyScore(streak: Streak, stats: TrainingStats): number {
  // Twelve consecutive weeks is a full mark. Beyond that it holds rather than
  // inflating for ever.
  const run = clamp01(streak.currentStreak / 12)
  // Three sessions a week is the target the programs are built around.
  const recent = stats.weekly.slice(-4)
  const perWeek = recent.length
    ? recent.reduce((sum, week) => sum + week.sessions, 0) / recent.length
    : 0
  const frequency = clamp01(perWeek / 3)
  return run * 0.6 + frequency * 0.4
}

/** How much work the last month actually held. */
function volumeScore(load: LoadSummary): number {
  // 900 a week is a serious amateur block: roughly three hard 45-minute
  // sessions. It is meant to be reachable, not a world-tour figure.
  return clamp01(load.chronic / 900)
}

/**
 * Whether you are getting faster. Compares your recent pace against your own
 * earliest sessions rather than an absolute, because a beginner improving from
 * 2.0s to 1.7s has done exactly what an advanced player dropping 1.3 to 1.15 has.
 */
function sharpnessScore(stats: TrainingStats): number {
  const trend = stats.intervalTrend
  if (trend.length < 4) return 0
  const window = Math.max(2, Math.floor(trend.length / 4))
  const mean = (points: typeof trend) =>
    points.reduce((sum, point) => sum + point.intervalMs, 0) / points.length
  const first = mean(trend.slice(0, window))
  const last = mean(trend.slice(-window))
  if (first <= 0) return 0
  // A 25% improvement in shot interval is a full mark; that is a big change.
  return clamp01((first - last) / first / 0.25)
}

/** The benchmark, which is the one number the app asks you to chase directly. */
function engineScore(benchmarks: Benchmark[]): number {
  const best = benchmarks.reduce((top, entry) => Math.max(top, entry.score), 0)
  // 200 corner touches is an excellent B-ENDURANCE-style score.
  return clamp01(best / 200)
}

/** Training more than one thing. A player who only ever runs one drill plateaus. */
function rangeScore(stats: TrainingStats): number {
  const trained = stats.perDrill.filter((drill) => drill.sessions > 0).length
  return clamp01(trained / 6)
}

export interface RatingInput {
  stats: TrainingStats
  streak: Streak
  load: LoadSummary
  benchmarks: Benchmark[]
}

export function computeRating(input: RatingInput): PlayerRating {
  const raw: { key: RatingComponent['key']; label: string; score: number; hint: string }[] = [
    {
      key: 'consistency',
      label: 'Consistency',
      score: consistencyScore(input.streak, input.stats),
      hint: 'Train most weeks. A long unbroken run is worth more than a heavy fortnight.',
    },
    {
      key: 'volume',
      label: 'Volume',
      score: volumeScore(input.load),
      hint: 'Total work over the last month. Build it gradually — the ramp warning still applies.',
    },
    {
      key: 'sharpness',
      label: 'Sharpness',
      score: sharpnessScore(input.stats),
      hint: 'Whether your pace is improving against your own earliest sessions.',
    },
    {
      key: 'engine',
      label: 'Engine',
      score: engineScore(input.benchmarks),
      hint: 'Your best benchmark score. Retest every few weeks to move it.',
    },
    {
      key: 'range',
      label: 'Range',
      score: rangeScore(input.stats),
      hint: 'How many different drills you have actually trained. One drill forever plateaus.',
    },
  ]

  const components: RatingComponent[] = raw.map((entry) => ({
    key: entry.key,
    label: entry.label,
    max: WEIGHT[entry.key],
    points: Math.round(entry.score * WEIGHT[entry.key]),
    hint: entry.hint,
  }))

  const points = Math.min(
    MAX_RATING,
    components.reduce((sum, component) => sum + component.points, 0),
  )
  const tier = tierFor(points)
  const next = TIERS[TIERS.indexOf(tier) + 1]

  const weakest = components.reduce((worst, component) =>
    component.max - component.points > worst.max - worst.points ? component : worst,
  )

  return {
    points,
    tier,
    toNextTier: next ? next.from - points : null,
    tierProgress: next ? clamp01((points - tier.from) / (next.from - tier.from)) : 1,
    components,
    weakest,
  }
}

export const EMPTY_RATING: PlayerRating = computeRating({
  stats: {
    sessionCount: 0,
    totalTrainingSec: 0,
    totalCalls: 0,
    totalRounds: 0,
    deceptionSessions: 0,
    bestWeeklySessions: 0,
    weekly: [],
    perDrill: [],
    intervalTrend: [],
  },
  streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, weeklySessionsCount: 0 },
  load: {
    daily: [],
    acute: 0,
    chronic: 0,
    ratio: null,
    status: 'settling',
    last7: 0,
    previous7: 0,
    unrated: 0,
    sessions: 0,
    averageRpe: null,
  },
  benchmarks: [],
})
