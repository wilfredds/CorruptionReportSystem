import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

/**
 * Three levels, so a screen can say which card matters.
 *
 * Every card used to look the same, and the ones that mattered — the drill the
 * coach picked, the badge you just earned — were made to stand out by pasting
 * the same four gradient classes at each site. Naming the levels means a screen
 * full of cards has a shape you can read at a glance instead of a stack of
 * identical white slabs, and there is one place to change what "important"
 * looks like.
 *
 * - `lead`    the one thing on the screen. At most one per screen.
 * - `default` a card.
 * - `quiet`   supporting material that should not compete with the rest.
 */
export type CardLevel = 'lead' | 'default' | 'quiet'

const LEVEL: Record<CardLevel, string> = {
  lead: 'border-primary/40 from-accent/60 bg-card bg-gradient-to-br to-transparent shadow-sm',
  default: 'bg-card border-border shadow-sm',
  quiet: 'bg-secondary/40 border-border/70',
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  level?: CardLevel
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, level = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-card-foreground rounded-xl border', LEVEL[level], className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg leading-tight font-semibold tracking-tight', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-muted-foreground text-sm', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 p-5 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'
