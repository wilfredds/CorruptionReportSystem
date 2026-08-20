import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  dialogVariants,
  listItemVariants,
  pageVariants,
  pressVariants,
  rewardVariants,
  stepVariants,
  swapVariants,
  useMotionSafe,
  valuePopVariants,
  DURATION,
  EASE,
  SPRING,
  STAGGER_MAX,
  STAGGER_STEP,
} from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * The motion vocabulary, playing rather than described.
 *
 * Same principle as the colour swatches above it: this renders the real
 * variants from `lib/motion`, so the page cannot drift from what the app
 * actually does. Replay re-mounts each demo by bumping a key.
 */

const NAMED = [
  { name: 'page', label: 'Page enter', variants: pageVariants, note: 'Every screen on arrival.' },
  {
    name: 'step',
    label: 'Step',
    variants: stepVariants,
    note: 'One question of a multi-step flow.',
  },
  {
    name: 'swap',
    label: 'Swap',
    variants: swapVariants,
    note: 'Content replacing content in place.',
  },
  {
    name: 'dialog',
    label: 'Dialog',
    variants: dialogVariants,
    note: 'Modals and sheets. Spring, so it arrives.',
  },
  {
    name: 'valuePop',
    label: 'Value changed',
    variants: valuePopVariants,
    note: 'A number that just moved.',
  },
  {
    name: 'reward',
    label: 'Reward',
    variants: rewardVariants,
    note: 'The trophy, an unlocked badge. The only slow one.',
  },
] as const

export function MotionSection() {
  const [replay, setReplay] = useState(0)
  const reduced = useReducedMotion()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {reduced
            ? 'Reduced motion is on, so every demo below settles instantly. That is the point — the state still changes, it just does not travel.'
            : 'Every variant the app ships, playing live.'}
        </p>
        <Button size="sm" variant="outline" onClick={() => setReplay((n) => n + 1)}>
          <RotateCcw />
          Replay
        </Button>
      </div>

      {/* ------------------------------------------------------------ tokens */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Durations</h3>
        <div className="space-y-2">
          {Object.entries(DURATION).map(([name, seconds]) => (
            <DurationBar key={name} name={name} seconds={seconds} replay={replay} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Easing</h3>
        <div className="text-muted-foreground grid gap-2 text-xs sm:grid-cols-2">
          {Object.entries(EASE).map(([name, curve]) => (
            <code key={name} className="bg-secondary/60 rounded-lg px-3 py-2">
              {name}: cubic-bezier({curve.join(', ')})
            </code>
          ))}
          {Object.entries(SPRING).map(([name, spring]) => (
            <code key={name} className="bg-secondary/60 rounded-lg px-3 py-2">
              {name}: stiffness {spring.stiffness}, damping {spring.damping}
            </code>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- variants */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Variants</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {NAMED.map((entry) => (
            <VariantDemo key={entry.name} {...entry} replay={replay} />
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------- stagger */}
      <div>
        <h3 className="mb-1 text-sm font-semibold">List stagger</h3>
        <p className="text-muted-foreground mb-2 text-xs leading-relaxed">
          {STAGGER_STEP * 1000}ms per child, capped at {STAGGER_MAX * 1000}ms — a twelve-item list
          finishes arriving before you have finished looking at the first one.
        </p>
        <StaggerDemo replay={replay} />
      </div>

      {/* ------------------------------------------------------------- press */}
      <div>
        <h3 className="mb-1 text-sm font-semibold">Press</h3>
        <p className="text-muted-foreground mb-2 text-xs leading-relaxed">
          Depth without a shadow. Press and hold the card.
        </p>
        <PressDemo />
      </div>
    </div>
  )
}

function DurationBar({ name, seconds, replay }: { name: string; seconds: number; replay: number }) {
  const reduced = useReducedMotion()
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground w-16 shrink-0 text-xs font-medium">{name}</span>
      <div className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
        <motion.div
          key={replay}
          className="bg-primary h-full rounded-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduced ? 0.01 : seconds, ease: [...EASE.out] }}
        />
      </div>
      <span className="text-muted-foreground tnum w-14 shrink-0 text-right text-xs">
        {Math.round(seconds * 1000)}ms
      </span>
    </div>
  )
}

function VariantDemo({
  label,
  note,
  variants,
  replay,
}: {
  label: string
  note: string
  variants: Parameters<typeof useMotionSafe>[0]
  replay: number
}) {
  const safe = useMotionSafe(variants)
  return (
    <div className="border-border rounded-xl border p-3">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-muted-foreground mb-2 text-xs leading-relaxed">{note}</p>
      <div className="bg-secondary/40 grid h-16 place-items-center rounded-lg">
        <motion.div
          key={replay}
          variants={safe}
          initial="hidden"
          animate="visible"
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-xs font-bold"
        >
          {label}
        </motion.div>
      </div>
    </div>
  )
}

function StaggerDemo({ replay }: { replay: number }) {
  const item = useMotionSafe(listItemVariants)
  return (
    <ul key={replay} className="grid grid-cols-6 gap-2">
      {Array.from({ length: 12 }, (_, index) => (
        <motion.li
          key={index}
          custom={index}
          variants={item}
          initial="hidden"
          animate="visible"
          className="bg-secondary text-muted-foreground grid h-10 place-items-center rounded-lg text-xs font-semibold"
        >
          {index + 1}
        </motion.li>
      ))}
    </ul>
  )
}

function PressDemo() {
  const press = useMotionSafe(pressVariants)
  const [tapped, setTapped] = useState(0)
  const pop = useMotionSafe(valuePopVariants)

  return (
    <div className="flex items-center gap-4">
      <motion.button
        type="button"
        variants={press}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={() => setTapped((n) => n + 1)}
        className={cn(
          'border-border bg-card focus-visible:ring-ring rounded-xl border px-5 py-4 text-sm font-semibold',
          'focus-visible:ring-2 focus-visible:outline-none',
        )}
      >
        Press me
      </motion.button>
      <div className="text-muted-foreground text-xs">
        Tapped{' '}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={tapped}
            variants={pop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-foreground tnum inline-block font-bold"
          >
            {tapped}
          </motion.span>
        </AnimatePresence>{' '}
        times
      </div>
    </div>
  )
}
