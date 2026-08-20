import { cn } from '@/lib/utils'

/**
 * A placeholder in the shape of the thing that is loading.
 *
 * The point is not decoration — it is that the page does not jump. "Loading
 * drills…" is a line of text that gets replaced by six cards, so everything
 * below it lurches down the moment the data lands. A skeleton the same size as
 * the content reserves the space in advance.
 *
 * The shimmer is a translated gradient, so it composites and never repaints the
 * block underneath. Under reduced motion the global override stops it after one
 * pass and the plain grey block remains, which is the correct outcome: the
 * placeholder is still visibly a placeholder.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-secondary relative overflow-hidden rounded-lg', className)} aria-hidden>
      <div className="animate-shimmer via-foreground/10 absolute inset-0 bg-gradient-to-r from-transparent to-transparent" />
    </div>
  )
}

/** A card-shaped placeholder, for lists of cards. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('border-border rounded-xl border p-4', className)}>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-5 w-2/3" />
      <Skeleton className="mt-2 h-3.5 w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-4/5" />
      <Skeleton className="mt-3 h-3 w-1/2" />
    </div>
  )
}
