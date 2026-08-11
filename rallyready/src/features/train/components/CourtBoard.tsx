import { useMemo } from 'react'

import {
  BASE_POSITION,
  CORNERS,
  cornerNumber,
  cornersForLayout,
  type CornerId,
  type CourtLayout,
} from '@/lib/timer/corners'
import { cn } from '@/lib/utils'

/**
 * The visual half-court.
 *
 * Proportions are the real thing — 5.18m wide by 6.70m from net to baseline —
 * so the zones sit where they sit on court and the mental map transfers.
 *
 * This is a *reinforcement* of the audio, never a replacement for it: the drill
 * has to be completable without looking at the screen at all (§1). What it adds
 * is a target that is unmistakable at a glance from across a room, and a base
 * marker that keeps nagging you to recover to the middle.
 */

// The viewBox is deliberately larger than the court: the countdown pip around
// a mid-court zone extends past the sideline, and would otherwise be clipped.
const VIEW_W = 108
const VIEW_H = 140

const PAD_X = 8
const PAD_Y = 8
const COURT_W = VIEW_W - PAD_X * 2
const COURT_H = VIEW_H - PAD_Y * 2

/** Real court measurements, as a fraction of the half-court drawn here. */
const SHORT_SERVICE_Y = PAD_Y + (1.98 / 6.7) * COURT_H
const LONG_SERVICE_Y = PAD_Y + COURT_H - (0.76 / 6.7) * COURT_H
const TRAMLINE_INSET = (0.46 / 5.18) * COURT_W

const toX = (x: number) => PAD_X + x * COURT_W
const toY = (y: number) => PAD_Y + y * COURT_H

const BASE_X = toX(BASE_POSITION.x)
const BASE_Y = toY(BASE_POSITION.y)

const ZONE_R = 8.5
const ZONE_R_ACTIVE = 14
const PIP_R = 18

export interface CourtBoardProps {
  layout: CourtLayout
  enabled: CornerId[]
  activeCorner: CornerId | null
  /** 0..1 through the current shot interval; drives the pip and base marker. */
  callProgress: number
  showNumbers: boolean
  /** Cool, quiet treatment while resting. */
  resting?: boolean
  reducedMotion?: boolean
  className?: string
}

/**
 * Where the player should be right now: out to the corner, then back to base.
 * Reinforces recovery rather than just showing the target.
 */
function playerPosition(
  corner: CornerId | null,
  progress: number,
  reducedMotion: boolean,
): { x: number; y: number } {
  if (!corner || reducedMotion) return { x: BASE_X, y: BASE_Y }
  const target = CORNERS[corner]
  const tx = toX(target.x)
  const ty = toY(target.y)

  // Out fast (0 → 0.4), hold briefly, recover (0.55 → 1).
  const travel =
    progress < 0.4
      ? easeOut(progress / 0.4)
      : progress < 0.55
        ? 1
        : 1 - easeInOut((progress - 0.55) / 0.45)

  return { x: BASE_X + (tx - BASE_X) * travel, y: BASE_Y + (ty - BASE_Y) * travel }
}

const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

export function CourtBoard({
  layout,
  enabled,
  activeCorner,
  callProgress,
  showNumbers,
  resting = false,
  reducedMotion = false,
  className,
}: CourtBoardProps) {
  const zones = useMemo(() => cornersForLayout(layout), [layout])
  const enabledSet = useMemo(() => new Set(enabled), [enabled])
  const player = playerPosition(activeCorner, callProgress, reducedMotion)

  const pipCircumference = 2 * Math.PI * PIP_R
  const activeDef = activeCorner ? CORNERS[activeCorner] : null

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={
        activeDef
          ? `Court board. Current target: ${activeDef.description}.`
          : resting
            ? 'Court board. Resting — no target.'
            : 'Court board. Waiting for the next call.'
      }
    >
      {/* Court surface */}
      <rect
        x={PAD_X}
        y={PAD_Y}
        width={COURT_W}
        height={COURT_H}
        rx="2"
        className="fill-court-surface stroke-court-line"
        strokeWidth="0.9"
      />

      {/* Markings: tramlines, service lines, centre line */}
      <g className="stroke-court-line" strokeWidth="0.6" fill="none" opacity="0.85">
        <line
          x1={PAD_X + TRAMLINE_INSET}
          y1={PAD_Y}
          x2={PAD_X + TRAMLINE_INSET}
          y2={PAD_Y + COURT_H}
        />
        <line
          x1={PAD_X + COURT_W - TRAMLINE_INSET}
          y1={PAD_Y}
          x2={PAD_X + COURT_W - TRAMLINE_INSET}
          y2={PAD_Y + COURT_H}
        />
        <line x1={PAD_X} y1={SHORT_SERVICE_Y} x2={PAD_X + COURT_W} y2={SHORT_SERVICE_Y} />
        <line x1={PAD_X} y1={LONG_SERVICE_Y} x2={PAD_X + COURT_W} y2={LONG_SERVICE_Y} />
        <line x1={toX(0.5)} y1={SHORT_SERVICE_Y} x2={toX(0.5)} y2={PAD_Y + COURT_H} />
      </g>

      {/* The net, along the top edge */}
      <line
        x1={PAD_X}
        y1={PAD_Y}
        x2={PAD_X + COURT_W}
        y2={PAD_Y}
        className="stroke-foreground"
        strokeWidth="1.6"
        strokeDasharray="1.4 1.1"
        opacity="0.55"
      />

      {/* Target zones */}
      {zones.map((zone) => {
        const isEnabled = enabledSet.has(zone.id)
        const isActive = zone.id === activeCorner
        const cx = toX(zone.x)
        const cy = toY(zone.y)

        return (
          <g key={zone.id}>
            <circle
              cx={cx}
              cy={cy}
              r={isActive ? ZONE_R_ACTIVE : ZONE_R}
              className={cn(
                'transition-[r,fill-opacity] duration-150',
                isActive
                  ? resting
                    ? 'fill-rest'
                    : 'fill-work'
                  : isEnabled
                    ? 'fill-foreground/10 stroke-foreground/25'
                    : 'fill-transparent stroke-foreground/10',
              )}
              strokeWidth="0.7"
              strokeDasharray={isEnabled ? undefined : '1.5 1.5'}
            />

            {/* Countdown pip: drains around the live target as its slot runs out. */}
            {isActive && (
              <circle
                cx={cx}
                cy={cy}
                r={PIP_R}
                fill="none"
                className={resting ? 'stroke-rest' : 'stroke-work'}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray={pipCircumference}
                strokeDashoffset={pipCircumference * Math.min(1, Math.max(0, callProgress))}
                transform={`rotate(-90 ${cx} ${cy})`}
                opacity="0.75"
              />
            )}
          </g>
        )
      })}

      {/* Base: the dashed home position, and the marker that returns to it */}
      <circle
        cx={BASE_X}
        cy={BASE_Y}
        r="5.5"
        fill="none"
        className="stroke-foreground/35"
        strokeWidth="0.7"
        strokeDasharray="1.6 1.4"
      />
      <circle
        cx={player.x}
        cy={player.y}
        r="3.2"
        className={cn(resting ? 'fill-rest' : 'fill-foreground', 'drop-shadow')}
        opacity="0.9"
      />

      {/* Zone numbers go last so the base marker can never sit on top of one. */}
      {showNumbers &&
        zones
          .filter((zone) => enabledSet.has(zone.id))
          .map((zone) => {
            const isActive = zone.id === activeCorner
            return (
              <text
                key={`${zone.id}-number`}
                x={toX(zone.x)}
                y={toY(zone.y)}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  'pointer-events-none font-bold',
                  isActive
                    ? resting
                      ? 'fill-rest-foreground'
                      : 'fill-work-foreground'
                    : 'fill-foreground/60',
                )}
                style={{ fontSize: isActive ? 13 : 8 }}
              >
                {cornerNumber(layout, zone.id)}
              </text>
            )
          })}
    </svg>
  )
}
