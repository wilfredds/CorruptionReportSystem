import type { Streak } from './types'

/**
 * Streaks are counted in weeks, not days (§4 Phase 2): missing a Tuesday
 * should not wipe out two months of consistent training. A week counts if it
 * contains at least one session, and the run stays alive through the current
 * week even before you have trained in it.
 */

const MS_PER_DAY = 86_400_000
/** The Monday on or before the Unix epoch, used as the week-index origin. */
const WEEK_ORIGIN_UTC = Date.UTC(1969, 11, 29)

export const EMPTY_STREAK: Streak = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  weeklySessionsCount: 0,
}

/** `YYYY-MM-DD` in the viewer's own timezone. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Weeks since the origin Monday. Derived from the calendar date rather than
 * the timestamp, so daylight-saving shifts can never move a session a week.
 */
export function weekIndexFromKey(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utc = Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)
  return Math.floor((utc - WEEK_ORIGIN_UTC) / (7 * MS_PER_DAY))
}

export function weekIndex(date: Date): number {
  return weekIndexFromKey(localDateKey(date))
}

/**
 * Recomputes a streak from the full session history. Deriving it rather than
 * incrementing a counter means it can never drift out of sync with reality.
 *
 * @param sessionDateKeys `YYYY-MM-DD` keys, any order, duplicates fine
 * @param today           reference point, injectable for tests
 */
export function computeStreak(sessionDateKeys: string[], today: Date = new Date()): Streak {
  if (sessionDateKeys.length === 0) return EMPTY_STREAK

  const sorted = [...sessionDateKeys].sort()
  const weeks = new Set(sorted.map(weekIndexFromKey))
  const thisWeek = weekIndex(today)

  // The run may end this week or last week; anything older is broken.
  let cursor = weeks.has(thisWeek) ? thisWeek : thisWeek - 1
  let currentStreak = 0
  while (weeks.has(cursor)) {
    currentStreak += 1
    cursor -= 1
  }

  const ordered = [...weeks].sort((a, b) => a - b)
  let longestStreak = 0
  let run = 0
  ordered.forEach((week, index) => {
    run = index > 0 && week === (ordered[index - 1] as number) + 1 ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
  })

  const todayKey = localDateKey(today)
  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastActiveDate: sorted.at(-1) ?? null,
    weeklySessionsCount: sorted.filter(
      (key) => weekIndexFromKey(key) === thisWeek && key <= todayKey,
    ).length,
  }
}
