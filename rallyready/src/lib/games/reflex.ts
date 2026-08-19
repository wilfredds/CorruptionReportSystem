import type { CornerId, CourtLayout } from '@/lib/timer/corners'
import { cornerIdsForLayout } from '@/lib/timer/corners'

/**
 * Reflex Rush — the thirty seconds of the app that exist purely to be fun.
 *
 * Everything else here is training, which is by definition work you have to
 * make yourself do. A game is the part you open because you want to. It earns
 * its place beyond that too: reaction off a visual cue is the one thing a solo
 * player genuinely cannot train against a wall, and it is measurable to the
 * millisecond in a way a shadow drill never is.
 *
 * Pure scoring, so a personal best cannot drift with a UI rewrite and the
 * whole thing is testable without a screen or a clock.
 */

export const GAME_MS = 30_000
/** Miss it for this long and the target moves on without you. */
export const TIMEOUT_MS = 1600
/** Gap between hitting a target and the next appearing. */
export const GAP_MS = 260

/** Anything at or under this is an outstanding human reaction to a visual cue. */
export const ELITE_MS = 320
/** Above this you were not really reacting; you were searching. */
export const SLOW_MS = 1200

export type ReflexEvent =
  | { kind: 'hit'; corner: CornerId; reactionMs: number }
  | { kind: 'wrong'; corner: CornerId }
  | { kind: 'timeout'; corner: CornerId }

/**
 * Points for a single hit. Fast taps are worth a lot more than slow ones — a
 * flat per-hit score would reward mashing whichever corner happened to light up
 * next rather than reacting to it.
 */
export function scoreForHit(reactionMs: number): number {
  if (!Number.isFinite(reactionMs)) return 0
  const clamped = Math.min(SLOW_MS, Math.max(ELITE_MS, reactionMs))
  const range = SLOW_MS - ELITE_MS
  // 100 at elite speed down to 10 at the slow end, never negative.
  return Math.round(10 + ((SLOW_MS - clamped) / range) * 90)
}

/** Cost of hitting the wrong corner. Enough to punish guessing, not to ruin a run. */
export const WRONG_PENALTY = 25

export interface ReflexSummary {
  score: number
  hits: number
  wrong: number
  timeouts: number
  /** Hits as a share of everything attempted, 0..1. */
  accuracy: number
  /** Mean reaction over the hits, or null if there were none. */
  averageMs: number | null
  bestMs: number | null
}

export const EMPTY_SUMMARY: ReflexSummary = {
  score: 0,
  hits: 0,
  wrong: 0,
  timeouts: 0,
  accuracy: 0,
  averageMs: null,
  bestMs: null,
}

export function summarise(events: ReflexEvent[]): ReflexSummary {
  let score = 0
  let hits = 0
  let wrong = 0
  let timeouts = 0
  let total = 0
  let best: number | null = null

  for (const event of events) {
    if (event.kind === 'hit') {
      hits += 1
      score += scoreForHit(event.reactionMs)
      total += event.reactionMs
      best = best === null ? event.reactionMs : Math.min(best, event.reactionMs)
    } else if (event.kind === 'wrong') {
      wrong += 1
      score -= WRONG_PENALTY
    } else {
      timeouts += 1
    }
  }

  const attempts = hits + wrong + timeouts
  return {
    // A negative score reads as broken rather than as bad, and nobody needs to
    // be told their thirty seconds were worth less than nothing.
    score: Math.max(0, score),
    hits,
    wrong,
    timeouts,
    accuracy: attempts === 0 ? 0 : hits / attempts,
    averageMs: hits === 0 ? null : Math.round(total / hits),
    bestMs: best,
  }
}

/**
 * The next corner to light up. Never the same one twice running — a target that
 * stays put tests nothing but whether your finger is already there.
 */
export function nextTarget(
  layout: CourtLayout,
  previous: CornerId | null,
  random: () => number,
): CornerId {
  const options = cornerIdsForLayout(layout).filter((id) => id !== previous)
  const index = Math.min(options.length - 1, Math.floor(random() * options.length))
  return options[index] as CornerId
}

export interface ReflexGrade {
  label: string
  blurb: string
}

/** What an average reaction actually means, in words a player can use. */
export function gradeReaction(averageMs: number | null): ReflexGrade {
  if (averageMs === null) {
    return {
      label: 'No reads',
      blurb: 'Nothing landed. Keep your eyes on the middle of the court.',
    }
  }
  if (averageMs <= 380) {
    return { label: 'Lightning', blurb: 'That is genuinely quick. Very few people read this fast.' }
  }
  if (averageMs <= 500) {
    return { label: 'Sharp', blurb: 'Quick reads. This is the range good club players sit in.' }
  }
  if (averageMs <= 700) {
    return { label: 'Solid', blurb: 'Reliable. Watch the centre rather than hunting the target.' }
  }
  return {
    label: 'Warming up',
    blurb: 'You are searching rather than reacting. Rest your eyes on the middle and let it come.',
  }
}

/** Whether a run beat what came before it, and by how much. */
export function isPersonalBest(score: number, previousBest: number): boolean {
  return score > previousBest
}
