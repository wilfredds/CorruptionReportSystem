import type { Transition, Variant, Variants } from 'framer-motion'

import { REDUCED_DURATION } from './tokens'

/**
 * Turning any variant into one that respects `prefers-reduced-motion`.
 *
 * The CSS override in `index.css` already flattens declarative transitions, but
 * it cannot touch anything framer-motion drives in JavaScript — that has to be
 * handled here. The rule is not "do nothing": under reduced motion every state
 * change must still be *visible*, it just must not move. So opacity survives
 * and every transform is dropped.
 *
 * Pure, so the behaviour is unit-tested rather than trusted.
 */

/** Properties that move something. All of them go under reduced motion. */
const MOVEMENT = [
  'x',
  'y',
  'z',
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'skew',
  'skewX',
  'skewY',
] as const

/**
 * A transition that finishes immediately but is not zero-length.
 *
 * Zero makes framer-motion skip its animation loop, and `AnimatePresence` then
 * never fires the exit callback that unmounts the element — a closed dialog
 * would stay in the tree. See `REDUCED_DURATION`.
 */
export function stillTransition(): Transition {
  return { duration: REDUCED_DURATION }
}

function stillVariant(variant: Variant): Variant {
  // A variant can be a function of `custom`; wrap it so the result is stripped
  // too, otherwise a list item's per-index delay survives reduced motion.
  if (typeof variant === 'function') {
    return (...args: Parameters<typeof variant>) => {
      const resolved = variant(...args)
      // A resolver is allowed to return the *name* of another variant, which
      // has nothing to strip.
      return typeof resolved === 'string' ? resolved : (stillVariant(resolved) as never)
    }
  }
  if (typeof variant !== 'object' || variant === null) return variant

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(variant)) {
    if ((MOVEMENT as readonly string[]).includes(key)) continue
    if (key === 'transition') continue
    out[key] = value
  }
  out.transition = stillTransition()
  return out as Variant
}

/** The same variants with every transform removed and timing made instant. */
export function stillVariants(variants: Variants): Variants {
  const out: Variants = {}
  for (const [name, variant] of Object.entries(variants)) {
    out[name] = stillVariant(variant)
  }
  return out
}

/**
 * Picks between the real variants and the still ones.
 *
 * Split out from the hook so it can be tested without React, and so a component
 * that already knows the reduced-motion state does not have to call the hook a
 * second time.
 */
export function motionSafe(variants: Variants, reduced: boolean): Variants {
  return reduced ? stillVariants(variants) : variants
}

/** The same, for a bare transition rather than a set of variants. */
export function transitionSafe(transition: Transition, reduced: boolean): Transition {
  return reduced ? stillTransition() : transition
}
