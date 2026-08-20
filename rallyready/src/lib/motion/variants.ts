import type { Transition, Variants } from 'framer-motion'

import { DURATION, EASE, SPRING, staggerDelay } from './tokens'

/**
 * The shared variants. Every animated surface in the app draws from this list
 * rather than inventing its own numbers.
 *
 * All of them animate `transform` and `opacity` only. Anything else — width,
 * height, top, box-shadow, filter — forces layout or paint on the compositor's
 * critical path, and the one screen where that is unacceptable is the drill
 * runner, where a dropped frame lands while somebody is moving to a corner.
 */

export const transition = (
  duration: number = DURATION.base,
  ease: readonly number[] = EASE.out,
): Transition => ({ duration, ease: [...ease] as [number, number, number, number] })

/** A whole screen arriving. Small rise, no scale — pages do not zoom. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transition(DURATION.base) },
  exit: { opacity: 0, y: -6, transition: transition(DURATION.quick) },
}

/**
 * Navigation with a sense of direction: forward slides in from the right,
 * backward from the left. `custom` carries the direction (1 or -1).
 */
export const directionalPageVariants: Variants = {
  hidden: (direction: number) => ({ opacity: 0, x: 14 * (direction || 1) }),
  visible: { opacity: 1, x: 0, transition: transition(DURATION.base) },
  exit: (direction: number) => ({
    opacity: 0,
    x: -10 * (direction || 1),
    transition: transition(DURATION.quick),
  }),
}

/** Container for a staggered list. Children read their index from `custom`. */
export const listVariants: Variants = {
  hidden: {},
  visible: {},
}

/**
 * One item in a staggered list. Pass the index as `custom` — the delay is
 * capped by `staggerDelay`, so a long catalogue does not take a second to
 * finish arriving.
 */
export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...transition(DURATION.base), delay: staggerDelay(index) },
  }),
}

/** A card being pressed. Depth without a shadow — scale reads as material. */
export const pressVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.01, transition: transition(DURATION.quick) },
  tap: { scale: 0.975, transition: transition(DURATION.instant) },
}

/** Dialogs and sheets: a touch of scale so they feel like they arrive. */
export const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: SPRING.soft },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: transition(DURATION.quick) },
}

/**
 * A number or badge that just changed. Used with a `key` on the changing value
 * so React remounts it and the pop actually plays.
 */
export const valuePopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: { opacity: 1, scale: 1, transition: SPRING.pop },
  exit: { opacity: 0, scale: 1.05, transition: transition(DURATION.instant) },
}

/** A reward arriving — the trophy, an unlocked badge. Slower on purpose. */
export const rewardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { ...SPRING.pop, delay: 0.06 },
  },
}

/**
 * One step of a multi-step flow — onboarding's four questions, the welcome
 * screens. Sideways rather than up, so it reads as progress through a sequence
 * rather than four unrelated screens arriving.
 */
export const stepVariants: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: transition(DURATION.base) },
  exit: { opacity: 0, x: -16, transition: transition(DURATION.quick) },
}

/**
 * Content swapping inside an `AnimatePresence` — the runner's idle/running
 * footer, the game's ready/result panels. Same rise as a page, but it exits
 * downward because the thing replacing it is arriving from the same place.
 */
export const swapVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transition(DURATION.quick) },
  exit: { opacity: 0, y: -8, transition: transition(DURATION.instant) },
}
