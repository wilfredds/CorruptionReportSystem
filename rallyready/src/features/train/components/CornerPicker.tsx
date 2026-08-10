import {
  cornerNumber,
  cornersForLayout,
  type CornerId,
  type CourtLayout,
} from '@/lib/timer/corners'
import { cn } from '@/lib/utils'

/**
 * Tap zones on and off, and (in weighted mode) dial how often each one comes
 * up. Picking corners on a picture of a court beats a list of checkboxes —
 * "my backhand rear is weak" maps straight onto a place, not a label.
 */

const VIEW_W = 100
const VIEW_H = 132
const PAD = 4
const COURT_W = VIEW_W - PAD * 2
const COURT_H = VIEW_H - PAD * 2

const toX = (x: number) => PAD + x * COURT_W
const toY = (y: number) => PAD + y * COURT_H

interface CornerPickerProps {
  layout: CourtLayout
  enabled: CornerId[]
  weights: Partial<Record<CornerId, number>>
  showWeights: boolean
  onToggle: (corner: CornerId) => void
  onCycleWeight: (corner: CornerId) => void
}

export function CornerPicker({
  layout,
  enabled,
  weights,
  showWeights,
  onToggle,
  onCycleWeight,
}: CornerPickerProps) {
  const zones = cornersForLayout(layout)
  const enabledSet = new Set(enabled)

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full" role="group">
      <rect
        x={PAD}
        y={PAD}
        width={COURT_W}
        height={COURT_H}
        rx="2"
        className="fill-court-surface stroke-court-line"
        strokeWidth="0.8"
      />
      <line
        x1={PAD}
        y1={PAD}
        x2={PAD + COURT_W}
        y2={PAD}
        className="stroke-foreground/40"
        strokeWidth="1.4"
        strokeDasharray="1.4 1.1"
      />
      <circle
        cx={toX(0.5)}
        cy={toY(0.56)}
        r="4.5"
        fill="none"
        className="stroke-foreground/30"
        strokeWidth="0.6"
        strokeDasharray="1.4 1.2"
      />

      {zones.map((zone) => {
        const on = enabledSet.has(zone.id)
        const weight = weights[zone.id] ?? 1
        const cx = toX(zone.x)
        const cy = toY(zone.y)

        return (
          <g key={zone.id}>
            <circle
              cx={cx}
              cy={cy}
              r="11"
              className={cn(
                'cursor-pointer transition-colors',
                on ? 'fill-primary/85 stroke-primary' : 'fill-transparent stroke-foreground/25',
              )}
              strokeWidth="0.9"
              strokeDasharray={on ? undefined : '1.6 1.4'}
              onClick={() => (showWeights && on ? onCycleWeight(zone.id) : onToggle(zone.id))}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={
                showWeights && on
                  ? `${zone.description}. Weight ${weight}. Tap to change how often it is called.`
                  : `${zone.description}. ${on ? 'Enabled' : 'Disabled'}. Tap to toggle.`
              }
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                if (showWeights && on) onCycleWeight(zone.id)
                else onToggle(zone.id)
              }}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              className={cn(
                'pointer-events-none font-bold',
                on ? 'fill-primary-foreground' : 'fill-foreground/40',
              )}
              style={{ fontSize: 8 }}
            >
              {showWeights && on ? `×${weight}` : cornerNumber(layout, zone.id)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
