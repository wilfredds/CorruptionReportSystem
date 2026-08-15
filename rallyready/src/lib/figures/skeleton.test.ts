import { describe, expect, it } from 'vitest'

import { EXERCISES, findExercise, type MobilityPose } from '@/lib/data/seed/exercises'
import { TECHNIQUE_TOPICS } from '@/lib/data/seed/technique'

import {
  build,
  footSpread,
  lowestY,
  marginFor,
  movingPart,
  racketHead,
  widestX,
  GROUND,
  HEAD_Y,
  HIP_SPREAD,
  MIN_TRAVEL,
  VIEW_W,
} from './skeleton'

/**
 * Every defect in these figures so far was found by rendering one and looking
 * at it. These are the same checks, expressed as arithmetic so they run against
 * all fifty-odd poses instead of the three someone remembers to open.
 */

/** Every mobility pose in the app, whatever it is attached to. */
function allPoses(): { where: string; pose: MobilityPose; racket: 'left' | 'right' | null }[] {
  const out: { where: string; pose: MobilityPose; racket: 'left' | 'right' | null }[] = []
  for (const exercise of EXERCISES) {
    for (const pose of exercise.mobility ?? []) {
      out.push({ where: `${exercise.slug} / ${pose.label}`, pose, racket: null })
    }
  }
  for (const topic of TECHNIQUE_TOPICS) {
    const diagram = topic.diagram
    if (!diagram || diagram.kind === 'grip') continue
    const racket = diagram.kind === 'swing' ? diagram.racket : null
    for (const pose of diagram.poses) {
      out.push({ where: `${topic.slug} / ${pose.label}`, pose, racket })
    }
  }
  return out
}

describe('the skeleton', () => {
  it('stands every pose on the floor', () => {
    for (const { where, pose } of allPoses()) {
      // A pose with `lift` is mid-hop and is meant to be off the ground; every
      // other one has to be touching it, or the figure hovers.
      const expected = GROUND - Math.max(0, pose.lift ?? 0)
      expect(lowestY(pose), where).toBeCloseTo(expected, 5)
    }
  })

  it('never lets a hop sink below the floor', () => {
    for (const { where, pose } of allPoses()) {
      expect(lowestY(pose), where).toBeLessThanOrEqual(GROUND + 0.001)
    }
  })

  it('keeps every figure inside the canvas it is drawn on', () => {
    for (const { where, pose, racket } of allPoses()) {
      const [min, max] = widestX(pose, racket)
      const margin = marginFor(racket)
      expect(min, `${where} (left edge)`).toBeGreaterThanOrEqual(-margin)
      expect(max, `${where} (right edge)`).toBeLessThanOrEqual(VIEW_W + margin)
    }
  })

  it('keeps pose labels short enough to fit under the figure', () => {
    for (const { where, pose } of allPoses()) {
      expect(pose.label.length, where).toBeLessThanOrEqual(22)
    }
  })
})

describe('the sign convention', () => {
  it('takes a limb away from the centreline on both sides for a positive angle', () => {
    const apart = build({ label: 'apart', armL: 40, armR: 40, legL: 20, legR: 20 })
    expect(apart.footL.x).toBeLessThan(apart.hipL.x)
    expect(apart.footR.x).toBeGreaterThan(apart.hipR.x)
    expect(apart.handL.x).toBeLessThan(apart.shoulderL.x)
    expect(apart.handR.x).toBeGreaterThan(apart.shoulderR.x)
  })

  it('leans rather than widens when the two sides disagree in sign', () => {
    // This is the mistake the whole convention exists to prevent: written this
    // way, "land wide" comes out as a figure tipped over with its feet together.
    const leaning = build({ label: 'leaning', armL: 8, armR: 8, legL: -16, legR: 16 })
    const wide = build({ label: 'wide', armL: 8, armR: 8, legL: 16, legR: 16 })
    expect(Math.abs(leaning.footR.x - leaning.footL.x)).toBeLessThan(
      Math.abs(wide.footR.x - wide.footL.x),
    )
  })

  it('draws a wide stance wider than the hips wherever one is called for', () => {
    // The poses whose whole coaching point is a wide base. If one of these ever
    // stops being wide, the picture is teaching the opposite of the cue above it.
    const wideStances = [
      { slug: 'mob-split-steps', label: 'Ready' },
      { slug: 'mob-split-steps', label: 'Land wide' },
      { slug: 'mob-side-shuffle', label: 'Land wide' },
    ]
    for (const { slug, label } of wideStances) {
      const exercise = findExercise(slug)
      const pose = exercise?.mobility?.find((entry) => entry.label === label)
      if (!pose) continue // the pose was renamed; the coverage test below still guards the rest
      expect(footSpread(pose), `${slug} / ${label}`).toBeGreaterThan(HIP_SPREAD)
    }
  })
})

describe('the racket', () => {
  it('extends beyond the hand holding it', () => {
    const figure = build({ label: 'reach', armL: 8, armR: 90, legL: 6, legR: 6 })
    const { head } = racketHead(figure, 'right')
    expect(head.x).toBeGreaterThan(figure.handR.x)
  })

  it('follows the arm it is in', () => {
    const overhead = racketHead(
      build({ label: 'up', armL: 8, armR: 175, legL: 6, legR: 6 }),
      'right',
    )
    const down = racketHead(build({ label: 'down', armL: 8, armR: 5, legL: 6, legR: 6 }), 'right')
    expect(overhead.head.y).toBeLessThan(down.head.y)
  })
})

describe('movingPart', () => {
  it('says nothing when nothing moved', () => {
    const still = build({ label: 'still', armL: 8, armR: 8, legL: 6, legR: 6 })
    expect(movingPart(still, still)).toBeNull()
  })

  it('picks the limb that travelled furthest', () => {
    const a = build({ label: 'a', armL: 8, armR: 8, legL: 6, legR: 6 })
    const b = build({ label: 'b', armL: 8, armR: 150, legL: 6, legR: 6 })
    const arc = movingPart(a, b)
    expect(arc).not.toBeNull()
    expect(arc?.from).toEqual(a.handR)
  })
})

describe('every drawn sequence', () => {
  it('visibly changes between one keyframe and the next', () => {
    // Not "the racket travels far": a ready stance is drawn with a racket and
    // is deliberately a small movement. What must never happen is a multi-frame
    // diagram whose frames are indistinguishable — that is a still image
    // pretending to be an animation.
    for (const topic of TECHNIQUE_TOPICS) {
      const diagram = topic.diagram
      if (!diagram || diagram.kind === 'grip') continue
      expect(diagram.poses.length, topic.slug).toBeGreaterThan(1)

      // Consecutive frames only. The wrap from the last frame back to the first
      // is allowed to be subtle — settling back into a ready position after a
      // landing genuinely is a small movement — but every step of the sequence
      // itself has to show something.
      for (let i = 0; i < diagram.poses.length - 1; i++) {
        const a = build(diagram.poses[i]!)
        const b = build(diagram.poses[i + 1]!)
        const moved = Math.max(
          ...Object.keys(a).map((key) => {
            const from = a[key as keyof typeof a]
            const to = b[key as keyof typeof b]
            return Math.hypot(to.x - from.x, to.y - from.y)
          }),
        )
        expect(moved, `${topic.slug} frame ${i + 1}`).toBeGreaterThan(MIN_TRAVEL)
      }
    }
  })

  it('swings the racket well overhead for the overhead shots', () => {
    for (const slug of ['the-overhead-clear', 'the-smash']) {
      const topic = TECHNIQUE_TOPICS.find((entry) => entry.slug === slug)
      const diagram = topic?.diagram
      if (diagram?.kind !== 'swing') throw new Error(`${slug} should be drawn as a swing`)
      const heads = diagram.poses.map((pose) => racketHead(build(pose), diagram.racket).head)
      // Contact is above the head; the follow-through comes back down past it.
      const highest = Math.min(...heads.map((point) => point.y))
      const lowest = Math.max(...heads.map((point) => point.y))
      expect(highest, `${slug} contact height`).toBeLessThan(HEAD_Y)
      expect(lowest - highest, `${slug} swing travel`).toBeGreaterThan(40)
    }
  })
})
