import type { Exercise } from '@/lib/data/seed/exercises'

import { FigureDemo } from './FigureDemo'
import { LadderDemo } from './LadderDemo'
import { MobilityDemo } from './MobilityDemo'

interface ExerciseDemoProps {
  exercise: Exercise
  animated?: boolean
  className?: string
}

/**
 * Picks the right schematic for an exercise: footfalls for ladder work, a
 * jointed skeleton for warm-up and stretching, and the parametric side-view
 * figure for jumps and bodyweight work.
 */
export function ExerciseDemo({ exercise, animated = true, className }: ExerciseDemoProps) {
  if (exercise.pattern) {
    return <LadderDemo pattern={exercise.pattern} className={className} />
  }
  if (exercise.mobility) {
    return <MobilityDemo poses={exercise.mobility} animated={animated} className={className} />
  }
  if (exercise.poses) {
    return <FigureDemo poses={exercise.poses} animated={animated} className={className} />
  }
  return null
}
