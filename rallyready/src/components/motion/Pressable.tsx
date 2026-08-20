import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { pressVariants, useMotionSafe } from '@/lib/motion'

/**
 * Gives a card the give of a physical button.
 *
 * Scale only — no shadow, no border colour, nothing that forces a paint. The
 * lift on hover is deliberately tiny: at 1.01 a card under the cursor reads as
 * pickable, and at anything more a grid of them wobbles as the pointer crosses.
 *
 * Under reduced motion the variants come back with the transforms stripped, so
 * this renders as a plain wrapper and the card simply does not move.
 */
export function Pressable({ className, children }: { className?: string; children: ReactNode }) {
  const variants = useMotionSafe(pressVariants)

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.div>
  )
}
