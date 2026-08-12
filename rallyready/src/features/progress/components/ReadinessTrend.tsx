import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { readinessBand, readinessScore, type ReadinessBand } from '@/lib/data/readiness'
import type { ReadinessCheck } from '@/lib/data/types'
import { cn } from '@/lib/utils'

/**
 * How you have actually been feeling, as a strip.
 *
 * One check-in tells today's session what to do. A fortnight of them tells you
 * something the sessions cannot: a run of red bars alongside steady training is
 * the shape of someone digging a hole, and it shows up here weeks before it
 * shows up in the pace chart.
 */

const BAND_BAR: Record<ReadinessBand, string> = {
  low: 'bg-sprint',
  fair: 'bg-rest',
  good: 'bg-primary',
}

const SHOWN = 14

export function ReadinessTrend({ checks }: { checks: ReadinessCheck[] }) {
  // Arrives newest-first; a trend has to read left-to-right through time.
  const recent = [...checks]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-SHOWN)
    .map((check) => ({ check, score: readinessScore(check), band: readinessBand(check) }))

  const average = Math.round(recent.reduce((sum, day) => sum + day.score, 0) / recent.length)
  const lowDays = recent.filter((day) => day.band === 'low').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How you have been feeling</CardTitle>
        <CardDescription>
          Your last {recent.length} check-ins. Sleep, soreness and energy, averaged.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-20 items-end gap-1.5" role="img" aria-label={readAloud(recent)}>
          {recent.map((day) => (
            <div
              key={day.check.date}
              className="bg-secondary/60 flex h-full flex-1 items-end overflow-hidden rounded-md"
              title={`${day.check.date}: ${day.score}`}
            >
              <div
                className={cn('w-full rounded-md transition-[height]', BAND_BAR[day.band])}
                // A floor of 6%, so a zero-score day is still a visible mark
                // rather than a gap that reads as "no check-in".
                style={{ height: `${Math.max(6, day.score)}%` }}
              />
            </div>
          ))}
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Averaging {average} out of 100.{' '}
          {lowDays === 0
            ? 'No rough days in this stretch.'
            : `${lowDays} of these ${recent.length} days were rough — worth noticing if they are clustering.`}
        </p>
      </CardContent>
    </Card>
  )
}

function readAloud(days: { check: ReadinessCheck; score: number }[]): string {
  const first = days[0]?.check.date
  const last = days.at(-1)?.check.date
  return `Readiness from ${first} to ${last}, scored out of 100.`
}
