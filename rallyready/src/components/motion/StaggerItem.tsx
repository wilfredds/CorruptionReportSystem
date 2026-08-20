import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { listItemVariants, useInitialSafe, useMotionSafe } from '@/lib/motion'

/**
 * One item of a list that arrives in sequence rather than all at once.
 *
 * The delay is capped in `staggerDelay`, so a twelve-drill catalogue finishes
 * arriving in about a fifth of a second — long enough to read as a list being
 * dealt out, short enough that nobody waits to tap the last one.
 */
export function StaggerItem({
  index,
  as = 'li',
  className,
  children,
}: {
  index: number
  /** `li` inside a list, `div` inside a grid that is not one. */
  as?: 'li' | 'div'
  className?: string
  children: ReactNode
}) {
  const variants = useMotionSafe(listItemVariants)
  const initial = useInitialSafe('hidden')
  const Element = as === 'li' ? motion.li : motion.div

  return (
    <Element
      custom={index}
      variants={variants}
      initial={initial}
      animate="visible"
      className={className}
    >
      {children}
    </Element>
  )
}
