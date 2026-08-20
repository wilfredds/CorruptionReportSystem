import { describe, expect, it } from 'vitest'
import type { Variants } from 'framer-motion'

import { motionSafe, stillTransition, stillVariants, transitionSafe } from './safe'
import { DURATION, REDUCED_DURATION, staggerDelay, STAGGER_MAX, STAGGER_STEP } from './tokens'
import {
  dialogVariants,
  directionalPageVariants,
  listItemVariants,
  pageVariants,
  pressVariants,
  rewardVariants,
  valuePopVariants,
} from './variants'

/** Every variant the app ships, so none of them can drift out of coverage. */
const ALL: [string, Variants][] = [
  ['page', pageVariants],
  ['directionalPage', directionalPageVariants],
  ['listItem', listItemVariants],
  ['press', pressVariants],
  ['dialog', dialogVariants],
  ['valuePop', valuePopVariants],
  ['reward', rewardVariants],
]

const MOVEMENT_KEYS = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate', 'skewX']

/** Resolves a variant, calling it if it is a function of `custom`. */
function resolve(variant: unknown, custom = 3): Record<string, unknown> {
  const value =
    typeof variant === 'function' ? (variant as (c: number) => unknown)(custom) : variant
  return (value ?? {}) as Record<string, unknown>
}

describe('stillVariants', () => {
  it('strips every transform from every variant the app ships', () => {
    for (const [name, variants] of ALL) {
      const still = stillVariants(variants)
      for (const [state, variant] of Object.entries(still)) {
        const resolved = resolve(variant)
        for (const key of MOVEMENT_KEYS) {
          expect(resolved[key], `${name}.${state}.${key}`).toBeUndefined()
        }
      }
    }
  })

  it('keeps opacity, so a state change is still visible', () => {
    const still = stillVariants(pageVariants)
    expect(resolve(still.hidden).opacity).toBe(0)
    expect(resolve(still.visible).opacity).toBe(1)
  })

  it('never produces a zero-length transition', () => {
    // Zero makes framer-motion skip its animation loop, and AnimatePresence
    // then never fires the exit callback — a closed dialog stays in the tree.
    for (const [name, variants] of ALL) {
      for (const [state, variant] of Object.entries(stillVariants(variants))) {
        const { transition } = resolve(variant) as { transition?: { duration?: number } }
        expect(transition, `${name}.${state}`).toBeDefined()
        expect(transition?.duration, `${name}.${state}`).toBeGreaterThan(0)
      }
    }
  })

  it('drops the per-index delay a staggered list would otherwise keep', () => {
    const still = stillVariants(listItemVariants)
    const { transition } = resolve(still.visible, 9) as {
      transition?: { delay?: number; duration?: number }
    }
    expect(transition?.delay).toBeUndefined()
    expect(transition?.duration).toBe(REDUCED_DURATION)
  })

  it('replaces a spring with a plain duration', () => {
    // A spring has no duration of its own; left in place it would still move.
    const { transition } = resolve(stillVariants(valuePopVariants).visible) as {
      transition?: { type?: string; duration?: number }
    }
    expect(transition?.type).toBeUndefined()
    expect(transition?.duration).toBe(REDUCED_DURATION)
  })

  it('leaves the original variants untouched', () => {
    stillVariants(pageVariants)
    expect(resolve(pageVariants.hidden).y).toBe(8)
  })
})

describe('motionSafe', () => {
  it('hands back the real variants when motion is allowed', () => {
    expect(motionSafe(pageVariants, false)).toBe(pageVariants)
  })

  it('hands back still ones when it is not', () => {
    const still = motionSafe(pageVariants, true)
    expect(still).not.toBe(pageVariants)
    expect(resolve(still.hidden).y).toBeUndefined()
  })
})

describe('transitionSafe', () => {
  it('passes a transition through untouched when motion is allowed', () => {
    const real = { duration: DURATION.base }
    expect(transitionSafe(real, false)).toBe(real)
  })

  it('flattens it to something instant but non-zero when it is not', () => {
    expect(transitionSafe({ duration: 10 }, true)).toEqual(stillTransition())
    expect(stillTransition().duration).toBeGreaterThan(0)
  })
})

describe('staggerDelay', () => {
  it('steps up with the index', () => {
    expect(staggerDelay(0)).toBe(0)
    expect(staggerDelay(1)).toBeCloseTo(STAGGER_STEP)
    expect(staggerDelay(2)).toBeCloseTo(STAGGER_STEP * 2)
  })

  it('caps, so a long list does not take a second to arrive', () => {
    expect(staggerDelay(12)).toBe(STAGGER_MAX)
    expect(staggerDelay(200)).toBe(STAGGER_MAX)
  })

  it('survives nonsense', () => {
    expect(staggerDelay(-4)).toBe(0)
    expect(staggerDelay(Number.NaN)).toBe(0)
  })
})

describe('the tokens themselves', () => {
  it('run shortest to longest', () => {
    expect(DURATION.instant).toBeLessThan(DURATION.quick)
    expect(DURATION.quick).toBeLessThan(DURATION.base)
    expect(DURATION.base).toBeLessThan(DURATION.slow)
  })

  it('keeps everything under half a second — this app is opened to be used', () => {
    for (const value of Object.values(DURATION)) expect(value).toBeLessThanOrEqual(0.45)
  })
})
