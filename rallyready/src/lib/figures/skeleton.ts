import type { MobilityPose } from '@/lib/data/seed/exercises'

/**
 * The geometry behind every jointed figure the app draws — warm-up movements,
 * stretches and technique swings alike.
 *
 * Pulled out of the component because every single defect in these figures so
 * far has been found by rendering one and squinting at it: a figure floating
 * above the floor, an arrow attached to the faded far-side limb, a racket
 * swinging off the edge of the canvas, and a "land wide" stance that was
 * actually drawn leaning. Squinting does not scale to fifty poses. As plain
 * functions over numbers, the things that matter — feet on the floor, a wide
 * stance actually being wide — can be asserted instead.
 *
 * ## The sign convention
 *
 * Every angle is degrees away from straight down, and **positive always means
 * away from the body's centreline**, on both sides. The mirroring is done here,
 * so a symmetric pose is written with the same number on the left and the
 * right. Writing `legL: -16, legR: 16` does not produce a wide stance; it
 * produces a figure leaning to one side with its feet together.
 */

export const VIEW_W = 100
export const VIEW_H = 148
export const GROUND = 132

// Derived from the ground rather than guessed, so a straight leg lands exactly
// on the line instead of floating above it.
export const THIGH = 21
export const SHIN = 21
export const HIP_Y = GROUND - THIGH - SHIN
export const SHOULDER_Y = HIP_Y - 34
export const HEAD_Y = SHOULDER_Y - 14
export const HEAD_R = 8.5

export const SHOULDER_HALF = 11
export const HIP_HALF = 7.5
export const UPPER_ARM = 15
export const FOREARM = 14

/** Racket dimensions, for the technique swings. */
export const SHAFT = 20
export const HEAD_LONG = 11
export const HEAD_SHORT = 8
/**
 * Side room a swung racket needs beyond the figure's own bounds.
 *
 * Sized from the worst case rather than tuned until the current poses fit: a
 * leaning torso puts the shoulder around x=67, and from there an arm, a shaft
 * and half a racket head add another 60. Guessing low here means a new pose
 * quietly loses its racket off the edge of the canvas.
 */
export const RACKET_MARGIN = 34
/**
 * Breathing room for a bare figure. A forward lean slides the whole upper body
 * sideways — the neck pivots from the hip — so a wall-press stretch with the
 * arms out reaches past the nominal width without any single angle looking
 * extreme. Cheaper to give every figure a margin than to file the corners off
 * the poses that need it.
 */
export const FIGURE_MARGIN = 14

export const marginFor = (racket: 'left' | 'right' | null) =>
  racket ? RACKET_MARGIN : FIGURE_MARGIN

const rad = (deg: number) => (deg * Math.PI) / 180

export interface Point {
  x: number
  y: number
}

/** Walks `len` from `from` at `deg` off straight-down; `side` mirrors it. */
export function step(from: Point, len: number, deg: number, side: 1 | -1): Point {
  return {
    x: from.x + side * len * Math.sin(rad(deg)),
    y: from.y + len * Math.cos(rad(deg)),
  }
}

export interface Figure {
  head: Point
  neck: Point
  hip: Point
  shoulderL: Point
  shoulderR: Point
  elbowL: Point
  elbowR: Point
  handL: Point
  handR: Point
  hipL: Point
  hipR: Point
  kneeL: Point
  kneeR: Point
  footL: Point
  footR: Point
}

/**
 * Builds the skeleton for a pose. A twist narrows the shoulders, which is how
 * rotation reads in a flat front view — the same trick a comic artist uses.
 */
export function build(pose: MobilityPose): Figure {
  // `lift` is height *above the floor*, never below it — the figure is grounded
  // automatically, so a negative value would only bury it.
  const lift = Math.max(0, pose.lift ?? 0)
  const lean = pose.lean ?? 0
  const twist = pose.twist ?? 0
  const shoulderHalf = SHOULDER_HALF * Math.cos(rad(twist))

  const hip: Point = { x: 50, y: HIP_Y - lift }
  // The torso leans from the hip, so the shoulders and head travel with it.
  const neck = step(hip, HIP_Y - SHOULDER_Y, 180 - lean, 1)
  const head = {
    x: neck.x + (HEAD_Y - SHOULDER_Y) * Math.sin(rad(lean)),
    y: neck.y - (SHOULDER_Y - HEAD_Y),
  }

  const shoulderL: Point = { x: neck.x - shoulderHalf, y: neck.y }
  const shoulderR: Point = { x: neck.x + shoulderHalf, y: neck.y }
  const hipL: Point = { x: hip.x - HIP_HALF, y: hip.y }
  const hipR: Point = { x: hip.x + HIP_HALF, y: hip.y }

  const elbowL = step(shoulderL, UPPER_ARM, pose.armL, -1)
  const elbowR = step(shoulderR, UPPER_ARM, pose.armR, 1)
  const handL = step(elbowL, FOREARM, pose.armL + (pose.elbowL ?? 0), -1)
  const handR = step(elbowR, FOREARM, pose.armR + (pose.elbowR ?? 0), 1)

  const kneeL = step(hipL, THIGH, pose.legL, -1)
  const kneeR = step(hipR, THIGH, pose.legR, 1)
  const footL = step(kneeL, SHIN, pose.legL - (pose.kneeL ?? 0), -1)
  const footR = step(kneeR, SHIN, pose.legR - (pose.kneeR ?? 0), 1)

  const figure: Figure = {
    head,
    neck,
    hip,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    handL,
    handR,
    hipL,
    hipR,
    kneeL,
    kneeR,
    footL,
    footR,
  }

  /*
   * Stand the figure on the floor.
   *
   * A fixed hip height only works while both legs are straight. Kneel, lunge or
   * squat and whichever part is lowest — a foot, or a knee in a half-kneel —
   * has to be the thing that touches the ground, or the figure hovers. Dropping
   * the whole skeleton by however far it misses fixes every pose at once, and
   * makes `lift` mean "off the ground", which is what a hop actually is.
   */
  const lowest = Math.max(figure.footL.y, figure.footR.y, figure.kneeL.y, figure.kneeR.y)
  const shift = GROUND - lift - lowest
  if (shift !== 0) {
    for (const point of Object.values(figure)) point.y += shift
  }

  return figure
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function blend(from: MobilityPose, to: MobilityPose, t: number): MobilityPose {
  return {
    label: t < 0.5 ? from.label : to.label,
    armL: lerp(from.armL, to.armL, t),
    armR: lerp(from.armR, to.armR, t),
    elbowL: lerp(from.elbowL ?? 0, to.elbowL ?? 0, t),
    elbowR: lerp(from.elbowR ?? 0, to.elbowR ?? 0, t),
    legL: lerp(from.legL, to.legL, t),
    legR: lerp(from.legR, to.legR, t),
    kneeL: lerp(from.kneeL ?? 0, to.kneeL ?? 0, t),
    kneeR: lerp(from.kneeR ?? 0, to.kneeR ?? 0, t),
    twist: lerp(from.twist ?? 0, to.twist ?? 0, t),
    lift: lerp(from.lift ?? 0, to.lift ?? 0, t),
    lean: lerp(from.lean ?? 0, to.lean ?? 0, t),
  }
}

/**
 * Where the racket head sits, given a hand and the elbow behind it. A racket
 * continues the line of the forearm, which is what makes a swing read as a
 * swing rather than as an arm waving next to an oval.
 */
export function racketHead(
  figure: Figure,
  side: 'left' | 'right',
): { head: Point; angleDeg: number } {
  const hand = side === 'right' ? figure.handR : figure.handL
  const elbow = side === 'right' ? figure.elbowR : figure.elbowL
  const dx = hand.x - elbow.x
  const dy = hand.y - elbow.y
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  return {
    head: { x: hand.x + ux * SHAFT, y: hand.y + uy * SHAFT },
    // Degrees for an SVG rotate(), which measures clockwise from the +x axis.
    angleDeg: (Math.atan2(uy, ux) * 180) / Math.PI,
  }
}

/** An arrow only where something actually moved — below that it is a smudge. */
export const MIN_TRAVEL = 9

export function travel(from: Point, to: Point): { from: Point; to: Point } | null {
  return Math.hypot(to.x - from.x, to.y - from.y) > MIN_TRAVEL ? { from, to } : null
}

/** The extremity that moved furthest between two keyframes — the one to arrow. */
export function movingPart(a: Figure, b: Figure): { from: Point; to: Point } | null {
  // Near-side limbs are weighted up: they are the ones drawn in full strength,
  // and an arrow hanging off a faded limb reads as belonging to nothing.
  const pairs: [Point, Point, number][] = [
    [a.handR, b.handR, 1.35],
    [a.footR, b.footR, 1.35],
    [a.handL, b.handL, 1],
    [a.footL, b.footL, 1],
  ]
  let best: { from: Point; to: Point } | null = null
  let bestScore = MIN_TRAVEL
  for (const [from, to, weight] of pairs) {
    const score = Math.hypot(to.x - from.x, to.y - from.y) * weight
    if (score > bestScore) {
      bestScore = score
      best = { from, to }
    }
  }
  return best
}

/* ------------------------------------------------------- shape assertions */

/** How far apart the feet are. A wide stance has to be wider than the hips. */
export function footSpread(pose: MobilityPose): number {
  const figure = build(pose)
  return Math.abs(figure.footR.x - figure.footL.x)
}

/** Hip width, the yardstick a stance is measured against. */
export const HIP_SPREAD = HIP_HALF * 2

/** The lowest point of the figure, which should be the floor unless it hops. */
export function lowestY(pose: MobilityPose): number {
  const figure = build(pose)
  return Math.max(figure.footL.y, figure.footR.y, figure.kneeL.y, figure.kneeR.y)
}

/** Horizontal extent of the drawing, racket included, for canvas sizing. */
export function widestX(pose: MobilityPose, racket: 'left' | 'right' | null): [number, number] {
  const figure = build(pose)
  const xs = Object.values(figure).map((point) => point.x)
  if (racket) {
    const { head } = racketHead(figure, racket)
    xs.push(head.x - HEAD_LONG, head.x + HEAD_LONG)
  }
  return [Math.min(...xs), Math.max(...xs)]
}
