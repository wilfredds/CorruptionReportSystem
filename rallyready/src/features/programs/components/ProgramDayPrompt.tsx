import { Check, CalendarCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { useProgramState } from '../useProgramState'

interface ProgramDayPromptProps {
  /** Slug of the drill the finished session used, if it resolved to one. */
  drillSlug?: string | undefined
}

/**
 * Ticks off a program day from the session summary.
 *
 * Advancing has to be deliberate: a session can be logged from anywhere, and
 * the same summary can be reopened days later, so the plan only moves when the
 * player says it should. When the drill they just ran is the one the plan asked
 * for, the prompt says so outright; otherwise it offers the day as a choice.
 */
export function ProgramDayPrompt({ drillSlug }: ProgramDayPromptProps) {
  const { loading, enrollment, program, today, advance } = useProgramState()
  const [busy, setBusy] = useState(false)
  // Remembered rather than derived: advancing moves the plan on, and the next
  // day is often a rest day — or the end of the program — either of which would
  // otherwise make the confirmation vanish the instant it was earned.
  const [ticked, setTicked] = useState<{ name: string; slug: string } | null>(null)

  if (ticked) {
    return (
      <Card className="mb-5">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="bg-accent text-accent-foreground grid size-11 shrink-0 place-items-center rounded-xl">
            <CalendarCheck className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Day ticked off</p>
            <p className="text-muted-foreground truncate text-sm">{ticked.name}</p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to={`/programs/${ticked.slug}`}>Plan</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading || !enrollment || !program || !today || today.focus === 'rest') return null

  const planned = drillSlug !== undefined && today.drillSlugs.includes(drillSlug)
  const { name, slug } = program

  const markDone = async () => {
    setBusy(true)
    try {
      await advance()
      setTicked({ name, slug })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-primary/40 mb-5">
      <CardContent className="space-y-3 p-5">
        <div>
          <Badge variant="accent" className="mb-2">
            {planned ? 'That was today’s session' : 'Still on the plan today'}
          </Badge>
          <p className="font-semibold">{today.title}</p>
          <p className="text-muted-foreground text-sm">
            {program.name} · week {enrollment.currentWeek}, day {enrollment.currentDay}
          </p>
        </div>
        <Button
          className="w-full"
          variant={planned ? 'default' : 'outline'}
          onClick={() => void markDone()}
          disabled={busy}
        >
          <Check />
          {planned ? 'Mark it done' : 'Count this as today'}
        </Button>
      </CardContent>
    </Card>
  )
}
