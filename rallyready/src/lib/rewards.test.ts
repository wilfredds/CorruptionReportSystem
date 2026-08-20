import { describe, expect, it } from 'vitest'

import { badgesToRecord, newlyEarnedBadges, streakExtended, streakToRecord } from './rewards'

describe('newlyEarnedBadges', () => {
  it('finds what has not been shown', () => {
    expect(newlyEarnedBadges(['a', 'b', 'c'], ['a'])).toEqual(['b', 'c'])
  })

  it('celebrates nothing on a repeat visit', () => {
    // The bug this exists to prevent: a summary screen that fires the same
    // unlock every time it mounts.
    expect(newlyEarnedBadges(['a', 'b'], ['a', 'b'])).toEqual([])
  })

  it('stays quiet the very first time it looks', () => {
    // An install that predates the record. Nine badges earned long ago must
    // not turn into nine unlock animations after an update.
    expect(newlyEarnedBadges(['a', 'b', 'c'], null)).toEqual([])
  })

  it('keeps catalogue order', () => {
    expect(newlyEarnedBadges(['bronze', 'silver', 'gold'], [])).toEqual([
      'bronze',
      'silver',
      'gold',
    ])
  })

  it('handles an empty history', () => {
    expect(newlyEarnedBadges([], [])).toEqual([])
    expect(newlyEarnedBadges([], null)).toEqual([])
  })
})

describe('badgesToRecord', () => {
  it('snapshots everything on the first look', () => {
    expect(badgesToRecord(['a', 'b'], null)).toEqual(['a', 'b'])
  })

  it('adds without duplicating', () => {
    expect(badgesToRecord(['a', 'b'], ['a'])).toEqual(['a', 'b'])
  })

  it('never un-sees a badge the earned list has stopped reporting', () => {
    expect(badgesToRecord(['a'], ['a', 'b'])).toEqual(['a', 'b'])
  })
})

describe('streakExtended', () => {
  it('fires when the streak grows', () => {
    expect(streakExtended(3, 2)).toBe(true)
  })

  it('does not fire twice for the same week', () => {
    expect(streakExtended(3, 3)).toBe(false)
  })

  it('does not mark a streak that broke', () => {
    // Six weeks down to one is not a moment anybody wants a fanfare for.
    expect(streakExtended(1, 6)).toBe(false)
  })

  it('stays quiet on the first look', () => {
    expect(streakExtended(5, null)).toBe(false)
  })

  it('needs an actual streak', () => {
    expect(streakExtended(0, 0)).toBe(false)
  })
})

describe('streakToRecord', () => {
  it('snapshots on the first look', () => {
    expect(streakToRecord(4, null)).toBe(4)
  })

  it('raises on a longer streak', () => {
    expect(streakToRecord(5, 4)).toBe(5)
  })

  it('never lowers, so a broken streak does not re-arm the old weeks', () => {
    // Dropping to 1 and climbing back to 6 should not fire five more times.
    expect(streakToRecord(1, 6)).toBe(6)
  })
})
