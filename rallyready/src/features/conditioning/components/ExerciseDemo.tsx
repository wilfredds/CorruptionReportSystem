import type { Exercise } from '@/lib/data/seed/exercises'

import { FigureDemo } from './FigureDemo'
import { LadderDemo } from './LadderDemo'

interface ExerciseDemoProps {
  exercise: Exercise
  animated?: boolean
  className?: string
}

/** Picks the right schematic for an exercise: footfalls, or a side-view figure. */
export function ExerciseDemo({ exercise, animated = true, className }: ExerciseDemoProps) {
  if (exercise.pattern) {
    return <LadderDemo pattern={exercise.pattern} className={className} />
  }
  if (exercise.poses) {
    return <FigureDemo poses={exercise.poses} animated={animated} className={className} />
  }
  return null
}
