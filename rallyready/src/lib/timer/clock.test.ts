import { beforeEach, describe, expect, it } from 'vitest'

import { DrillClock } from './clock'

describe('DrillClock', () => {
  let clock: DrillClock

  beforeEach(() => {
    clock = new DrillClock()
  })

  it('reads zero before it is started', () => {
    expect(clock.elapsed(9_999)).toBe(0)
    expect(clock.isStarted).toBe(false)
  })

  it('tracks elapsed time from the moment it starts', () => {
    clock.start(1_000)
    expect(clock.elapsed(1_000)).toBe(0)
    expect(clock.elapsed(3_500)).toBe(2_500)
  })

  it('freezes while paused', () => {
    clock.start(0)
    clock.pause(4_000)
    expect(clock.elapsed(4_000)).toBe(4_000)
    expect(clock.elapsed(30_000)).toBe(4_000)
    expect(clock.isPaused).toBe(true)
  })

  it('carries on from where it paused', () => {
    clock.start(0)
    clock.pause(4_000)
    clock.resume(10_000) // sat paused for six seconds
    expect(clock.elapsed(10_000)).toBe(4_000)
    expect(clock.elapsed(12_500)).toBe(6_500)
    expect(clock.isPaused).toBe(false)
  })

  it('survives repeated pauses', () => {
    clock.start(0)
    clock.pause(1_000)
    clock.resume(2_000)
    clock.pause(3_000) // elapsed 2000
    clock.resume(9_000)
    expect(clock.elapsed(9_000)).toBe(2_000)
    expect(clock.elapsed(10_000)).toBe(3_000)
  })

  it('ignores a redundant pause or resume', () => {
    clock.start(0)
    clock.pause(1_000)
    clock.pause(5_000)
    expect(clock.elapsed(5_000)).toBe(1_000)
    clock.resume(6_000)
    clock.resume(7_000)
    expect(clock.elapsed(7_000)).toBe(2_000)
  })

  it('seeks to an absolute position', () => {
    clock.start(0)
    clock.seek(30_000, 5_000)
    expect(clock.elapsed(5_000)).toBe(30_000)
    expect(clock.elapsed(6_000)).toBe(31_000)
  })

  it('stays paused across a seek', () => {
    clock.start(0)
    clock.pause(2_000)
    clock.seek(30_000, 2_000)
    expect(clock.elapsed(2_000)).toBe(30_000)
    expect(clock.elapsed(99_000)).toBe(30_000)
    clock.resume(99_000)
    expect(clock.elapsed(100_000)).toBe(31_000)
  })

  it('never reports a negative elapsed time', () => {
    clock.start(5_000)
    expect(clock.elapsed(0)).toBe(0)
    clock.seek(-1_000, 5_000)
    expect(clock.elapsed(5_000)).toBe(0)
  })

  it('resets on stop', () => {
    clock.start(0)
    clock.pause(1_000)
    clock.stop()
    expect(clock.isStarted).toBe(false)
    expect(clock.isPaused).toBe(false)
    expect(clock.elapsed(50_000)).toBe(0)
  })
})
