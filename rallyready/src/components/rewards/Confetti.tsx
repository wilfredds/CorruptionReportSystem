import { motion } from 'framer-motion'
import { useMemo } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

/**
 * A short burst of paper, written by hand.
 *
 * No library: every confetti package on npm ships a canvas renderer and its own
 * animation loop for what is, in the end, twenty divs moving on a curve. These
 * are absolutely positioned spans animating `transform` and `opacity` only —
 * so they composite, never repaint, and cost nothing once the burst is over
 * because the whole thing unmounts.
 *
 * It fires once, from wherever it is mounted, and takes no interaction. Under
 * reduced motion it renders nothing at all: a celebration is exactly the kind
 * of decoration somebody who asked for less movement asked to be spared, and
 * the badge, the streak or the trophy behind it says the same thing in words.
 */

const COLOURS = [
  'bg-primary',
  'bg-work',
  'bg-sprint',
  'bg-rest',
  'bg-warmup',
  'bg-cooldown',
] as const

interface Piece {
  x: number
  y: number
  rotate: number
  delay: number
  duration: number
  colour: string
  wide: boolean
}

/**
 * Laid out deterministically from the piece's index rather than from
 * `Math.random`, so a re-render cannot reshuffle a burst that is mid-flight.
 * The irrational multipliers are doing the job randomness would: spreading the
 * angles so no two pieces travel together.
 */
function pieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + (index % 3) * 0.4
    const spread = 90 + ((index * 37) % 70)
    return {
      x: Math.cos(angle) * spread,
      // Biased upward: paper thrown in the air, not dropped.
      y: Math.sin(angle) * spread - 60 - ((index * 23) % 40),
      rotate: ((index * 137) % 360) - 180,
      delay: ((index * 17) % 12) / 100,
      duration: 0.85 + ((index * 29) % 45) / 100,
      colour: COLOURS[index % COLOURS.length] as string,
      wide: index % 3 === 0,
    }
  })
}

export function Confetti({ count = 22, className }: { count?: number; className?: string }) {
  const reduced = useReducedMotion()
  const shapes = useMemo(() => pieces(count), [count])

  if (reduced) return null

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-visible', className)}
      aria-hidden
    >
      {shapes.map((piece, index) => (
        <motion.span
          key={index}
          className={cn(
            'absolute top-1/2 left-1/2 rounded-[1px]',
            piece.colour,
            piece.wide ? 'h-1.5 w-2.5' : 'h-2.5 w-1.5',
          )}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
          animate={{
            x: piece.x,
            y: piece.y,
            opacity: 0,
            scale: 1,
            rotate: piece.rotate,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: [0.16, 0.8, 0.4, 1],
          }}
        />
      ))}
    </div>
  )
}
