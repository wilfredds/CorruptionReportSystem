import { findExercise } from '@/lib/data/seed/exercises'
import { cn } from '@/lib/utils'

import { ExerciseDemo } from './ExerciseDemo'

/**
 * What the runner shows during a conditioning circuit, in place of the court
 * board. The exercise is named large enough to read from the floor, with a
 * looping schematic and the single cue that matters most.
 */

interface CircuitBoardProps {
  /** The exercise being performed, or the one coming up during a rest. */
  exerciseSlug: string | undefined
  /** True while recovering — the card goes quiet and reads "up next". */
  resting: boolean
  className?: string
}

export function CircuitBoard({ exerciseSlug, resting, className }: CircuitBoardProps) {
  const exercise = exerciseSlug ? findExercise(exerciseSlug) : undefined

  if (!exercise) {
    return (
      <div className={cn('grid h-full w-full place-items-center', className)}>
        <p className="text-muted-foreground text-sm">Get ready</p>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full w-full flex-col items-center gap-2', className)}>
      {resting && (
        <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase">
          Up next
        </p>
      )}

      <p
        className={cn(
          'text-center text-2xl leading-tight font-bold tracking-tight text-balance',
          resting && 'text-muted-foreground',
        )}
      >
        {exercise.name}
      </p>

      <div className={cn('min-h-0 w-full flex-1', resting && 'opacity-45')}>
        <ExerciseDemo exercise={exercise} animated={!resting} />
      </div>

      <p className="text-muted-foreground max-w-xs text-center text-sm leading-snug text-balance">
        {exercise.cues[0]}
      </p>
    </div>
  )
}
