/**
 * What is worth celebrating, and — the harder half — what has already been
 * celebrated.
 *
 * A badge unlock that fires every time the summary screen mounts is not a
 * reward, it is a bug with confetti. So the app records what it has already
 * shown you, and everything here is a comparison against that record.
 *
 * The `null` state matters more than it looks. It means "we have never
 * checked", which is what an install that predates this file looks like — and
 * somebody with nine badges already earned must not be handed nine unlock
 * animations the first time they open the app after an update. On `null` the
 * app takes a silent snapshot and celebrates nothing.
 */

/**
 * Badges earned but never shown.
 *
 * Order follows `earned`, which is catalogue order, so the tiers arrive in the
 * order they were designed to be read.
 */
export function newlyEarnedBadges(earned: string[], seen: string[] | null): string[] {
  if (seen === null) return []
  const already = new Set(seen)
  return earned.filter((slug) => !already.has(slug))
}

/** Everything that should be recorded as shown, whether or not it was. */
export function badgesToRecord(earned: string[], seen: string[] | null): string[] {
  if (seen === null) return [...earned]
  const already = new Set(seen)
  // Union, not replacement: a badge cannot be un-earned, but a repository that
  // returns a short list for any reason must not un-see one either.
  return [...seen, ...earned.filter((slug) => !already.has(slug))]
}

/**
 * True when the streak is longer than the last one we made a fuss about.
 *
 * Deliberately not "different": a streak that breaks and drops from six weeks
 * to one is not a moment anybody wants marked, and the next genuine
 * celebration is week seven — which is why the recorded value is only ever
 * raised when it is beaten, never lowered.
 */
export function streakExtended(currentWeeks: number, celebratedWeeks: number | null): boolean {
  if (celebratedWeeks === null) return false
  if (currentWeeks < 1) return false
  return currentWeeks > celebratedWeeks
}

/** The value to store after looking at a streak, celebrated or not. */
export function streakToRecord(currentWeeks: number, celebratedWeeks: number | null): number {
  if (celebratedWeeks === null) return Math.max(0, currentWeeks)
  return Math.max(celebratedWeeks, currentWeeks)
}
