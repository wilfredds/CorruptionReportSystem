import { PHASE_STROKE, PHASE_TEXT } from '@/features/train/phaseStyles'
import type { BlockPhase } from '@/lib/timer/types'
import { cn } from '@/lib/utils'

/**
 * The largest thing on screen (§4): seconds left in the current interval,
 * wrapped in a thin ring that tracks progress through the whole session.
 */

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface TimerDialProps {
  /** Already formatted by the caller — "12", "7:35". */
  display: string
  /** 0..1 across the entire session. */
  overallProgress: number
  phase: BlockPhase
  phaseLabel: string
  detail?: string
  className?: string
}

export function TimerDial({
  display,
  overallProgress,
  phase,
  phaseLabel,
  detail,
  className,
}: TimerDialProps) {
  const clamped = Math.min(1, Math.max(0, overallProgress))

  return (
    <div className={cn('relative grid aspect-square w-full place-items-center', className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          className="stroke-foreground/10"
          strokeWidth="1.5"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          className={cn(PHASE_STROKE[phase], 'transition-[stroke] duration-300')}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        />
      </svg>

      <div className="flex flex-col items-center gap-1">
        <span
          className={cn(
            'text-xs font-bold tracking-[0.22em] uppercase transition-colors duration-300',
            PHASE_TEXT[phase],
          )}
        >
          {phaseLabel}
        </span>
        <span
          className={cn(
            'tnum leading-[0.85] font-extrabold tracking-tighter',
            // Durations like "7:35" need to step down a size to stay on one line.
            display.length > 3 ? 'text-[clamp(3rem,16vw,6.5rem)]' : 'text-[clamp(4rem,22vw,9rem)]',
          )}
          // Announced by the phase live region instead; a per-second update
          // would flood a screen reader.
          aria-hidden
        >
          {display}
        </span>
        {detail && <span className="text-muted-foreground text-sm font-medium">{detail}</span>}
      </div>
    </div>
  )
}
