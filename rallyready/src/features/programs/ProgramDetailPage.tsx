import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Home, MapPin, Pencil, Play, Share2, Trophy, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRepositories } from '@/lib/data/context'
import { PHASE_BLURB, PHASE_LABEL, phaseByWeek } from '@/lib/programs/periodise'
import { cn, pluralize } from '@/lib/utils'

import { LEVEL_LABEL } from '../train/drillLabels'
import { DayRow } from './components/DayRow'
import { useProgramState } from './useProgramState'

export function ProgramDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const repositories = useRepositories()
  const queryClient = useQueryClient()
  const state = useProgramState()

  const [openWeek, setOpenWeek] = useState<number | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const { data: program, isLoading } = useQuery({
    queryKey: ['program', slug],
    queryFn: () => repositories.programs.getBySlug(slug),
  })

  const { data: days = [] } = useQuery({
    queryKey: ['program-days', program?.id],
    queryFn: () => repositories.programs.listDays(program?.id ?? ''),
    enabled: Boolean(program),
  })

  const { data: drills = [] } = useQuery({
    queryKey: ['drills'],
    queryFn: () => repositories.drills.list(),
  })

  const { data: enrollments = [] } = useQuery({
    queryKey: ['program-enrollments'],
    queryFn: () => repositories.programs.listEnrollments(),
  })

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading program…</p>

  if (!program) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Program not found</h1>
        <Button asChild>
          <Link to="/programs">Back to Programs</Link>
        </Button>
      </div>
    )
  }

  const enrolled =
    state.enrollment?.programId === program.id && state.enrollment.status === 'active'
  // Finishing twelve weeks of anything deserves more than the button quietly
  // reverting to "Start this program".
  const finished = enrollments.some(
    (entry) => entry.programId === program.id && entry.status === 'completed',
  )
  const phases = phaseByWeek(program.totalWeeks)
  const currentWeek = enrolled ? state.enrollment?.currentWeek : undefined
  const expanded = openWeek ?? currentWeek ?? 1

  const enroll = async () => {
    setBusy(true)
    try {
      await repositories.programs.enroll(program.id)
      await queryClient.invalidateQueries({ queryKey: ['program-enrollment'] })
      await queryClient.invalidateQueries({ queryKey: ['program-enrollments'] })
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    await repositories.programs.update(program.id, { isPublic: !program.isPublic })
    await queryClient.invalidateQueries({ queryKey: ['program', slug] })
    await queryClient.invalidateQueries({ queryKey: ['programs'] })
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
        <Link to="/programs">
          <ArrowLeft />
          Programs
        </Link>
      </Button>

      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight text-balance">{program.name}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{program.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{pluralize(program.totalWeeks, 'week')}</Badge>
          <Badge variant="outline">{LEVEL_LABEL[program.level]}</Badge>
          <Badge variant="outline">{pluralize(program.sessionsPerWeek, 'session')} a week</Badge>
          <Badge variant="outline">
            {program.location === 'anywhere' ? (
              <>
                <Home className="size-3" aria-hidden />
                No court
              </>
            ) : (
              <>
                <MapPin className="size-3" aria-hidden />
                Court
              </>
            )}
          </Badge>
        </div>
      </div>

      {enrolled && state.enrollment ? (
        <Card level="lead" className="mb-5">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold">
                Week {state.enrollment.currentWeek}, day {state.enrollment.currentDay}
              </p>
              <span className="text-muted-foreground tnum text-sm">
                {Math.round(state.progress * 100)}%
              </span>
            </div>
            <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.round(state.progress * 100)}%` }}
              />
            </div>
            {state.today && (
              <p className="text-muted-foreground text-sm">
                Today: <span className="text-foreground font-medium">{state.today.title}</span>
              </p>
            )}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => void state.advance()} disabled={busy}>
                <Check />
                {state.today?.focus === 'rest' ? 'Rested — next day' : 'Mark done'}
              </Button>
              <Button variant="outline" onClick={() => setLeaveOpen(true)}>
                <X />
                Leave
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {finished && (
            <Card level="lead" className="mb-4">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="bg-accent text-accent-foreground grid size-11 shrink-0 place-items-center rounded-xl">
                  <Trophy className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">You finished this program</p>
                  <p className="text-muted-foreground text-sm">
                    All {pluralize(program.totalWeeks, 'week')} of it. Run it again, or move up a
                    level.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          <Button size="xl" className="mb-5 w-full" onClick={() => void enroll()} disabled={busy}>
            <Play className="fill-current" />
            {state.enrollment && state.enrollment.status === 'active'
              ? 'Switch to this program'
              : finished
                ? 'Start it again'
                : 'Start this program'}
          </Button>
        </>
      )}

      {program.createdBy !== null && (
        <div className="mb-5 flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/programs/${program.slug}/edit`}>
              <Pencil />
              Edit
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => void publish()}>
            <Share2 />
            {program.isPublic ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      )}

      <section aria-label="The plan" className="space-y-2">
        {Array.from({ length: program.totalWeeks }, (_, index) => index + 1).map((weekNo) => {
          const phase = phases[weekNo - 1] ?? 'base'
          const weekDays = days.filter((day) => day.weekNo === weekNo)
          const isOpen = expanded === weekNo
          const sessions = weekDays.filter((day) => day.focus !== 'rest').length

          return (
            <Card key={weekNo} className={cn(currentWeek === weekNo && 'border-primary/50')}>
              <button
                type="button"
                onClick={() => setOpenWeek(isOpen ? -1 : weekNo)}
                aria-expanded={isOpen}
                className="focus-visible:ring-ring w-full rounded-xl text-left focus-visible:ring-2 focus-visible:outline-none"
              >
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      Week {weekNo}
                      <Badge variant={phase === 'deload' ? 'rest' : 'outline'}>
                        {PHASE_LABEL[phase]}
                      </Badge>
                      {currentWeek === weekNo && <Badge variant="accent">Now</Badge>}
                    </CardTitle>
                    <CardDescription>{pluralize(sessions, 'session')}</CardDescription>
                  </div>
                </CardHeader>
              </button>

              {isOpen && (
                <CardContent>
                  <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                    {PHASE_BLURB[phase]}
                  </p>
                  <ul className="divide-border divide-y">
                    {weekDays.map((day) => (
                      <DayRow
                        key={day.id}
                        day={day}
                        drills={drills}
                        current={
                          enrolled &&
                          day.weekNo === state.enrollment?.currentWeek &&
                          day.dayNo === state.enrollment?.currentDay
                        }
                        done={
                          enrolled &&
                          (day.weekNo < (state.enrollment?.currentWeek ?? 1) ||
                            (day.weekNo === state.enrollment?.currentWeek &&
                              day.dayNo < state.enrollment.currentDay))
                        }
                        {...(enrolled
                          ? { onJump: () => void state.goTo(day.weekNo, day.dayNo) }
                          : {})}
                      />
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )
        })}
      </section>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this program?</DialogTitle>
            <DialogDescription>
              Your logged sessions stay exactly where they are — this only stops the plan tracking
              your position. You can start it again from week one whenever you like.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLeaveOpen(false)}>
              Keep going
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setLeaveOpen(false)
                void state.abandon().then(() => navigate('/programs'))
              }}
            >
              Leave the program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
