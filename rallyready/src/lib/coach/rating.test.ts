import { describe, expect, it } from 'vitest'

import { EMPTY_LOAD, type LoadSummary } from '@/lib/data/load'
import { EMPTY_STATS, type TrainingStats } from '@/lib/data/stats'
import { EMPTY_STREAK } from '@/lib/data/streaks'
import type { Benchmark, Streak } from '@/lib/data/types'

import { computeRating, tierFor, EMPTY_RATING, MAX_RATING, TIERS } from './rating'

const stats = (overrides: Partial<TrainingStats> = {}): TrainingStats => ({
  ...EMPTY_STATS,
  ...overrides,
})
const streak = (overrides: Partial<Streak> = {}): Streak => ({ ...EMPTY_STREAK, ...overrides })
const load = (overrides: Partial<LoadSummary> = {}): LoadSummary => ({
  ...EMPTY_LOAD,
  ...overrides,
})

const week = (sessions: number) => ({
  weekIndex: 0,
  weekStart: '2026-08-03',
  label: '3 Aug',
  sessions,
  minutes: 30,
  calls: 100,
  load: 300,
})

const benchmark = (score: number): Benchmark => ({
  id: `b${score}`,
  userId: null,
  testType: 'b_endurance_style',
  takenAt: '2026-08-01T10:00:00.000Z',
  score,
  levelReached: 7,
  raw: {},
})

const drill = (slug: string) => ({
  drillId: slug,
  drillName: slug,
  sessions: 1,
  bestCalls: 100,
  bestIntervalMs: 1400,
  totalSec: 600,
  lastTrainedAt: '2026-08-01T10:00:00.000Z',
})

/** An interval-trend point; only `intervalMs` matters to the rating. */
const point = (index: number, intervalMs: number) => ({
  at: index,
  date: '2026-08-01',
  intervalMs,
})

describe('a brand new player', () => {
  it('starts at zero in the first tier', () => {
    expect(EMPTY_RATING.points).toBe(0)
    expect(EMPTY_RATING.tier.name).toBe('Newcomer')
    expect(EMPTY_RATING.tierProgress).toBe(0)
  })

  it('is told what to work on rather than shown five zeroes', () => {
    expect(EMPTY_RATING.weakest.hint.length).toBeGreaterThan(10)
    expect(EMPTY_RATING.components).toHaveLength(5)
  })
})

describe('computeRating', () => {
  it('never exceeds the maximum, however extreme the inputs', () => {
    const rating = computeRating({
      stats: stats({
        weekly: [week(20), week(20), week(20), week(20)],
        perDrill: Array.from({ length: 40 }, (_, i) => drill(`d${i}`)),
        intervalTrend: [point(1, 3000), point(1, 3000), point(1, 800), point(1, 800)],
      }),
      streak: streak({ currentStreak: 500 }),
      load: load({ chronic: 100_000 }),
      benchmarks: [benchmark(9999)],
    })
    expect(rating.points).toBeLessThanOrEqual(MAX_RATING)
    expect(rating.tier.name).toBe('Machine')
    expect(rating.toNextTier).toBeNull()
    expect(rating.tierProgress).toBe(1)
  })

  it('weights turning up over a single heavy fortnight', () => {
    const patient = computeRating({
      stats: stats({ weekly: [week(3), week(3), week(3), week(3)] }),
      streak: streak({ currentStreak: 12 }),
      load: load({ chronic: 300 }),
      benchmarks: [],
    })
    const binger = computeRating({
      stats: stats({ weekly: [week(0), week(0), week(12), week(12)] }),
      streak: streak({ currentStreak: 2 }),
      load: load({ chronic: 900 }),
      benchmarks: [],
    })
    expect(patient.points).toBeGreaterThan(binger.points)
  })

  it('rewards getting faster relative to where you started', () => {
    const base = {
      streak: streak({ currentStreak: 4 }),
      load: load({ chronic: 400 }),
      benchmarks: [],
    }
    const flat = computeRating({
      ...base,
      stats: stats({
        intervalTrend: [point(1, 1600), point(2, 1600), point(3, 1600), point(4, 1600)],
      }),
    })
    const improving = computeRating({
      ...base,
      stats: stats({
        intervalTrend: [point(1, 1600), point(2, 1500), point(3, 1300), point(4, 1200)],
      }),
    })
    expect(improving.points).toBeGreaterThan(flat.points)
  })

  it('does not punish a beginner for being slow in absolute terms', () => {
    // Both improved by a quarter; both should score the same on sharpness.
    const slow = computeRating({
      stats: stats({
        intervalTrend: [point(1, 2400), point(2, 2400), point(3, 1800), point(4, 1800)],
      }),
      streak: streak(),
      load: load(),
      benchmarks: [],
    })
    const fast = computeRating({
      stats: stats({
        intervalTrend: [point(1, 1200), point(2, 1200), point(3, 900), point(4, 900)],
      }),
      streak: streak(),
      load: load(),
      benchmarks: [],
    })
    expect(slow.points).toBe(fast.points)
  })

  it('scores nothing for sharpness until there is a trend to read', () => {
    const rating = computeRating({
      stats: stats({ intervalTrend: [point(1, 1400)] }),
      streak: streak(),
      load: load(),
      benchmarks: [],
    })
    expect(rating.components.find((c) => c.key === 'sharpness')?.points).toBe(0)
  })

  it('rewards training more than one drill', () => {
    const narrow = computeRating({
      stats: stats({ perDrill: [drill('a')] }),
      streak: streak(),
      load: load(),
      benchmarks: [],
    })
    const broad = computeRating({
      stats: stats({ perDrill: ['a', 'b', 'c', 'd', 'e', 'f'].map(drill) }),
      streak: streak(),
      load: load(),
      benchmarks: [],
    })
    expect(broad.points).toBeGreaterThan(narrow.points)
  })

  it('takes the best benchmark, not the latest', () => {
    const rating = computeRating({
      stats: stats(),
      streak: streak(),
      load: load(),
      benchmarks: [benchmark(60), benchmark(180)],
    })
    expect(rating.components.find((c) => c.key === 'engine')?.points).toBeGreaterThan(
      Math.round(0.5 * 190),
    )
  })

  it('names the component with the most left on the table', () => {
    const rating = computeRating({
      stats: stats({ perDrill: ['a', 'b', 'c', 'd', 'e', 'f'].map(drill) }),
      streak: streak({ currentStreak: 12 }),
      load: load({ chronic: 900 }),
      benchmarks: [],
    })
    // Nothing logged for the benchmark, and it is worth more than sharpness.
    expect(rating.weakest.key).toBe('engine')
  })

  it('survives nonsense without producing NaN', () => {
    const rating = computeRating({
      stats: stats({ intervalTrend: [point(1, 0)] }),
      streak: streak({ currentStreak: Number.NaN }),
      load: load({ chronic: Number.NaN }),
      benchmarks: [benchmark(Number.NaN)],
    })
    expect(Number.isFinite(rating.points)).toBe(true)
    expect(rating.points).toBeGreaterThanOrEqual(0)
  })
})

describe('tiers', () => {
  it('runs in ascending order with no gaps at the bottom', () => {
    expect(TIERS[0]?.from).toBe(0)
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i]!.from).toBeGreaterThan(TIERS[i - 1]!.from)
    }
  })

  it('places a rating in the right band', () => {
    expect(tierFor(0).name).toBe('Newcomer')
    expect(tierFor(119).name).toBe('Newcomer')
    expect(tierFor(120).name).toBe('Trainee')
    expect(tierFor(999).name).toBe('Machine')
  })

  it('reports how far the next tier is', () => {
    const rating = computeRating({
      stats: stats({ weekly: [week(3)] }),
      streak: streak({ currentStreak: 2 }),
      load: load({ chronic: 200 }),
      benchmarks: [],
    })
    if (rating.toNextTier !== null) {
      expect(rating.points + rating.toNextTier).toBe(TIERS[TIERS.indexOf(rating.tier) + 1]?.from)
    }
  })
})
