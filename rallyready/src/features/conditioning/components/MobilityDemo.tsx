import { useEffect, useState } from 'react'

import type { MobilityPose } from '@/lib/data/seed/exercises'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

/**
 * A jointed figure for warm-up and stretching movements.
 *
 * The original figure was parametric — squat depth, air, tuck, arm swing — which
 * works for a jump squat and cannot express an arm circle, a leg swing or a
 * torso twist at all. Those came out as a stick man shuffling vaguely, which is
 * worse than no picture.
 *
 * This one is driven by actual joint angles, so a movement is drawn the way it
 * is performed. Two things make it readable rather than merely accurate:
 *
 *  - it interpolates between keyframes, so you see the movement rather than a
 *    slideshow of positions;
 *  - it draws a motion arc on whichever hand or foot travelled furthest since
 *    the last keyframe. On an exercise diagram the arrow is what tells you what
 *    to do; the pose only tells you where to start.
 */

const VIEW_W = 100
const VIEW_H = 148
const GROUND = 132

// Geometry is derived from the ground rather than guessed, so a straight leg
// lands exactly on the line instead of floating above it.
const THIGH = 21
const SHIN = 21
const HIP_Y = GROUND - THIGH - SHIN
const SHOULDER_Y = HIP_Y - 34
const HEAD_Y = SHOULDER_Y - 14
const HEAD_R = 8.5

const SHOULDER_HALF = 11
const HIP_HALF = 7.5
const UPPER_ARM = 15
const FOREARM = 14

const MS_PER_FRAME = 900

const rad = (deg: number) => (deg * Math.PI) / 180

interface Point {
  x: number
  y: number
}

/** Walks `len` from `from` at `deg` off straight-down; `side` mirrors it. */
function step(from: Point, len: number, deg: number, side: 1 | -1): Point {
  return {
    x: from.x + side * len * Math.sin(rad(deg)),
    y: from.y + len * Math.cos(rad(deg)),
  }
}

interface Figure {
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
function build(pose: MobilityPose): Figure {
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

function blend(from: MobilityPose, to: MobilityPose, t: number): MobilityPose {
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

/** The extremity that moved furthest between two keyframes — the one to arrow. */
function movingPart(a: Figure, b: Figure): { from: Point; to: Point } | null {
  // Near-side limbs are weighted up: they are the ones drawn in full strength,
  // and an arrow hanging off a faded limb reads as belonging to nothing.
  const pairs: [Point, Point, number][] = [
    [a.handR, b.handR, 1.35],
    [a.footR, b.footR, 1.35],
    [a.handL, b.handL, 1],
    [a.footL, b.footL, 1],
  ]
  let best: { from: Point; to: Point } | null = null
  let bestScore = 9
  for (const [from, to, weight] of pairs) {
    const score = Math.hypot(to.x - from.x, to.y - from.y) * weight
    if (score > bestScore) {
      bestScore = score
      best = { from, to }
    }
  }
  return best
}

interface MobilityDemoProps {
  poses: MobilityPose[]
  animated?: boolean
  className?: string
}

export function MobilityDemo({ poses, animated = true, className }: MobilityDemoProps) {
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!animated || reducedMotion || poses.length < 2) return
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      setPhase(((now - started) / MS_PER_FRAME) % poses.length)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animated, reducedMotion, poses.length])

  const index = Math.floor(phase) % poses.length
  const next = poses[(index + 1) % poses.length] ?? poses[0]!
  const current = poses[index] ?? poses[0]!

  // Hold each keyframe for the first 40% of its slot, then travel to the next.
  // Blending continuously makes the figure look like it is swaying rather than
  // hitting the positions being taught.
  const HOLD = 0.4
  const raw = phase - index
  const t = reducedMotion || !animated ? 0 : raw < HOLD ? 0 : (raw - HOLD) / (1 - HOLD)

  const shown = t === 0 ? current : blend(current, next, t)
  const figure = build(shown)
  const arc = movingPart(build(current), build(next))

  const bone = (a: Point, b: Point, key: string, faded = false) => (
    <line
      key={key}
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      className={faded ? 'stroke-foreground/45' : 'stroke-foreground'}
      strokeWidth="4.2"
      strokeLinecap="round"
    />
  )

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={`Movement demonstration: ${current.label}`}
    >
      <line
        x1="12"
        y1={GROUND}
        x2={VIEW_W - 12}
        y2={GROUND}
        className="stroke-court-line"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Motion arc first, so the limbs sit on top of it. */}
      {arc && (
        <g className="stroke-primary fill-primary">
          <path
            d={`M ${arc.from.x} ${arc.from.y} Q ${(arc.from.x + arc.to.x) / 2 + (arc.to.y - arc.from.y) * 0.35} ${
              (arc.from.y + arc.to.y) / 2 - (arc.to.x - arc.from.x) * 0.35
            } ${arc.to.x} ${arc.to.y}`}
            fill="none"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="5 4"
            opacity="0.85"
          />
          <circle cx={arc.to.x} cy={arc.to.y} r="3.4" stroke="none" opacity="0.9" />
        </g>
      )}

      {/* Far-side limbs faded, so left and right read apart. */}
      {bone(figure.shoulderL, figure.elbowL, 'ul-l', true)}
      {bone(figure.elbowL, figure.handL, 'fa-l', true)}
      {bone(figure.hipL, figure.kneeL, 'th-l', true)}
      {bone(figure.kneeL, figure.footL, 'sh-l', true)}

      {bone(figure.hip, figure.neck, 'spine')}
      {bone(figure.shoulderL, figure.shoulderR, 'shoulders')}
      {bone(figure.hipL, figure.hipR, 'hips')}

      {bone(figure.shoulderR, figure.elbowR, 'ul-r')}
      {bone(figure.elbowR, figure.handR, 'fa-r')}
      {bone(figure.hipR, figure.kneeR, 'th-r')}
      {bone(figure.kneeR, figure.footR, 'sh-r')}

      <circle cx={figure.head.x} cy={figure.head.y} r={HEAD_R} className="fill-foreground" />

      <text
        x="50"
        y={VIEW_H - 4}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px] font-semibold tracking-wide"
      >
        {shown.label.toUpperCase()}
      </text>
    </svg>
  )
}
