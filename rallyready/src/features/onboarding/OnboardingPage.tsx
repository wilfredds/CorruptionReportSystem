import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Play, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  pageVariants,
  stepVariants as rawStepVariants,
  useInitialSafe,
  useMotionSafe,
} from '@/lib/motion'
import { useAuth } from '@/lib/auth/context'
import { useRepositories } from '@/lib/data/context'
import { resolveRecommendation } from '@/lib/data/recommend'
import type { Discipline, DrillLocation, SkillLevel, TrainingGoal } from '@/lib/data/types'
import { estimateDurationSec, configFromDrill } from '@/lib/timer/plan'
import { cn, formatCompactDuration } from '@/lib/utils'

/**
 * Two minutes, four questions, then straight into a drill chosen for the
 * answers — plus a badge for finishing. Early wins are what turn a first visit
 * into a second one (§4 Phase 2). The last question, court access, is what
 * lets Phase 4 hand out a program that fits where you actually train.
 */

interface Choice<T extends string> {
  value: T
  label: string
  detail: string
}

const LEVELS: Choice<SkillLevel>[] = [
  {
    value: 'beginner',
    label: 'Getting back into it',
    detail: 'Off court for a while, or fairly new. Rebuilding from the base up.',
  },
  {
    value: 'intermediate',
    label: 'Club player',
    detail: 'Playing regularly. Comfortable with the shots, short of the fitness.',
  },
  {
    value: 'advanced',
    label: 'Competitive',
    detail: 'League or tournament. Chasing sharpness rather than basics.',
  },
]

const DISCIPLINES: Choice<Discipline>[] = [
  { value: 'singles', label: 'Singles', detail: 'Court coverage and endurance carry the game.' },
  { value: 'doubles', label: 'Doubles', detail: 'Fast hands, flat exchanges, front-court speed.' },
  { value: 'both', label: 'Both', detail: 'A bit of everything.' },
]

const GOALS: Choice<TrainingGoal>[] = [
  { value: 'stamina', label: 'Rebuild my stamina', detail: 'Last a full match without fading.' },
  {
    value: 'footwork',
    label: 'Sharpen my footwork',
    detail: 'Get to the shuttle earlier, in balance.',
  },
  {
    value: 'match-ready',
    label: 'Get match-ready',
    detail: 'Train the rhythm a real game demands.',
  },
  {
    value: 'consistency',
    label: 'Train consistently',
    detail: 'Build the habit before the intensity.',
  },
]

const COURT_ACCESS: Choice<DrillLocation>[] = [
  {
    value: 'court',
    label: 'I can get on a court',
    detail: 'Regular hall or club access. Programs will use the full court.',
  },
  {
    value: 'anywhere',
    label: 'Mostly at home',
    detail: 'A garage, a hallway, a patch of grass. Programs will need no court.',
  },
]

type Step = 0 | 1 | 2 | 3 | 4

export function OnboardingPage() {
  const navigate = useNavigate()
  const repositories = useRepositories()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const variants = useMotionSafe(pageVariants)
  const stepVariants = useMotionSafe(rawStepVariants)
  const initial = useInitialSafe('hidden')

  const [step, setStep] = useState<Step>(0)
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null)
  const [primaryDiscipline, setPrimaryDiscipline] = useState<Discipline | null>(null)
  const [goal, setGoal] = useState<TrainingGoal | null>(null)
  const [courtAccess, setCourtAccess] = useState<DrillLocation | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: drills = [] } = useQuery({
    queryKey: ['drills'],
    queryFn: () => repositories.drills.list(),
  })

  const finish = async (chosenAccess: DrillLocation) => {
    setCourtAccess(chosenAccess)
    setSaving(true)
    try {
      await repositories.profiles.save({
        displayName: auth.user?.displayName ?? 'Player',
        avatarUrl: auth.user?.avatarUrl ?? null,
        skillLevel: skillLevel ?? 'intermediate',
        primaryDiscipline: primaryDiscipline ?? 'both',
        goal: goal ?? 'footwork',
        courtAccess: chosenAccess,
      })
      await repositories.badges.award(['getting-started'])
      await queryClient.invalidateQueries()
    } catch {
      // Storage refused. The answers are still in component state, so the
      // recommendation below is unaffected — only persistence is lost.
    }
    setSaving(false)
    setStep(4)
  }

  const recommendation =
    step === 4 && drills.length > 0
      ? resolveRecommendation(
          {
            skillLevel: skillLevel ?? 'intermediate',
            primaryDiscipline: primaryDiscipline ?? 'both',
            goal: goal ?? 'footwork',
          },
          drills,
        )
      : null

  // Steps slide sideways rather than up, so the questionnaire reads as moving
  // forward through a sequence rather than as four unrelated screens.
  const stepMotion = {
    variants: stepVariants,
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
  } as const

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center justify-between gap-3">
        {step === 0 ? (
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link to="/">
              <ArrowLeft />
              Skip for now
            </Link>
          </Button>
        ) : step < 4 ? (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => setStep((current) => Math.max(0, current - 1) as Step)}
          >
            <ArrowLeft />
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < 4 && (
          <span className="text-muted-foreground tnum text-xs font-medium">
            Step {step + 1} of 4
          </span>
        )}
      </div>

      {step < 4 && (
        <div className="bg-secondary mb-7 h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 && (
          <motion.div key="level" {...stepMotion}>
            <Question
              title="Where are you right now?"
              subtitle="This sets the pace of your first session. You can change it any time."
              choices={LEVELS}
              selected={skillLevel}
              onSelect={(value) => {
                setSkillLevel(value)
                setStep(1)
              }}
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="discipline" {...stepMotion}>
            <Question
              title="What do you mostly play?"
              subtitle="Singles and doubles ask for different movement."
              choices={DISCIPLINES}
              selected={primaryDiscipline}
              onSelect={(value) => {
                setPrimaryDiscipline(value)
                setStep(2)
              }}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="goal" {...stepMotion}>
            <Question
              title="What are you training for?"
              subtitle="Pick the one that matters most this month."
              choices={GOALS}
              selected={goal}
              onSelect={(value) => {
                setGoal(value)
                setStep(3)
              }}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="court" {...stepMotion}>
            <Question
              title="Where will you train?"
              subtitle="Programs adapt to this — a no-court plan uses nothing but floor space."
              choices={COURT_ACCESS}
              selected={courtAccess}
              onSelect={(value) => void finish(value)}
              busy={saving}
            />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="done" variants={variants} initial={initial} animate="visible">
            <div className="mb-6 text-center">
              <div className="bg-accent text-accent-foreground mx-auto mb-4 grid size-16 place-items-center rounded-2xl">
                <Sparkles className="size-8" aria-hidden />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">You&rsquo;re set up</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Badge unlocked: <span className="text-foreground font-medium">Getting Started</span>
              </p>
            </div>

            {recommendation ? (
              <Card className="border-primary/40 from-accent/60 overflow-hidden bg-gradient-to-br to-transparent">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <Badge variant="accent" className="mb-2">
                      Your first drill
                    </Badge>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {recommendation.drill.name}
                    </h2>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {recommendation.reason}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{recommendation.drill.corners} zones</Badge>
                    <Badge variant="outline">
                      {formatCompactDuration(
                        estimateDurationSec(configFromDrill(recommendation.drill)),
                      )}
                    </Badge>
                  </div>
                  <Button
                    size="xl"
                    className="w-full"
                    onClick={() => navigate(`/run/${recommendation.drill.slug}`)}
                  >
                    <Play className="fill-current" />
                    Start my first drill
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <p className="text-muted-foreground text-center text-sm">Loading your drill…</p>
            )}

            <Button asChild variant="ghost" className="mt-4 w-full">
              <Link to="/">Browse all drills instead</Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Question<T extends string>({
  title,
  subtitle,
  choices,
  selected,
  onSelect,
  busy,
}: {
  title: string
  subtitle: string
  choices: Choice<T>[]
  selected: T | null
  onSelect: (value: T) => void
  busy?: boolean
}) {
  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight text-balance">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{subtitle}</p>
      <div role="radiogroup" aria-label={title} className="mt-5 space-y-2.5">
        {choices.map((choice) => {
          const isSelected = choice.value === selected
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={busy}
              onClick={() => onSelect(choice.value)}
              className={cn(
                'focus-visible:ring-ring flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60',
                isSelected
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border hover:bg-secondary/60',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2',
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                )}
              >
                {isSelected && <Check className="text-primary-foreground size-3" aria-hidden />}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{choice.label}</span>
                <span
                  className={cn(
                    'mt-0.5 block text-sm leading-relaxed',
                    isSelected ? 'opacity-80' : 'text-muted-foreground',
                  )}
                >
                  {choice.detail}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
