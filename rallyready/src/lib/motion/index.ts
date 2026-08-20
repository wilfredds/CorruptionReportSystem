import { useMemo } from 'react'
import type { Transition, Variants } from 'framer-motion'

import { useReducedMotion } from '@/hooks/useReducedMotion'

import { motionSafe, transitionSafe } from './safe'

export * from './tokens'
export * from './variants'
export * from './safe'

/**
 * Variants that already respect the OS reduced-motion setting.
 *
 * The point of this hook is that no component writes the ternary again. Pass
 * a module-level constant from `variants.ts` — not an object literal, or the
 * memo defeats itself and the variants change identity on every render.
 */
export function useMotionSafe(variants: Variants): Variants {
  const reduced = useReducedMotion()
  return useMemo(() => motionSafe(variants, reduced), [variants, reduced])
}

/** The same, for a one-off transition rather than a set of variants. */
export function useTransitionSafe(transition: Transition): Transition {
  const reduced = useReducedMotion()
  return useMemo(() => transitionSafe(transition, reduced), [transition, reduced])
}

/**
 * `false` when motion is reduced, so `initial={useInitialSafe('hidden')}` skips
 * the entrance entirely rather than flashing an opacity ramp on first paint.
 */
export function useInitialSafe<T extends string>(initial: T): T | false {
  return useReducedMotion() ? false : initial
}
