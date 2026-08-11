import { useEffect, useRef, useState } from 'react'

import type { FigurePose } from '@/lib/data/seed/exercises'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

/**
 * A side-view figure animated from pose *parameters* rather than drawn art.
 *
 * One renderer covers every plyometric and bodyweight exercise: each supplies
 * three keyframes of squat depth, height off the floor, tuck, arm swing and
 * foot split, and the skeleton is computed from those. That is what makes a
 * demo affordable for eleven exercises — and, unlike an embedded clip, it
 * works with no connection and never rots.
 */

// Wide enough for a full lunge without the trailing foot leaving the frame.
const VIEW_W = 112
const VIEW_H = 140
const GROUND_Y = 116
const HIP_X = 56

const MS_PER_POSE = 720
/**
 * Fraction of each slot spent holding the keyframe before moving to the next.
 * Blending continuously looks like a person swaying: the figure spends all its
 * time between poses and never actually shows the position being taught.
 */
const HOLD = 0.45
/** ~24fps is plenty for a schematic and leaves the main thread alone. */
const FRAME_MS = 42

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function blend(from: FigurePose, to: FigurePose, t: number): Omit<FigurePose, 'label'> {
  return {
    squat: lerp(from.squat, to.squat, t),
    air: lerp(from.air, to.air, t),
    tuck: lerp(from.tuck, to.tuck, t),
    arms: lerp(from.arms, to.arms, t),
    split: lerp(from.split, to.split, t),
    lead: lerp(from.lead ?? 0, to.lead ?? 0, t),
  }
}

interface Skeleton {
  head: [number, number]
  neck: [number, number]
  hip: [number, number]
  knees: [number, number][]
  ankles: [number, number][]
  elbow: [number, number]
  hand: [number, number]
}

/**
 * Turns the five pose parameters into joint coordinates.
 *
 * The constants are tuned so a standing figure leaves headroom at the top of
 * the viewBox and a full lunge visibly splits the feet — get either wrong and
 * every pose reads as "person standing still".
 */
function skeleton(p: Omit<FigurePose, 'label'>): Skeleton {
  const lift = p.air * 28
  const groundY = GROUND_Y - lift

  const lead = p.lead ?? 0

  const hipY = groundY - (60 - p.squat * 26)
  // A lunge stays upright; a squat pitches forward. Blend between the two.
  const lean = p.squat * 13 * (1 - lead * 0.85)
  const hipX = HIP_X - lean * 0.35

  const neckX = hipX + lean
  const neckY = hipY - (38 - p.squat * 6)
  const headY = neckY - 12

  // Feet: split spreads them, and a tuck pulls them up towards the hips.
  const spread = p.split * 26
  const footY = groundY - p.tuck * 38
  const feet: [number, number][] = [
    // Trailing foot swings further back as the lunge deepens.
    [hipX - spread * (1 + lead * 0.45), footY],
    [hipX + spread + p.split * 9, footY],
  ]

  const knees = feet.map(([fx, fy], index): [number, number] => {
    const midX = (hipX + fx) / 2
    const midY = (hipY + fy) / 2
    // Symmetric: knees jut forward with depth and rise with the tuck.
    const evenX = midX + p.squat * 14 + p.tuck * 8
    const evenY = midY - p.tuck * 14
    if (lead === 0) return [evenX, evenY]

    const isFront = index === 1
    return isFront
      ? // Front knee stacks over the ankle — the cue the drill is about.
        [lerp(evenX, fx - 2, lead), lerp(evenY, midY, lead)]
      : // Trailing knee drops towards the floor behind the hips.
        [lerp(evenX, midX - 5, lead), lerp(evenY, hipY + (fy - hipY) * 0.85, lead)]
  })

  const handX = neckX + p.arms * 25
  const handY = neckY - p.arms * 20 + (1 - Math.abs(p.arms)) * 10
  const elbow: [number, number] = [(neckX + handX) / 2 + 4, (neckY + handY) / 2 + 5]

  return {
    head: [neckX + 1, headY],
    neck: [neckX, neckY],
    hip: [hipX, hipY],
    knees,
    ankles: feet,
    elbow,
    hand: [handX, handY],
  }
}

interface FigureDemoProps {
  poses: FigurePose[]
  /** Lists render a single static pose; the runner animates. */
  animated?: boolean
  className?: string
}

export function FigureDemo({ poses, animated = true, className }: FigureDemoProps) {
  const reducedMotion = useReducedMotion()
  const shouldAnimate = animated && !reducedMotion && poses.length > 1

  // Only ever written by the animation loop. The static case is derived below
  // rather than pushed into state, so the effect never sets state on the spot.
  const [frame, setFrame] = useState<{
    pose: Omit<FigurePose, 'label'>
    label: string
  } | null>(null)
  const startRef = useRef(0)

  useEffect(() => {
    if (!shouldAnimate) return

    startRef.current = performance.now()
    const cycleMs = poses.length * MS_PER_POSE

    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - startRef.current) % cycleMs
      const index = Math.floor(elapsed / MS_PER_POSE)
      const raw = (elapsed % MS_PER_POSE) / MS_PER_POSE
      const t = raw < HOLD ? 0 : easeInOut((raw - HOLD) / (1 - HOLD))
      const from = poses[index] ?? poses[0]
      const to = poses[(index + 1) % poses.length] ?? poses[0]
      if (!from || !to) return
      // Name whichever keyframe is actually on screen, not always the one we
      // left — otherwise the caption lies for half of every transition.
      setFrame({ pose: blend(from, to, t), label: t < 0.5 ? from.label : to.label })
    }, FRAME_MS)

    return () => window.clearInterval(timer)
  }, [poses, shouldAnimate])

  const first = poses[0]
  if (!first) return null
  const live = shouldAnimate ? frame : null
  const label = live?.label ?? first.label
  const s = skeleton(live?.pose ?? first)

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={`Movement demonstration: ${poses.map((p) => p.label).join(', then ')}`}
    >
      <line
        x1="8"
        y1={GROUND_Y}
        x2={VIEW_W - 8}
        y2={GROUND_Y}
        className="stroke-court-line"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <g
        className="stroke-foreground"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <line x1={s.neck[0]} y1={s.neck[1]} x2={s.hip[0]} y2={s.hip[1]} />
        {s.knees.map((knee, i) => (
          <polyline
            key={i}
            points={`${s.hip[0]},${s.hip[1]} ${knee[0]},${knee[1]} ${s.ankles[i]?.[0]},${s.ankles[i]?.[1]}`}
            className={i === 0 ? 'stroke-foreground/55' : 'stroke-foreground'}
          />
        ))}
        <polyline
          points={`${s.neck[0]},${s.neck[1]} ${s.elbow[0]},${s.elbow[1]} ${s.hand[0]},${s.hand[1]}`}
          className="stroke-primary"
        />
      </g>

      <circle cx={s.head[0]} cy={s.head[1]} r="8" className="fill-foreground" />

      <text
        x={VIEW_W / 2}
        y={VIEW_H - 4}
        textAnchor="middle"
        className="fill-muted-foreground font-semibold"
        style={{ fontSize: 9, letterSpacing: 0.5 }}
      >
        {label.toUpperCase()}
      </text>
    </svg>
  )
}
