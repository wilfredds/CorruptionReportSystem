import { useEffect, useState } from 'react'

import { badgesToRecord, newlyEarnedBadges, streakExtended, streakToRecord } from '@/lib/rewards'
import { useUiStore } from '@/store/uiStore'

/**
 * What to celebrate on this visit, and only on this visit.
 *
 * Two things here are easy to get wrong. The first is that a reward must fire
 * once, not on every mount — so the comparison is against a persisted record,
 * not against "did this component just render". The second is subtler: the
 * record has to be *written* immediately, and the celebration has to keep
 * playing after it is. If the two were read from the same live value, writing
 * "you have seen this" would delete the thing you were being shown.
 *
 * So the record is snapshotted when the screen opens and the celebration is
 * derived from that snapshot, while the effect below writes the real record
 * straight away. Close the app mid-confetti and the badge is still earned and
 * the moment is still spent, which is the correct trade: a reward that can be
 * farmed by reloading is not a reward.
 */

export interface Rewards {
  /** Slugs earned since the last time anything looked. */
  newBadges: string[]
  /** The streak length worth celebrating, or null. */
  streakWeeks: number | null
}

export function useRewards(
  earned: string[] | undefined,
  currentStreakWeeks: number | undefined,
  /** Held off until the data behind it has actually loaded. */
  ready: boolean,
): Rewards {
  const recordSeenBadges = useUiStore((state) => state.recordSeenBadges)
  const recordCelebratedStreak = useUiStore((state) => state.recordCelebratedStreak)

  // The record as it stood when this screen opened. A lazy initialiser is the
  // one place a render may read a store directly, and it runs exactly once.
  const [baseline] = useState(() => ({
    badges: useUiStore.getState().seenBadges,
    streak: useUiStore.getState().celebratedStreak,
  }))

  useEffect(() => {
    if (!ready || !earned) return
    const seen = useUiStore.getState().seenBadges
    const next = badgesToRecord(earned, seen)
    // The list only ever grows, so a length change is enough to detect a write.
    if (seen === null || next.length !== seen.length) recordSeenBadges(next)
  }, [ready, earned, recordSeenBadges])

  useEffect(() => {
    if (!ready || currentStreakWeeks === undefined) return
    const celebrated = useUiStore.getState().celebratedStreak
    const next = streakToRecord(currentStreakWeeks, celebrated)
    if (next !== celebrated) recordCelebratedStreak(next)
  }, [ready, currentStreakWeeks, recordCelebratedStreak])

  if (!ready) return { newBadges: [], streakWeeks: null }

  return {
    newBadges: earned ? newlyEarnedBadges(earned, baseline.badges) : [],
    streakWeeks:
      currentStreakWeeks !== undefined && streakExtended(currentStreakWeeks, baseline.streak)
        ? currentStreakWeeks
        : null,
  }
}
