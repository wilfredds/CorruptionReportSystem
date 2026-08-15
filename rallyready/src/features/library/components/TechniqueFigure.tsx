import { MobilityDemo } from '@/features/conditioning/components/MobilityDemo'
import type { TechniqueDiagram } from '@/lib/data/seed/technique'
import { cn } from '@/lib/utils'

import { GripDiagram } from './GripDiagram'

/**
 * Picks the right picture for a technique topic.
 *
 * The jointed figure was built for warm-up movements; a swing is the same
 * problem — a body in a sequence of positions — so it draws swings too, with a
 * racket in hand and the arc following the racket head rather than the wrist.
 */
export function TechniqueFigure({
  diagram,
  className,
}: {
  diagram: TechniqueDiagram
  className?: string
}) {
  if (diagram.kind === 'grip') {
    return <GripDiagram grip={diagram.grip} className={className} />
  }
  if (diagram.kind === 'swing') {
    return (
      // The floor stays: a swing is played standing on a court, and without the
      // line the figure reads as floating rather than as loading against
      // something.
      <MobilityDemo poses={diagram.poses} racket={diagram.racket} className={className} />
    )
  }
  return <MobilityDemo poses={diagram.poses} className={className} />
}

/** The figure in the card it always appears in, so every topic frames it alike. */
export function TechniqueFigurePanel({
  diagram,
  className,
}: {
  diagram: TechniqueDiagram
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-court-surface border-border grid h-56 w-full place-items-center rounded-xl border p-3',
        className,
      )}
    >
      <TechniqueFigure diagram={diagram} className="h-full w-auto" />
    </div>
  )
}
