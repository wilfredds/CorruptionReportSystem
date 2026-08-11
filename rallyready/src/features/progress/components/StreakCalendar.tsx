import type { WeeklyBucket } from '@/lib/data/stats'
import { cn, pluralize } from '@/lib/utils'

/**
 * Twelve weeks at a glance, one cell per week.
 *
 * Weekly rather than daily on purpose (§4 Phase 2): a daily grid punishes a
 * rest day, which is exactly the wrong signal for a training app. Missing a
 * Tuesday should cost nothing; missing a whole week should show.
 */

const INTENSITY = ['bg-muted', 'bg-primary/30', 'bg-primary/60', 'bg-primary'] as const

function intensity(sessions: number): string {
  if (sessions === 0) return INTENSITY[0]
  if (sessions === 1) return INTENSITY[1]
  if (sessions === 2) return INTENSITY[2]
  return INTENSITY[3]
}

export function StreakCalendar({ weeks }: { weeks: WeeklyBucket[] }) {
  return (
    <div>
      <ol className="flex items-end gap-1.5" aria-label="Training weeks">
        {weeks.map((week) => (
          <li key={week.weekIndex} className="min-w-0 flex-1">
            <div
              className={cn('h-10 w-full rounded-md transition-colors', intensity(week.sessions))}
              title={`Week of ${week.label}: ${pluralize(week.sessions, 'session')}`}
            >
              <span className="sr-only">
                Week of {week.label}: {pluralize(week.sessions, 'session')}
              </span>
            </div>
          </li>
        ))}
      </ol>

      {/* Two labels, not twelve: a cell is about 24px wide on a phone and
          "25 May" does not fit under one. */}
      <div className="text-muted-foreground mt-1.5 flex justify-between text-[0.625rem]">
        <span>{weeks[0]?.label}</span>
        <span>This week</span>
      </div>

      <div className="text-muted-foreground mt-2 flex items-center justify-end gap-1.5 text-[0.625rem]">
        <span>Fewer</span>
        {INTENSITY.map((className) => (
          <span key={className} className={cn('size-2.5 rounded-sm', className)} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
