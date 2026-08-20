/**
 * The app's motion vocabulary: four durations, two easings, two springs.
 *
 * Before this, every animated component re-derived the same thing by hand — a
 * `useReducedMotion()` call, a ternary and an inline `{ opacity: 0, y: 8,
 * duration: 0.18 }`. Nine copies, each slightly different, which is precisely
 * why nothing in the app had a rhythm: there was no vocabulary for anything to
 * share.
 *
 * The numbers are mirrored as CSS custom properties in `index.css`, so a
 * Tailwind `transition-*` class and a framer-motion transition agree on timing
 * instead of drifting apart the first time one of them is tweaked.
 *
 * Everything here is deliberately short. This is an app people open to start
 * training, and the slowest thing in it still finishes in under half a second.
 */

/** Seconds, for framer-motion. `index.css` carries the same values in ms. */
export const DURATION = {
  /** A press, a tick — felt rather than seen. */
  instant: 0.09,
  /** Hover, focus, small state flips. */
  quick: 0.16,
  /** The default: entrances, page changes, cards arriving. */
  base: 0.24,
  /** Reserved for reward moments, which are allowed to take their time. */
  slow: 0.42,
} as const

export type DurationToken = keyof typeof DURATION

/**
 * Entrances decelerate; nothing in the app accelerates away from the reader.
 * `out` is a standard ease-out with a long tail — things arrive and settle.
 */
export const EASE = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const

/**
 * Springs for anything that should feel like it has mass: a badge unlocking, a
 * value changing, a target popping in. `pop` is deliberately snappier and is
 * the only one used inside the game.
 */
export const SPRING = {
  soft: { type: 'spring', stiffness: 320, damping: 30, mass: 0.9 },
  pop: { type: 'spring', stiffness: 520, damping: 22, mass: 0.7 },
} as const

/**
 * Under reduced motion transitions are made near-instant rather than zero.
 *
 * A duration of exactly 0 makes framer-motion skip the animation loop
 * altogether, and `AnimatePresence` then never fires the exit callback that
 * removes the element — so a dialog closes and its content stays in the tree.
 * One hundredth of a second is imperceptible and keeps the callbacks running.
 */
export const REDUCED_DURATION = 0.01

/** Per-child delay in a staggered list, and the ceiling it cannot pass. */
export const STAGGER_STEP = 0.045
/**
 * Twelve items at 45ms each would take over half a second to finish arriving,
 * by which time the reader has already started scrolling past them. After this
 * point every remaining child arrives together.
 */
export const STAGGER_MAX = 0.22

export function staggerDelay(index: number): number {
  if (!Number.isFinite(index) || index <= 0) return 0
  return Math.min(index * STAGGER_STEP, STAGGER_MAX)
}
