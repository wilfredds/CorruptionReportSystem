import { describe, expect, it } from 'vitest'

import { BADGES, badgeStates, evaluateBadges, type BadgeInput } from './badges'
import { EMPTY_STATS } from './stats'
import { EMPTY_STREAK } from './streaks'

function input(overrides: Partial<BadgeInput> = {}): BadgeInput {
  return {
    stats: { ...EMPTY_STATS },
    streak: { ...EMPTY_STREAK },
    benchmarkCount: 0,
    hasProfile: false,
    ...overrides,
  }
}

const withStats = (patch: Partial<BadgeInput['stats']>, rest: Partial<BadgeInput> = {}) =>
  input({ stats: { ...EMPTY_STATS, ...patch }, ...rest })

describe('evaluateBadges', () => {
  it('awards nothing to a brand-new user', () => {
    expect(evaluateBadges(input())).toEqual([])
  })

  it('awards the day-one badge once onboarding is done', () => {
    expect(evaluateBadges(input({ hasProfile: true }))).toContain('getting-started')
  })

  it('awards the first session', () => {
    expect(evaluateBadges(withStats({ sessionCount: 1 }))).toContain('first-session')
  })

  it('needs two sessions in one week, not two sessions total', () => {
    expect(evaluateBadges(withStats({ sessionCount: 2, bestWeeklySessions: 1 }))).not.toContain(
      'week-one',
    )
    expect(evaluateBadges(withStats({ sessionCount: 2, bestWeeklySessions: 2 }))).toContain(
      'week-one',
    )
  })

  it('awards the benchmark badge on the first attempt', () => {
    expect(evaluateBadges(input({ benchmarkCount: 1 }))).toContain('benchmarked')
  })

  it('uses the longest streak, so a broken run still counts', () => {
    const broken = input({ streak: { ...EMPTY_STREAK, currentStreak: 0, longestStreak: 5 } })
    expect(evaluateBadges(broken)).toContain('streak-4')
  })

  it('holds the twelve-week badge until twelve weeks', () => {
    const eleven = input({ streak: { ...EMPTY_STREAK, longestStreak: 11 } })
    expect(evaluateBadges(eleven)).not.toContain('streak-12')
    const twelve = input({ streak: { ...EMPTY_STREAK, longestStreak: 12 } })
    expect(evaluateBadges(twelve)).toContain('streak-12')
  })

  it('awards the thousand-call badge exactly at a thousand', () => {
    expect(evaluateBadges(withStats({ totalCalls: 999 }))).not.toContain('thousand-calls')
    expect(evaluateBadges(withStats({ totalCalls: 1000 }))).toContain('thousand-calls')
  })

  it('awards ten hours at ten hours', () => {
    expect(evaluateBadges(withStats({ totalTrainingSec: 35_999 }))).not.toContain('ten-hours')
    expect(evaluateBadges(withStats({ totalTrainingSec: 36_000 }))).toContain('ten-hours')
  })

  it('awards the deception badge after ten such sessions', () => {
    expect(evaluateBadges(withStats({ deceptionSessions: 9 }))).not.toContain('deception-pro')
    expect(evaluateBadges(withStats({ deceptionSessions: 10 }))).toContain('deception-pro')
  })

  it('returns slugs in catalogue order', () => {
    const everything = withStats(
      {
        sessionCount: 40,
        bestWeeklySessions: 5,
        totalCalls: 5000,
        totalTrainingSec: 100_000,
        deceptionSessions: 20,
      },
      {
        hasProfile: true,
        benchmarkCount: 3,
        streak: { ...EMPTY_STREAK, currentStreak: 20, longestStreak: 20 },
      },
    )
    expect(evaluateBadges(everything)).toEqual(BADGES.map((badge) => badge.slug))
  })

  it('offers something in reach at every tier', () => {
    const tiers = new Set(BADGES.map((badge) => badge.tier))
    expect(tiers).toEqual(new Set(['bronze', 'silver', 'gold']))
  })
})

describe('badgeStates', () => {
  it('reports progress towards an unearned badge', () => {
    const states = badgeStates(withStats({ totalCalls: 250 }))
    const calls = states.find((state) => state.slug === 'thousand-calls')
    expect(calls?.earned).toBe(false)
    expect(calls?.progressRatio).toBeCloseTo(0.25)
    expect(calls?.progressLabel).toBe('250 / 1000')
  })

  it('drops the progress label once the badge is earned', () => {
    const states = badgeStates(withStats({ totalCalls: 1200 }))
    const calls = states.find((state) => state.slug === 'thousand-calls')
    expect(calls?.earned).toBe(true)
    expect(calls?.progressLabel).toBeNull()
  })

  it('shows training time in hours rather than raw seconds', () => {
    const states = badgeStates(withStats({ totalTrainingSec: 9000 }))
    expect(states.find((state) => state.slug === 'ten-hours')?.progressLabel).toBe('2.5 / 10 hours')
  })

  it('never reports progress above 1', () => {
    const states = badgeStates(withStats({ totalCalls: 99_999, totalTrainingSec: 999_999 }))
    for (const state of states) expect(state.progressRatio).toBeLessThanOrEqual(1)
  })

  it('covers the whole catalogue', () => {
    expect(badgeStates(input())).toHaveLength(BADGES.length)
  })
})
