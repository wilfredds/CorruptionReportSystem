import type { TrainingStats } from './stats'
import type { Streak } from './types'

/**
 * Achievements.
 *
 * Gamification stays moderate and *segmented* (§4 Phase 2): three tiers, so a
 * beginner always has a bronze within reach and a returning competitor still
 * has a gold to chase. Nothing here gates a feature — badges recognise work
 * already done, they never withhold anything.
 *
 * Unlocks are derived from the training history rather than incremented, for
 * the same reason streaks are: a projection cannot drift out of sync.
 */

export type BadgeTier = 'bronze' | 'silver' | 'gold'

export interface BadgeDefinition {
  slug: string
  name: string
  description: string
  /** lucide-react icon name, resolved by the trophy case. */
  icon: string
  tier: BadgeTier
  /** Progress towards the unlock, for the "not yet" state. */
  progress?: (input: BadgeInput) => { current: number; target: number }
}

export interface BadgeInput {
  stats: TrainingStats
  streak: Streak
  benchmarkCount: number
  /** True once onboarding has been completed. */
  hasProfile: boolean
}

const HOUR_SEC = 3600

export const BADGES: BadgeDefinition[] = [
  {
    slug: 'getting-started',
    name: 'Getting Started',
    description: 'Set your level and discipline.',
    icon: 'flag',
    tier: 'bronze',
  },
  {
    slug: 'first-session',
    name: 'First Steps',
    description: 'Complete your first session.',
    icon: 'footprints',
    tier: 'bronze',
    progress: ({ stats }) => ({ current: Math.min(stats.sessionCount, 1), target: 1 }),
  },
  {
    slug: 'week-one',
    name: 'Week One Down',
    description: 'Train twice in a single week.',
    icon: 'calendar-check',
    tier: 'bronze',
    progress: ({ stats }) => ({ current: Math.min(stats.bestWeeklySessions, 2), target: 2 }),
  },
  {
    slug: 'benchmarked',
    name: 'Know Your Number',
    description: 'Take the fitness benchmark.',
    icon: 'gauge',
    tier: 'silver',
    progress: ({ benchmarkCount }) => ({ current: Math.min(benchmarkCount, 1), target: 1 }),
  },
  {
    slug: 'streak-4',
    name: 'Four in a Row',
    description: 'Four consecutive weeks with a session.',
    icon: 'flame',
    tier: 'silver',
    progress: ({ streak }) => ({ current: Math.min(streak.longestStreak, 4), target: 4 }),
  },
  {
    slug: 'thousand-calls',
    name: 'A Thousand Corners',
    description: 'Answer 1,000 corner calls.',
    icon: 'target',
    tier: 'silver',
    progress: ({ stats }) => ({ current: Math.min(stats.totalCalls, 1000), target: 1000 }),
  },
  {
    slug: 'streak-12',
    name: 'Season Builder',
    description: 'Twelve consecutive weeks with a session.',
    icon: 'trophy',
    tier: 'gold',
    progress: ({ streak }) => ({ current: Math.min(streak.longestStreak, 12), target: 12 }),
  },
  {
    slug: 'deception-pro',
    name: 'Never Wrong-Footed',
    description: 'Complete ten Deception sessions.',
    icon: 'shuffle',
    tier: 'gold',
    progress: ({ stats }) => ({ current: Math.min(stats.deceptionSessions, 10), target: 10 }),
  },
  {
    slug: 'ten-hours',
    name: 'Ten Hours In',
    description: 'Ten hours of logged training.',
    icon: 'hourglass',
    tier: 'gold',
    progress: ({ stats }) => ({
      current: Math.min(stats.totalTrainingSec, 10 * HOUR_SEC),
      target: 10 * HOUR_SEC,
    }),
  },
]

const PREDICATES: Record<string, (input: BadgeInput) => boolean> = {
  'getting-started': ({ hasProfile }) => hasProfile,
  'first-session': ({ stats }) => stats.sessionCount >= 1,
  'week-one': ({ stats }) => stats.bestWeeklySessions >= 2,
  benchmarked: ({ benchmarkCount }) => benchmarkCount >= 1,
  'streak-4': ({ streak }) => streak.longestStreak >= 4,
  'thousand-calls': ({ stats }) => stats.totalCalls >= 1000,
  'streak-12': ({ streak }) => streak.longestStreak >= 12,
  'deception-pro': ({ stats }) => stats.deceptionSessions >= 10,
  'ten-hours': ({ stats }) => stats.totalTrainingSec >= 10 * HOUR_SEC,
}

export function badgeBySlug(slug: string): BadgeDefinition | undefined {
  return BADGES.find((badge) => badge.slug === slug)
}

/** Slugs the user has earned, in catalogue order. */
export function evaluateBadges(input: BadgeInput): string[] {
  return BADGES.filter((badge) => PREDICATES[badge.slug]?.(input) ?? false).map(
    (badge) => badge.slug,
  )
}

export interface BadgeState extends BadgeDefinition {
  earned: boolean
  /** 0..1, only meaningful while unearned. */
  progressRatio: number
  progressLabel: string | null
}

/** The full catalogue with earned state and progress, for the trophy case. */
export function badgeStates(input: BadgeInput): BadgeState[] {
  const earned = new Set(evaluateBadges(input))
  return BADGES.map((badge) => {
    const progress = badge.progress?.(input)
    return {
      ...badge,
      earned: earned.has(badge.slug),
      progressRatio: progress && progress.target > 0 ? progress.current / progress.target : 0,
      progressLabel:
        progress && !earned.has(badge.slug)
          ? badge.slug === 'ten-hours'
            ? `${(progress.current / HOUR_SEC).toFixed(1)} / 10 hours`
            : `${progress.current} / ${progress.target}`
          : null,
    }
  })
}
