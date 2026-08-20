import { useMemo } from 'react'

import { PHASE_FILL, PHASE_NAME } from '@/features/train/phaseStyles'
import { planFromConfig, type DrillConfig } from '@/lib/timer/plan'
import { buildTimeline } from '@/lib/timer/timeline'
import type { BlockPhase } from '@/lib/timer/types'
import { formatCompactDuration } from '@/lib/utils'

/**
 * The session you are about to do, drawn to scale.
 *
 * Two jobs. The first is honest: "8 min" tells you nothing about whether that
 * is eight minutes of work or four minutes of work and four of standing still,
 * and the strip answers that before you commit to it.
 *
 * The second is that the runner's whole language is colour — the ring, the
 * board and the background wash all change hue when the phase does — and until
 * now you met that language for the first time while already moving. Here it is
 * labelled, still, and in the same colours, on the screen right before.
 *
 * Built from the real timeline rather than from an approximation of it, so what
 * you are shown and what you get cannot drift apart. The seed is fixed because
 * the shape does not depend on which corners come up.
 */

/** The shape is the same whichever corners the sequencer picks. */
const PREVIEW = { splitStepLeadMs: 400, seed: 1 }

export function SessionShape({ config }: { config: DrillConfig }) {
  const { segments, present, totalMs } = useMemo(() => {
    const timeline = buildTimeline(planFromConfig(config, PREVIEW))
    const seen: BlockPhase[] = []
    for (const block of timeline.blocks) {
      // `prepare` is three seconds of countdown, not a part of the session.
      if (block.phase !== 'prepare' && !seen.includes(block.phase)) seen.push(block.phase)
    }
    return {
      segments: timeline.blocks.map((block) => ({
        phase: block.phase,
        durationMs: block.durationMs,
        label: block.label,
      })),
      present: seen,
      totalMs: timeline.totalMs,
    }
  }, [config])

  if (segments.length === 0) return null

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="type-eyebrow text-muted-foreground">Session shape</p>
        <p className="tnum text-muted-foreground type-meta">
          {formatCompactDuration(Math.round(totalMs / 1000))}
        </p>
      </div>

      <div className="bg-secondary flex h-3 w-full gap-px overflow-hidden rounded-full">
        {segments.map((segment, index) => (
          <span
            key={index}
            className={PHASE_FILL[segment.phase]}
            // Grow by duration so the bar is proportional at any width. A
            // minimum keeps a five-second rest from vanishing entirely.
            style={{ flexGrow: segment.durationMs, minWidth: 2 }}
            title={`${PHASE_NAME[segment.phase]} · ${segment.label}`}
          />
        ))}
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {present.map((phase) => (
          <li key={phase} className="text-muted-foreground type-meta flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${PHASE_FILL[phase]}`} aria-hidden />
            {PHASE_NAME[phase]}
          </li>
        ))}
      </ul>
    </div>
  )
}
