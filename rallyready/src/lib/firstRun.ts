/**
 * Who gets shown the welcome, and — more importantly — who does not.
 *
 * A first-run screen that reappears is far worse than none at all, and one that
 * hijacks a deep link is worse still: somebody opening a challenge someone sent
 * them should land on the challenge, not on an introduction to an app they may
 * already use. So the redirect is deliberately narrow, and every reason to
 * suppress it is listed here rather than scattered through components.
 *
 * Pure, because "does this person see the welcome" is the kind of decision that
 * is embarrassing to get wrong and trivial to test.
 */

export interface FirstRunInput {
  /** True while profile or history is still being read. */
  loading: boolean
  hasProfile: boolean
  hasSessions: boolean
  /** The persisted "they have seen it" flag. */
  seenWelcome: boolean
  /** Current route. The redirect only ever fires from the home screen. */
  path: string
  /**
   * Whether a redirect has already fired in this page load. Local storage can
   * be unavailable — private mode, a locked-down browser — in which case the
   * persisted flag never sticks. Without this, skipping would bounce straight
   * back to the welcome and trap the player in a loop.
   */
  redirectedThisLoad?: boolean
}

/** The only route a first-run redirect may fire from. */
export const FIRST_RUN_FROM = '/'
export const WELCOME_PATH = '/welcome'

export function shouldSeeWelcome(input: FirstRunInput): boolean {
  // Redirecting mid-load would flash the catalogue, bounce to the welcome, and
  // bounce back again the moment the profile arrives.
  if (input.loading) return false
  if (input.seenWelcome) return false
  if (input.redirectedThisLoad) return false

  // Either of these means a returning player, whatever the flag says — a
  // cleared browser must not re-introduce the app to somebody who has trained.
  if (input.hasProfile) return false
  if (input.hasSessions) return false

  return input.path === FIRST_RUN_FROM
}

/**
 * The in-memory half of the "seen it" flag.
 *
 * The persisted flag is the real one, but it can silently fail to stick, and
 * the failure mode is the worst one available: press Skip, land on `/`, get
 * sent straight back. This is set when the welcome mounts, so within a single
 * page load the redirect can only ever fire once regardless of storage.
 */
let shownThisLoad = false

export function markWelcomeShownThisLoad(): void {
  shownThisLoad = true
}

export function wasWelcomeShownThisLoad(): boolean {
  return shownThisLoad
}

/** Tests only — module state does not reset itself between cases. */
export function resetWelcomeLoadState(): void {
  shownThisLoad = false
}
