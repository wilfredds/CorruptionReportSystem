import { useEffect, useState } from 'react'

import type { FootFrame } from '@/lib/data/seed/exercises'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

/**
 * An animated footfall diagram for agility-ladder work.
 *
 * For ladder drills the *pattern* is the hard part — far harder than the
 * effort — and a diagram showing exactly where each foot lands is arguably
 * clearer than video, which you would have to scrub back and forth. It also
 * costs nothing offline.
 */

const CELLS = 4
const VIEW_W = 100
const VIEW_H = 150
const PAD = 10
const LADDER_W = 46
const CELL_H = (VIEW_H - PAD * 2) / CELLS

const MS_PER_FRAME = 620

/** Ladder-space (x: -1…1 across, y: cells along) into SVG coordinates. */
const toX = (x: number) => VIEW_W / 2 + x * (LADDER_W / 2 + 12)
/** Cell 0 is drawn at the bottom, so the pattern travels up the diagram. */
const toY = (y: number) => VIEW_H - PAD - y * CELL_H

interface LadderDemoProps {
  pattern: FootFrame[]
  className?: string
}

export function LadderDemo({ pattern, className }: LadderDemoProps) {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reducedMotion || pattern.length < 2) return
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % pattern.length),
      MS_PER_FRAME,
    )
    return () => window.clearInterval(timer)
  }, [pattern.length, reducedMotion])

  const frame = pattern[index] ?? pattern[0]
  if (!frame) return null

  // The wrap back to the first frame is a jump, not a glide — animating it
  // would show the feet sliding backwards down the ladder.
  const animate = !reducedMotion && index !== 0

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={`Footfall pattern, step ${index + 1} of ${pattern.length}`}
    >
      <rect
        x={VIEW_W / 2 - LADDER_W / 2}
        y={PAD}
        width={LADDER_W}
        height={VIEW_H - PAD * 2}
        rx="2"
        className="fill-court-surface stroke-court-line"
        strokeWidth="1.2"
      />
      {Array.from({ length: CELLS - 1 }, (_, i) => (
        <line
          key={i}
          x1={VIEW_W / 2 - LADDER_W / 2}
          y1={PAD + (i + 1) * CELL_H}
          x2={VIEW_W / 2 + LADDER_W / 2}
          y2={PAD + (i + 1) * CELL_H}
          className="stroke-court-line"
          strokeWidth="1.2"
        />
      ))}

      {(['left', 'right'] as const).map((side) => {
        const foot = frame[side]
        return (
          <g
            key={side}
            style={{
              transform: `translate(${toX(foot.x)}px, ${toY(foot.y)}px)`,
              transition: animate ? `transform ${MS_PER_FRAME * 0.55}ms ease-out` : 'none',
            }}
          >
            <ellipse
              rx={foot.lifted ? 4 : 5.5}
              ry={foot.lifted ? 6 : 8}
              className={side === 'left' ? 'fill-primary' : 'fill-rest'}
              opacity={foot.lifted ? 0.35 : 1}
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-background font-bold"
              style={{ fontSize: 7 }}
              opacity={foot.lifted ? 0.5 : 1}
            >
              {side === 'left' ? 'L' : 'R'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
