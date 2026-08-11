import { describe, expect, it } from 'vitest'

import { recommendDrill, resolveRecommendation, type RecommendationInput } from './recommend'
import { SEED_DRILLS } from './seed/drills'
import type { SkillLevel, TrainingGoal } from './types'

const LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced']
const GOALS: TrainingGoal[] = ['stamina', 'footwork', 'match-ready', 'consistency']

function input(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    skillLevel: 'intermediate',
    primaryDiscipline: 'both',
    goal: 'footwork',
    ...overrides,
  }
}

describe('recommendDrill', () => {
  it('always names a drill that actually exists', () => {
    for (const skillLevel of LEVELS) {
      for (const goal of GOALS) {
        for (const primaryDiscipline of ['singles', 'doubles', 'both'] as const) {
          const { slug } = recommendDrill({ skillLevel, goal, primaryDiscipline })
          expect(SEED_DRILLS.some((drill) => drill.slug === slug)).toBe(true)
        }
      }
    }
  })

  it('never hands a beginner an advanced drill, whatever their goal', () => {
    for (const goal of GOALS) {
      const { slug } = recommendDrill(input({ skillLevel: 'beginner', goal }))
      const drill = SEED_DRILLS.find((candidate) => candidate.slug === slug)
      expect(drill?.level).not.toBe('advanced')
    }
  })

  it('sends a returning beginner to the four-corner drill', () => {
    expect(recommendDrill(input({ skillLevel: 'beginner' })).slug).toBe('four-corner-footwork')
  })

  it('matches stamina goals to conditioning work', () => {
    expect(recommendDrill(input({ goal: 'stamina' })).slug).toBe('match-rhythm-intervals')
    expect(recommendDrill(input({ goal: 'stamina', skillLevel: 'advanced' })).slug).toBe(
      'tabata-shadow',
    )
  })

  it('escalates a footwork goal to deception only for advanced players', () => {
    expect(recommendDrill(input({ goal: 'footwork' })).slug).toBe('six-corner-shadow')
    expect(recommendDrill(input({ goal: 'footwork', skillLevel: 'advanced' })).slug).toBe(
      'deception-reaction',
    )
  })

  it('sends doubles players chasing consistency to the net', () => {
    expect(recommendDrill(input({ goal: 'consistency', primaryDiscipline: 'doubles' })).slug).toBe(
      'net-footwork',
    )
    expect(recommendDrill(input({ goal: 'consistency', primaryDiscipline: 'singles' })).slug).toBe(
      'rear-court-scissor',
    )
  })

  it('always explains itself', () => {
    for (const goal of GOALS) {
      expect(recommendDrill(input({ goal })).reason.length).toBeGreaterThan(20)
    }
  })
})

describe('resolveRecommendation', () => {
  it('returns the matching drill from the catalogue', () => {
    const result = resolveRecommendation(input({ skillLevel: 'beginner' }), SEED_DRILLS)
    expect(result?.drill.slug).toBe('four-corner-footwork')
    expect(result?.reason).toContain('Four corners')
  })

  it('falls back when the recommended drill is missing from the catalogue', () => {
    const partial = SEED_DRILLS.filter((drill) => drill.slug === 'six-corner-shadow')
    const result = resolveRecommendation(input({ skillLevel: 'beginner' }), partial)
    expect(result?.drill.slug).toBe('six-corner-shadow')
    expect(result?.reason).toContain('benchmark solo session')
  })

  it('returns null rather than guessing when there are no drills at all', () => {
    expect(resolveRecommendation(input(), [])).toBeNull()
  })
})
