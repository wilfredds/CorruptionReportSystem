import { describe, expect, it } from 'vitest'

import { cornerIdsForLayout } from '@/lib/timer/corners'

import {
  gradeReaction,
  isPersonalBest,
  nextTarget,
  scoreForHit,
  summarise,
  ELITE_MS,
  SLOW_MS,
  WRONG_PENALTY,
  type ReflexEvent,
} from './reflex'

describe('scoreForHit', () => {
  it('pays much more for a fast read than a slow one', () => {
    expect(scoreForHit(300)).toBeGreaterThan(scoreForHit(600))
    expect(scoreForHit(600)).toBeGreaterThan(scoreForHit(1100))
  })

  it('caps at both ends rather than running away', () => {
    expect(scoreForHit(0)).toBe(scoreForHit(ELITE_MS))
    expect(scoreForHit(99_999)).toBe(scoreForHit(SLOW_MS))
    expect(scoreForHit(ELITE_MS)).toBe(100)
    expect(scoreForHit(SLOW_MS)).toBe(10)
  })

  it('is never negative, and never NaN', () => {
    expect(scoreForHit(Number.NaN)).toBe(0)
    for (const ms of [-500, 0, 250, 1000, 5000]) {
      expect(scoreForHit(ms)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('summarise', () => {
  const hit = (reactionMs: number): ReflexEvent => ({ kind: 'hit', corner: 'net-left', reactionMs })

  it('is all zeroes for a run with nothing in it', () => {
    const summary = summarise([])
    expect(summary.score).toBe(0)
    expect(summary.accuracy).toBe(0)
    expect(summary.averageMs).toBeNull()
    expect(summary.bestMs).toBeNull()
  })

  it('adds up hits and averages the reads', () => {
    const summary = summarise([hit(400), hit(600)])
    expect(summary.hits).toBe(2)
    expect(summary.averageMs).toBe(500)
    expect(summary.bestMs).toBe(400)
    expect(summary.score).toBe(scoreForHit(400) + scoreForHit(600))
  })

  it('charges for hitting the wrong corner', () => {
    const clean = summarise([hit(400), hit(400)])
    const sloppy = summarise([hit(400), { kind: 'wrong', corner: 'net-right' }, hit(400)])
    expect(clean.score - sloppy.score).toBe(WRONG_PENALTY)
    expect(sloppy.wrong).toBe(1)
  })

  it('never reports a negative score', () => {
    const summary = summarise(
      Array.from({ length: 10 }, () => ({ kind: 'wrong', corner: 'net-left' }) as ReflexEvent),
    )
    expect(summary.score).toBe(0)
  })

  it('counts a timeout against accuracy but does not charge for it', () => {
    const timedOut = summarise([hit(400), { kind: 'timeout', corner: 'rear-left' }])
    expect(timedOut.timeouts).toBe(1)
    expect(timedOut.score).toBe(scoreForHit(400))
    expect(timedOut.accuracy).toBe(0.5)
  })

  it('measures accuracy against everything attempted', () => {
    const summary = summarise([
      hit(400),
      hit(400),
      { kind: 'wrong', corner: 'net-right' },
      { kind: 'timeout', corner: 'rear-left' },
    ])
    expect(summary.accuracy).toBe(0.5)
  })
})

describe('nextTarget', () => {
  it('never picks the corner already lit', () => {
    for (const layout of [4, 6, 8] as const) {
      for (const previous of cornerIdsForLayout(layout)) {
        for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
          expect(nextTarget(layout, previous, () => roll)).not.toBe(previous)
        }
      }
    }
  })

  it('only ever returns a corner that exists in the layout', () => {
    for (const layout of [4, 6, 8] as const) {
      const valid = new Set(cornerIdsForLayout(layout))
      for (const roll of [0, 0.33, 0.66, 0.999]) {
        expect(valid.has(nextTarget(layout, null, () => roll))).toBe(true)
      }
    }
  })

  it('stays in range even if the generator returns exactly 1', () => {
    const valid = new Set(cornerIdsForLayout(6))
    expect(valid.has(nextTarget(6, null, () => 1))).toBe(true)
  })

  it('reaches every corner across many rolls', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) seen.add(nextTarget(6, null, () => i / 200))
    expect(seen.size).toBe(6)
  })
})

describe('gradeReaction', () => {
  it('has something to say at every speed, including none', () => {
    for (const ms of [null, 300, 450, 650, 900]) {
      const grade = gradeReaction(ms)
      expect(grade.label.length).toBeGreaterThan(0)
      expect(grade.blurb.length).toBeGreaterThan(10)
    }
  })

  it('grades faster reads better', () => {
    expect(gradeReaction(320).label).toBe('Lightning')
    expect(gradeReaction(900).label).toBe('Warming up')
  })
})

describe('isPersonalBest', () => {
  it('needs a genuine improvement, not a tie', () => {
    expect(isPersonalBest(500, 400)).toBe(true)
    expect(isPersonalBest(400, 400)).toBe(false)
    expect(isPersonalBest(300, 400)).toBe(false)
  })

  it('counts the first run as a best', () => {
    expect(isPersonalBest(1, 0)).toBe(true)
  })
})
