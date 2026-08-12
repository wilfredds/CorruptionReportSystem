import { describe, expect, it } from 'vitest'

import {
  computeLoad,
  loadHeadroom,
  METRIC_RPE,
  RPE_ASSUMED,
  RPE_SCALE,
  clampRpe,
  rpeStep,
  sessionLoad,
  statusFor,
} from './load'
import type { Session, SessionMetric } from './types'

const TODAY = new Date(2026, 7, 9, 12, 0, 0) // Sunday 9 Aug 2026

let counter = 0
function session(overrides: Partial<Session> & { startedAt: string }): Session {
  counter += 1
  return {
    id: `s${counter}`,
    userId: null,
    drillId: 'six-corner-shadow',
    drillName: 'Six-Corner Shadow',
    durationSec: 600,
    roundsCompleted: 6,
    avgShotIntervalMs: 1400,
    notes: null,
    source: 'timer',
    ...overrides,
  }
}

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 10).toISOString()

function rpe(sessionId: string, value: number): SessionMetric {
  return { id: `${sessionId}-rpe`, sessionId, metricKey: METRIC_RPE, metricValue: value }
}

/** N sessions a day apart, ending `endDaysAgo` days before TODAY. */
function run(count: number, endDaysAgo: number, durationSec: number): Session[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(TODAY)
    date.setDate(date.getDate() - endDaysAgo - i)
    return session({ startedAt: date.toISOString(), durationSec })
  })
}

describe('sessionLoad', () => {
  it('multiplies effort by minutes', () => {
    expect(sessionLoad(600, 8)).toBe(80)
    expect(sessionLoad(1500, 3)).toBe(75)
  })

  it('assumes a moderate effort when the session was never rated', () => {
    expect(sessionLoad(600, null)).toBe(10 * RPE_ASSUMED)
  })

  it('never returns a negative load', () => {
    expect(sessionLoad(-600, 8)).toBe(0)
  })
})

describe('clampRpe', () => {
  it('holds the scale to 1-10 and rounds', () => {
    expect(clampRpe(0)).toBe(1)
    expect(clampRpe(11)).toBe(10)
    expect(clampRpe(6.4)).toBe(6)
  })

  it('falls back to moderate for a non-number', () => {
    expect(clampRpe(Number.NaN)).toBe(RPE_ASSUMED)
    expect(clampRpe(Infinity)).toBe(10)
  })

  it('has a descriptor for every step', () => {
    expect(RPE_SCALE).toHaveLength(10)
    for (let value = 1; value <= 10; value++) expect(rpeStep(value).value).toBe(value)
  })
})

describe('computeLoad', () => {
  it('fills the whole window for a user with no sessions', () => {
    const summary = computeLoad([], [], TODAY, 28)
    expect(summary.daily).toHaveLength(28)
    expect(summary.daily.at(-1)?.date).toBe('2026-08-09')
    expect(summary.acute).toBe(0)
    expect(summary.ratio).toBeNull()
    expect(summary.status).toBe('settling')
  })

  it('buckets load onto the day the session started', () => {
    const one = session({ startedAt: at(2026, 8, 7), durationSec: 600 })
    const summary = computeLoad([one], [rpe(one.id, 8)], TODAY, 28)
    const day = summary.daily.find((entry) => entry.date === '2026-08-07')
    expect(day?.load).toBe(80)
    expect(day?.sessions).toBe(1)
    expect(day?.rated).toBe(1)
  })

  it('withholds a ratio until there is a month of history behind it', () => {
    // Three sessions this week and nothing before: the ratio would read 4.0 and
    // scream "spike" at someone on day two of training.
    const summary = computeLoad(run(3, 0, 600), [], TODAY, 28)
    expect(summary.acute).toBeGreaterThan(0)
    expect(summary.ratio).toBeNull()
    expect(summary.status).toBe('settling')
  })

  it('reads a level month as steady', () => {
    const sessions = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(TODAY)
      date.setDate(date.getDate() - i * 3)
      return session({ startedAt: date.toISOString(), durationSec: 600 })
    })
    const summary = computeLoad(sessions, [], TODAY, 28)
    expect(summary.ratio).not.toBeNull()
    expect(summary.status).toBe('steady')
  })

  it('calls out a week far heavier than the month behind it', () => {
    // Four quiet weeks, then a very heavy one.
    const background = Array.from({ length: 4 }, (_, i) => {
      const date = new Date(TODAY)
      date.setDate(date.getDate() - 10 - i * 7)
      return session({ startedAt: date.toISOString(), durationSec: 600 })
    })
    const spike = run(5, 0, 1800)
    const summary = computeLoad([...background, ...spike], [], TODAY, 28)
    expect(summary.ratio).toBeGreaterThan(1.5)
    expect(summary.status).toBe('spiking')
  })

  it('reads a quiet week against a busy month as easing off', () => {
    const busy = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(TODAY)
      date.setDate(date.getDate() - 8 - i * 2)
      return session({ startedAt: date.toISOString(), durationSec: 900 })
    })
    const summary = computeLoad(busy, [], TODAY, 28)
    expect(summary.acute).toBe(0)
    expect(summary.status).toBe('detraining')
  })

  it('counts rated and unrated sessions separately and averages the real ones', () => {
    const a = session({ startedAt: at(2026, 8, 7) })
    const b = session({ startedAt: at(2026, 8, 8) })
    const c = session({ startedAt: at(2026, 8, 9) })
    const summary = computeLoad([a, b, c], [rpe(a.id, 8), rpe(b.id, 6)], TODAY, 28)
    expect(summary.sessions).toBe(3)
    expect(summary.unrated).toBe(1)
    expect(summary.averageRpe).toBe(7)
  })

  it('ignores sessions that fall outside the window when counting', () => {
    const old = session({ startedAt: at(2026, 5, 1) })
    const recent = session({ startedAt: at(2026, 8, 8) })
    const summary = computeLoad([old, recent], [], TODAY, 28)
    expect(summary.sessions).toBe(1)
  })

  it('separates the last seven days from the seven before them', () => {
    // Rolling windows, not calendar weeks: 8 Aug is within seven days of the
    // 9th, 30 Jul is in the window before it.
    const recent = session({ startedAt: at(2026, 8, 8), durationSec: 600 })
    const older = session({ startedAt: at(2026, 7, 30), durationSec: 1200 })
    const summary = computeLoad([recent, older], [rpe(recent.id, 5), rpe(older.id, 5)], TODAY, 28)
    expect(summary.last7).toBe(50)
    expect(summary.previous7).toBe(100)
  })
})

describe('statusFor', () => {
  it('maps the ratio onto the bands', () => {
    expect(statusFor(null)).toBe('settling')
    expect(statusFor(0.5)).toBe('detraining')
    expect(statusFor(1)).toBe('steady')
    expect(statusFor(1.3)).toBe('steady')
    expect(statusFor(1.4)).toBe('building')
    expect(statusFor(2)).toBe('spiking')
  })
})

describe('loadHeadroom', () => {
  it('is null while the ratio is untrustworthy', () => {
    expect(loadHeadroom(computeLoad([], [], TODAY))).toBeNull()
  })

  it('reports what is left before the week counts as a big step up', () => {
    const summary = { ratio: 1, chronic: 100, acute: 60 } as ReturnType<typeof computeLoad>
    expect(loadHeadroom(summary)).toBe(70)
  })

  it('never goes negative once the week is already heavy', () => {
    const summary = { ratio: 2, chronic: 100, acute: 200 } as ReturnType<typeof computeLoad>
    expect(loadHeadroom(summary)).toBe(0)
  })
})
