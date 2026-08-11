import type { Discipline, Drill, SkillLevel, TrainingGoal } from './types'

/**
 * Picks the first drill to put in front of a new user.
 *
 * The point is the early win (§4 Phase 2): finish onboarding and land in
 * something that is unmistakably *for you* and unmistakably achievable — never
 * a four-minute Tabata on day one.
 */

export interface RecommendationInput {
  skillLevel: SkillLevel
  primaryDiscipline: Discipline
  goal: TrainingGoal
}

export interface Recommendation {
  slug: string
  /** Shown to the user, so the choice does not look arbitrary. */
  reason: string
}

const FALLBACK: Recommendation = {
  slug: 'six-corner-shadow',
  reason: 'The benchmark solo session — the best all-round place to start.',
}

export function recommendDrill(input: RecommendationInput): Recommendation {
  const { skillLevel, primaryDiscipline, goal } = input

  // Coming back after a long break beats every other consideration: the first
  // session has to be finishable, or there is no second one.
  if (skillLevel === 'beginner') {
    return {
      slug: 'four-corner-footwork',
      reason:
        'Four corners at an unhurried pace. Fewer targets, longer travel, and time to move properly — the right place to rebuild from.',
    }
  }

  if (goal === 'stamina') {
    return skillLevel === 'advanced'
      ? {
          slug: 'tabata-shadow',
          reason:
            'Twenty on, ten off, eight times. Four minutes that will tell you exactly how much base you have.',
        }
      : {
          slug: 'match-rhythm-intervals',
          reason:
            'Short work blocks at a real 1:2 rally-to-rest ratio, so you train the energy system a match actually uses.',
        }
  }

  if (goal === 'footwork') {
    return skillLevel === 'advanced'
      ? {
          slug: 'deception-reaction',
          reason:
            'A fake call, then the real one. Trains the second split-step — the thing that stops you getting wrong-footed.',
        }
      : {
          slug: 'six-corner-shadow',
          reason:
            'Six targets, random calls, a shadow swing at every corner. The pattern and the engine behind it, together.',
        }
  }

  if (goal === 'match-ready') {
    return {
      slug: 'match-rhythm-intervals',
      reason:
        'Built on measured singles data — roughly six seconds of rally against twelve of recovery, over and over.',
    }
  }

  // consistency — technique under no time pressure.
  return primaryDiscipline === 'doubles'
    ? {
        slug: 'net-footwork',
        reason:
          'Doubles is won at the front. Net corners only, at a deliberate pace, one full lunge per rep.',
      }
    : {
        slug: 'rear-court-scissor',
        reason:
          'Rear corners, slow calls, maximum quality. The most common place a returning singles player loses time.',
      }
}

export function resolveRecommendation(
  input: RecommendationInput,
  drills: Drill[],
): { drill: Drill; reason: string } | null {
  const recommendation = recommendDrill(input)
  const drill =
    drills.find((candidate) => candidate.slug === recommendation.slug) ??
    drills.find((candidate) => candidate.slug === FALLBACK.slug) ??
    drills[0]
  if (!drill) return null
  return {
    drill,
    reason: drill.slug === recommendation.slug ? recommendation.reason : FALLBACK.reason,
  }
}
