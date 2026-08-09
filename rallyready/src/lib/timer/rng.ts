/**
 * Seedable RNG. Every drill timeline is generated from a seed, which makes the
 * whole engine deterministic and therefore unit-testable — and lets a session
 * be replayed exactly if we ever want a "repeat that drill" feature.
 */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number
  /** Picks an element; throws on an empty list so bugs surface loudly. */
  pick<T>(items: readonly T[]): T
}

/** mulberry32 — small, fast, and good enough for drill randomisation. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (maxExclusive) => Math.floor(next() * maxExclusive),
    pick: (items) => {
      if (items.length === 0) throw new Error('Rng.pick called with an empty list')
      return items[Math.floor(next() * items.length)] as (typeof items)[number]
    },
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}
