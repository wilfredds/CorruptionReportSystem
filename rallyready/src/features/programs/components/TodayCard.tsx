import { useQuery } from '@tanstack/react-query'
import { Check, CalendarRange, Coffee, Play } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRepositories } from '@/lib/data/context'

import { useProgramState } from '../useProgramState'

/**
 * Today's session, on the home screen.
 *
 * A plan nobody can see is a plan nobody follows, so the enrolment's current
 * day gets the first card on Train — one tap from the drill it asks for.
 * Renders nothing at all when no program is running.
 */
export function TodayCard() {
  const repositories = useRepositories()
  const { loading, enrollment, program, today, progress, advance } = useProgramState()
  const [busy, setBusy] = useState(false)

  const { data: drills = [] } = useQuery({
    queryKey: ['drills'],
    queryFn: () => repositories.drills.list(),
  })

  if (loading || !enrollment || !program || !today) return null

  const drill = today.drillSlugs
    .map((slug) => drills.find((candidate) => candidate.slug === slug))
    .find((candidate) => candidate !== undefined)
  const resting = today.focus === 'rest'

  const markDone = async () => {
    setBusy(true)
    try {
      await advance()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-primary/40 from-accent/60 mb-6 bg-gradient-to-br to-transparent">
      <CardContent className="space-y-4 p-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="accent">
              <CalendarRange className="size-3" aria-hidden />
              Today
            </Badge>
            <Badge variant="outline">
              Week {enrollment.currentWeek} · day {enrollment.currentDay}
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-balance">{today.title}</h2>
          {/* The drill is named here rather than inside the button: a button
              wide enough to hold "Start Four-Corner Footwork" does not fit a
              phone next to a second action. */}
          <p className="mt-1 text-sm font-medium">{drill?.name ?? program.name}</p>
          {today.notes && (
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{today.notes}</p>
          )}
        </div>

        <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <div className="flex gap-2">
          {resting ? (
            <Button className="flex-1" onClick={() => void markDone()} disabled={busy}>
              <Coffee />
              Rested — next day
            </Button>
          ) : drill ? (
            <Button asChild size="lg" className="flex-1">
              <Link to={`/run/${drill.slug}`} aria-label={`Start ${drill.name}`}>
                <Play className="fill-current" />
                Start
              </Link>
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => void markDone()} disabled={busy}>
              <Check />
              Mark done
            </Button>
          )}
          <Button asChild variant="outline" size={resting ? 'default' : 'lg'} className="shrink-0">
            <Link to={`/programs/${program.slug}`} aria-label="Open the full plan">
              Plan
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
