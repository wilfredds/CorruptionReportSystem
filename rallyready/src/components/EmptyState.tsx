import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { listItemVariants, useInitialSafe, useMotionSafe } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * A screen with nothing on it, drawn rather than apologised for.
 *
 * An empty state is the first thing a lot of people see, and a centred grey
 * sentence reads as a failure. These are line drawings in the app's own accent,
 * built from the same shapes the rest of the product uses — a shuttle, a
 * half-court, a chart with no data in it — so an empty screen still looks like
 * this app rather than like a missing image.
 *
 * Drawn as inline SVG on purpose: it is an offline PWA, so nothing here may
 * depend on fetching an asset.
 */

type Illustration = 'shuttle' | 'court' | 'chart'

function Shuttle() {
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      {/* Skirt: four feathers fanning up from the cork. */}
      <g className="stroke-primary" fill="none" strokeWidth="2.5" strokeLinecap="round">
        <path d="M60 74 L34 24" />
        <path d="M60 74 L50 18" />
        <path d="M60 74 L70 18" />
        <path d="M60 74 L86 24" />
        <path d="M41 40 L79 40" opacity="0.5" />
        <path d="M36 54 L84 54" opacity="0.5" />
      </g>
      <ellipse cx="60" cy="84" rx="15" ry="14" className="fill-primary" />
      <path
        d="M45 84a15 14 0 0 0 30 0"
        className="stroke-primary-foreground"
        fill="none"
        strokeWidth="2"
        opacity="0.5"
      />
    </svg>
  )
}

function Court() {
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      <rect
        x="26"
        y="14"
        width="68"
        height="92"
        rx="3"
        className="fill-secondary stroke-primary"
        strokeWidth="2.5"
      />
      <g className="stroke-primary" strokeWidth="1.6" opacity="0.55" fill="none">
        <line x1="34" y1="14" x2="34" y2="106" />
        <line x1="86" y1="14" x2="86" y2="106" />
        <line x1="26" y1="44" x2="94" y2="44" />
        <line x1="26" y1="98" x2="94" y2="98" />
        <line x1="60" y1="44" x2="60" y2="106" />
      </g>
      <line
        x1="26"
        y1="14"
        x2="94"
        y2="14"
        className="stroke-foreground"
        strokeWidth="3"
        strokeDasharray="3 2.5"
        opacity="0.6"
      />
      <circle cx="60" cy="70" r="6" className="fill-primary" opacity="0.35" />
    </svg>
  )
}

function Chart() {
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      <g className="stroke-foreground/20" strokeWidth="1.6" strokeDasharray="3 3">
        <line x1="22" y1="34" x2="102" y2="34" />
        <line x1="22" y1="60" x2="102" y2="60" />
        <line x1="22" y1="86" x2="102" y2="86" />
      </g>
      <g className="fill-primary" opacity="0.25">
        <rect x="30" y="70" width="14" height="16" rx="3" />
        <rect x="53" y="56" width="14" height="30" rx="3" />
      </g>
      <rect x="76" y="34" width="14" height="52" rx="3" className="fill-primary" />
      <line x1="22" y1="96" x2="102" y2="96" className="stroke-foreground/40" strokeWidth="2" />
    </svg>
  )
}

const ART: Record<Illustration, () => ReactNode> = {
  shuttle: Shuttle,
  court: Court,
  chart: Chart,
}

export function EmptyState({
  illustration,
  title,
  body,
  action,
  className,
}: {
  illustration: Illustration
  title: string
  body: string
  action?: ReactNode
  className?: string
}) {
  const item = useMotionSafe(listItemVariants)
  const initial = useInitialSafe('hidden')
  const Art = ART[illustration]

  return (
    <div
      className={cn(
        'border-border flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center',
        className,
      )}
    >
      <motion.div
        custom={0}
        variants={item}
        initial={initial}
        animate="visible"
        className="size-24"
      >
        <Art />
      </motion.div>
      <motion.p
        custom={1}
        variants={item}
        initial={initial}
        animate="visible"
        className="mt-4 font-semibold"
      >
        {title}
      </motion.p>
      <motion.p
        custom={2}
        variants={item}
        initial={initial}
        animate="visible"
        className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-relaxed"
      >
        {body}
      </motion.p>
      {action && (
        <motion.div custom={3} variants={item} initial={initial} animate="visible" className="mt-5">
          {action}
        </motion.div>
      )}
    </div>
  )
}
