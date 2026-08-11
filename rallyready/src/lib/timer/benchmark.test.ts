import { describe, expect, it } from 'vitest'

import {
  BENCHMARK_LEVELS,
  BENCHMARK_REST_SEC,
  BENCHMARK_WORK_SECONDS,
  benchmarkDurationSec,
  benchmarkLadder,
  benchmarkMaxScore,
  benchmarkPlan,
  gradeBenchmark,
} from './benchmark'
import { buildTimeline } from './timeline'

describe('the benchmark protocol', () => {
  it('steps work periods from 18s up to 30s', () => {
    expect(BENCHMARK_WORK_SECONDS[0]).toBe(18)
    expect(BENCHMARK_WORK_SECONDS.at(-1)).toBe(30)
    expect(BENCHMARK_WORK_SECONDS).toHaveLength(BENCHMARK_LEVELS)
  })

  it('never steps backwards', () => {
    for (let i = 1; i < BENCHMARK_WORK_SECONDS.length; i++) {
      expect(BENCHMARK_WORK_SECONDS[i]!).toBeGreaterThanOrEqual(BENCHMARK_WORK_SECONDS[i - 1]!)
    }
  })

  it('holds the recovery at ten seconds throughout', () => {
    expect(benchmarkLadder().every((step) => step.restSec === BENCHMARK_REST_SEC)).toBe(true)
  })

  it('holds the shot interval constant, so it measures endurance not reactions', () => {
    const intervals = new Set(benchmarkLadder().map((step) => step.intervalMs))
    expect(intervals.size).toBe(1)
  })

  it('gets progressively harder as the work:rest ratio worsens', () => {
    const ladder = benchmarkLadder()
    const first = ladder[0]!.workSec / ladder[0]!.restSec
    const last = ladder.at(-1)!.workSec / ladder.at(-1)!.restSec
    expect(last).toBeGreaterThan(first)
  })
})

describe('benchmarkPlan', () => {
  const plan = benchmarkPlan(42)

  it('uses the four corners', () => {
    expect(plan.sequencer.layout).toBe(4)
    expect(plan.sequencer.enabled).toHaveLength(4)
  })

  it('adds no warm-up, cool-down, deception or split-step tick', () => {
    expect(plan.warmupSec).toBe(0)
    expect(plan.cooldownSec).toBe(0)
    expect(plan.splitStepLeadMs).toBe(0)
    expect(plan.sequencer.deception.enabled).toBe(false)
  })

  it('builds a timeline with one work block per level', () => {
    const timeline = buildTimeline(plan)
    const work = timeline.blocks.filter((block) => block.phase === 'work')
    expect(work).toHaveLength(BENCHMARK_LEVELS)
    expect(work.map((block) => block.durationMs / 1000)).toEqual(BENCHMARK_WORK_SECONDS)
  })

  it('rests between every level but not after the last', () => {
    const { blocks } = buildTimeline(plan)
    expect(blocks.filter((block) => block.phase === 'rest')).toHaveLength(BENCHMARK_LEVELS - 1)
    expect(blocks.at(-1)?.phase).toBe('work')
  })

  it('runs for a sensible length of time', () => {
    const timeline = buildTimeline(plan)
    const minutes = timeline.totalMs / 60_000
    expect(minutes).toBeGreaterThan(6)
    expect(minutes).toBeLessThan(12)
  })

  it('is reproducible from its seed', () => {
    expect(buildTimeline(benchmarkPlan(7)).events).toEqual(buildTimeline(benchmarkPlan(7)).events)
  })

  it('agrees with the advertised maximum score', () => {
    expect(buildTimeline(plan).totalCalls).toBe(benchmarkMaxScore())
  })

  it('agrees with the advertised duration', () => {
    expect(buildTimeline(plan).totalMs / 1000).toBe(benchmarkDurationSec())
  })
})

describe('gradeBenchmark', () => {
  it('refuses to grade an unfinished test', () => {
    expect(gradeBenchmark(0).label).toBe('Not recorded')
  })

  it('gives a distinct band across the range', () => {
    const labels = [1, 3, 4, 6, 7, 9, 10, 12].map((level) => gradeBenchmark(level).label)
    expect(new Set(labels).size).toBe(4)
    expect(labels[0]).toBe('Building')
    expect(labels.at(-1)).toBe('Competition fit')
  })

  it('never leaves a level ungraded', () => {
    for (let level = 1; level <= BENCHMARK_LEVELS; level++) {
      expect(gradeBenchmark(level).label).not.toBe('Not recorded')
      expect(gradeBenchmark(level).description.length).toBeGreaterThan(10)
    }
  })
})
