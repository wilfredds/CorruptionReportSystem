import { describe, expect, it } from 'vitest'

import { createRng } from './rng'

describe('createRng', () => {
  it('produces the same stream for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const drawA = Array.from({ length: 32 }, () => a.next())
    const drawB = Array.from({ length: 32 }, () => b.next())
    expect(drawA).toEqual(drawB)
  })

  it('produces different streams for different seeds', () => {
    const a = Array.from({ length: 16 }, createRng(1).next)
    const b = createRng(2)
    expect(a).not.toEqual(Array.from({ length: 16 }, () => b.next()))
  })

  it('stays within [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 5000; i++) {
      const value = rng.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('bounds int() to [0, maxExclusive)', () => {
    const rng = createRng(99)
    for (let i = 0; i < 2000; i++) {
      const value = rng.int(6)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(6)
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('spreads int() across the whole range', () => {
    const rng = createRng(5)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(rng.int(6))
    expect(seen.size).toBe(6)
  })

  it('throws rather than returning undefined when picking from nothing', () => {
    expect(() => createRng(1).pick([])).toThrow(/empty/i)
  })
})
