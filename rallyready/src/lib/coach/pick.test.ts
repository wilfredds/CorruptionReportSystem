import { describe, expect, it } from 'vitest'

import { SEED_DRILLS } from '@/lib/data/seed/drills'
import { EMPTY_STATS, type TrainingStats } from '@/lib/data/stats'
import { EMPTY_STREAK } from '@/lib/data/streaks'
import type { ReadinessAnswers } from '@/lib/data/types'

import { countSessionsToday, needsWarmUp, pickToday, type CoachInput } from './pick'

const TODAY = new Date(2026, 7, 12, 9, 0, 0)

const input = (overrides: Partial<CoachInput> = {}): CoachInput => ({
  drills: SEED_DRILLS,
  stats: EMPTY_STATS,
  streak: EMPTY_STREAK,
  loadStatus: 'steady',
  readiness: null,
  level: 'advanced',
  warm: true,
  programDrillSlug: null,
  programIsRestDay: false,
  sessionsToday: 0,
  lastBenchmarkAt: new Date(2026, 7, 11).toISOString(),
  today: TODAY,
  ...overrides,
})

const answers = (n: number): ReadinessAnswers => ({ sleep: n, soreness: n, energy: n })

const daysAgo = (days: number) => {
  const at = new Date(TODAY)
  at.setDate(at.getDate() - days)
  return at.toISOString()
}

const trained = (drillId: string, daysAgo: number): TrainingStats['perDrill'][number] => {
  const at = new Date(TODAY)
  at.setDate(at.getDate() - daysAgo)
  return {
    drillId,
    drillName: drillId,
    sessions: 1,
    bestCalls: 100,
    bestIntervalMs: 1400,
    totalSec: 600,
    lastTrainedAt: at.toISOString(),
  }
}

describe('pickToday', () => {
  it('always produces a headline and a reason someone could argue with', () => {
    for (const loadStatus of ['settling', 'detraining', 'steady', 'building', 'spiking'] as const) {
      for (const readiness of [null, answers(1), answers(3), answers(5)]) {
        const pick = pickToday(input({ loadStatus, readiness }))
        expect(pick.headline.length, loadStatus).toBeGreaterThan(0)
        expect(pick.reason.length, loadStatus).toBeGreaterThan(20)
      }
    }
  })

  it('stops you after two sessions in a day', () => {
    const pick = pickToday(input({ sessionsToday: 2 }))
    expect(pick.restDay).toBe(true)
    expect(pick.drill).toBeNull()
    expect(pick.code).toBe('rest')
  })

  it('honours a rest day in the plan rather than finding you something', () => {
    const pick = pickToday(input({ programIsRestDay: true, programDrillSlug: null }))
    expect(pick.restDay).toBe(true)
    expect(pick.reason).toMatch(/rest/i)
  })

  it('puts the programme ahead of its own preferences', () => {
    const pick = pickToday(input({ programDrillSlug: 'net-footwork' }))
    expect(pick.drill?.slug).toBe('net-footwork')
    expect(pick.code).toBe('programme')
  })

  it('still does the planned session when you are beaten up, just lighter', () => {
    const pick = pickToday(
      input({ programDrillSlug: 'net-footwork', readiness: answers(1), loadStatus: 'steady' }),
    )
    expect(pick.drill?.slug).toBe('net-footwork')
    expect(pick.adjustment).toBe('lighter')
  })

  it('cuts the session short when the load has spiked and the player feels it', () => {
    const pick = pickToday(input({ loadStatus: 'spiking', readiness: answers(2) }))
    expect(pick.code).toBe('recover')
    expect(pick.adjustment).toBe('lighter')
    expect(pick.restDay).toBe(false)
  })

  it('picks the drill left alone longest', () => {
    const stats: TrainingStats = {
      ...EMPTY_STATS,
      perDrill: SEED_DRILLS.filter((drill) => drill.slug !== 'net-footwork').map((drill) =>
        trained(drill.slug, 1),
      ),
    }
    const pick = pickToday(input({ stats }))
    expect(pick.drill?.slug).toBe('net-footwork')
  })

  it('prefers a drill never trained at all, and says so', () => {
    const stats: TrainingStats = {
      ...EMPTY_STATS,
      perDrill: SEED_DRILLS.filter((drill) => drill.slug !== 'rally-hiit').map((drill) =>
        trained(drill.slug, 60),
      ),
    }
    const pick = pickToday(input({ stats }))
    expect(pick.drill?.slug).toBe('rally-hiit')
    expect(pick.code).toBe('variety')
    expect(pick.reason).toMatch(/not tried/i)
  })

  it('asks for a retest once the benchmark is a month old', () => {
    const pick = pickToday(input({ lastBenchmarkAt: daysAgo(40) }))
    expect(pick.code).toBe('benchmark')
    expect(pick.reason).toContain('40')
  })

  it('does not ask for a retest on a day it has already said to back off', () => {
    const pick = pickToday(input({ lastBenchmarkAt: daysAgo(40), readiness: answers(1) }))
    expect(pick.code).not.toBe('benchmark')
  })

  it('never offers a warm-up as the session', () => {
    for (let sessions = 0; sessions < 2; sessions++) {
      const pick = pickToday(input({ sessionsToday: sessions }))
      expect(pick.drill?.category).not.toBe('warmup')
      expect(pick.drill?.category).not.toBe('cooldown')
    }
  })

  it('never offers a beginner something above their level', () => {
    const pick = pickToday(input({ level: 'beginner' }))
    expect(pick.drill?.level ?? 'beginner').toBe('beginner')
  })

  it('says so plainly when the level filter leaves nothing', () => {
    const pick = pickToday(input({ drills: [], level: 'beginner' }))
    expect(pick.drill).toBeNull()
    expect(pick.restDay).toBe(false)
    expect(pick.headline).toMatch(/nothing at your level/i)
  })
})

describe('needsWarmUp', () => {
  it('pushes a warm-up before a real session when you are cold', () => {
    const pick = pickToday(input())
    expect(needsWarmUp(pick, false)).toBe(true)
    expect(needsWarmUp(pick, true)).toBe(false)
  })

  it('does not push one on a rest day', () => {
    const pick = pickToday(input({ programIsRestDay: true }))
    expect(needsWarmUp(pick, false)).toBe(false)
  })
})

describe('countSessionsToday', () => {
  it('counts only what was started today, in local time', () => {
    const earlier = new Date(2026, 7, 12, 7, 30).toISOString()
    const alsoToday = new Date(2026, 7, 12, 21, 45).toISOString()
    const yesterday = new Date(2026, 7, 11, 23, 30).toISOString()
    expect(countSessionsToday([earlier, alsoToday, yesterday], TODAY)).toBe(2)
  })

  it('is zero for an empty history', () => {
    expect(countSessionsToday([], TODAY)).toBe(0)
  })
})
