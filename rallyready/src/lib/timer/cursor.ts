import type { Timeline, TimelineEvent } from './types'

/**
 * Pure playback head over a prebuilt timeline. Knows nothing about wall time —
 * you hand it an elapsed value and it hands back everything that just came due.
 * Keeping this separate from the clock is what makes playback testable without
 * fake timers.
 */
export interface TimelineCursor {
  /** Events with `at <= elapsedMs` that have not been emitted yet. */
  advanceTo(elapsedMs: number): TimelineEvent[]
  /** Moves the head without emitting anything (used by skip / scrub). */
  seekTo(elapsedMs: number): void
  reset(): void
  /** How many events remain unemitted. */
  remaining(): number
}

export function createCursor(timeline: Timeline): TimelineCursor {
  const { events } = timeline
  let index = 0

  const firstIndexAfter = (elapsedMs: number): number => {
    let i = 0
    while (i < events.length && (events[i] as TimelineEvent).at <= elapsedMs) i++
    return i
  }

  return {
    advanceTo(elapsedMs) {
      const due: TimelineEvent[] = []
      while (index < events.length && (events[index] as TimelineEvent).at <= elapsedMs) {
        due.push(events[index] as TimelineEvent)
        index += 1
      }
      return due
    },
    seekTo(elapsedMs) {
      index = firstIndexAfter(elapsedMs)
    },
    reset() {
      index = 0
    },
    remaining() {
      return events.length - index
    },
  }
}
