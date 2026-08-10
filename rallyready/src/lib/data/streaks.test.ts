import { describe, expect, it } from 'vitest'

import { computeStreak, EMPTY_STREAK, localDateKey, weekIndexFromKey } from './streaks'

// 2026-08-09 is a Sunday; 2026-08-10 the Monday that starts the next week.
const SUNDAY = new Date(2026, 7, 9, 12, 0, 0)
const MONDAY = new Date(2026, 7, 10, 12, 0, 0)

describe('week bucketing', () => {
  it('treats Monday as the start of a week', () => {
    expect(weekIndexFromKey('2026-08-10')).toBe(weekIndexFromKey('2026-08-16'))
    expect(weekIndexFromKey('2026-08-09')).toBe(weekIndexFromKey('2026-08-10') - 1)
  })

  it('keeps a Sunday-night session in its own week', () => {
    const lateSunday = new Date(2026, 7, 9, 23, 45)
    expect(weekIndexFromKey(localDateKey(lateSunday))).toBe(weekIndexFromKey('2026-08-03'))
  })

  it('spans year boundaries without resetting', () => {
    expect(weekIndexFromKey('2027-01-04') - weekIndexFromKey('2026-12-28')).toBe(1)
  })
})

describe('computeStreak', () => {
  it('reports nothing for a user who has never trained', () => {
    expect(computeStreak([], SUNDAY)).toEqual(EMPTY_STREAK)
  })

  it('counts a single session as a one-week streak', () => {
    const streak = computeStreak(['2026-08-09'], SUNDAY)
    expect(streak.currentStreak).toBe(1)
    expect(streak.longestStreak).toBe(1)
    expect(streak.lastActiveDate).toBe('2026-08-09')
    expect(streak.weeklySessionsCount).toBe(1)
  })

  it('counts consecutive weeks', () => {
    const streak = computeStreak(['2026-07-21', '2026-07-28', '2026-08-04'], SUNDAY)
    expect(streak.currentStreak).toBe(3)
  })

  it('survives a week where you trained several times', () => {
    const streak = computeStreak(['2026-08-04', '2026-08-05', '2026-08-07'], SUNDAY)
    expect(streak.currentStreak).toBe(1)
    expect(streak.weeklySessionsCount).toBe(3)
  })

  it('stays alive into a new week before you have trained in it', () => {
    // Two consecutive weeks, the last session on Sunday night. It is now
    // Monday — a fresh week with no session yet, and the run must survive it.
    const streak = computeStreak(['2026-07-28', '2026-08-09'], MONDAY)
    expect(streak.currentStreak).toBe(2)
    expect(streak.weeklySessionsCount).toBe(0)
  })

  it('breaks once a whole week is skipped', () => {
    // Trained two weeks ago, nothing since — by this Sunday the run is over.
    const streak = computeStreak(['2026-07-20', '2026-07-26'], SUNDAY)
    expect(streak.currentStreak).toBe(0)
    expect(streak.longestStreak).toBe(1)
  })

  it('remembers the longest run even after it breaks', () => {
    const streak = computeStreak(
      ['2026-05-04', '2026-05-11', '2026-05-18', '2026-05-25', '2026-08-09'],
      SUNDAY,
    )
    expect(streak.currentStreak).toBe(1)
    expect(streak.longestStreak).toBe(4)
  })

  it('never reports a longest shorter than the current run', () => {
    const streak = computeStreak(['2026-07-28', '2026-08-04', '2026-08-09'], SUNDAY)
    expect(streak.longestStreak).toBeGreaterThanOrEqual(streak.currentStreak)
  })

  it('is unfazed by duplicates and unsorted input', () => {
    const streak = computeStreak(
      ['2026-08-04', '2026-07-28', '2026-08-04', '2026-07-21'],
      SUNDAY,
    )
    expect(streak.currentStreak).toBe(3)
    expect(streak.lastActiveDate).toBe('2026-08-04')
  })

  it('ignores sessions dated later in the week when counting this week', () => {
    // Reference point is Wednesday; Friday's row must not be counted yet.
    const wednesday = new Date(2026, 7, 5, 12, 0, 0)
    const streak = computeStreak(['2026-08-04', '2026-08-07'], wednesday)
    expect(streak.weeklySessionsCount).toBe(1)
  })
})
