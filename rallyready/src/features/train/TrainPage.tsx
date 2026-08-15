import { useQuery } from '@tanstack/react-query'
import { Flame, GraduationCap, Home, Play, SlidersHorizontal, Sparkles, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { useRepositories } from '@/lib/data/context'
import { resolveRecommendation } from '@/lib/data/recommend'
import { isConditioning, isPrepOrRecovery } from '@/lib/data/seed/drills'
import type { Drill, SkillLevel } from '@/lib/data/types'
import { buildLibrary } from '@/lib/library/entries'
import { configFromDrill, estimateDurationSec } from '@/lib/timer/plan'
import { formatCompactDuration, pluralize } from '@/lib/utils'
import { useDrillConfigStore } from '@/store/drillConfigStore'
import { useUiStore } from '@/store/uiStore'

import { TodayCard } from '../programs/components/TodayCard'
import { CueSettingsDialog } from './components/CueSettingsDialog'
import { DrillCard } from './components/DrillCard'
import { FocusGrid } from './components/FocusGrid'
import { ReadinessCard } from './components/ReadinessCard'
import { WarmUpBar } from './components/WarmUpBar'
import { CATEGORY_LABEL, LEVEL_LABEL } from './drillLabels'

type Tab = 'drills' | 'conditioning'

export function TrainPage() {
  const repositories = useRepositories()
  const overrides = useDrillConfigStore((state) => state.overrides)
  const setupDismissed = useUiStore((state) => state.setupPromptDismissed)
  const dismissSetup = useUiStore((state) => state.dismissSetupPrompt)
  const storedLevel = useUiStore((state) => state.browseLevel)
  const [tab, setTab] = useState<Tab>('drills')
  const [homeOnly, setHomeOnly] = useState(false)

  const { data: drills = [], isLoading } = useQuery({
    queryKey: ['drills'],
    queryFn: () => repositories.drills.list(),
  })

  const { data: streak } = useQuery({
    queryKey: ['streak'],
    queryFn: () => repositories.streaks.get(),
  })

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => repositories.profiles.get(),
  })

  const { data: recent = [], isLoading: historyLoading } = useQuery({
    queryKey: ['sessions', 'any'],
    queryFn: () => repositories.sessions.listRecent(1),
  })

  // With a profile the headline drill is chosen for this player; without one it
  // is simply the first in the catalogue.
  const recommendation = profile ? resolveRecommendation(profile, drills) : null
  const featured = recommendation?.drill ?? drills[0]

  // Warm-ups and cool-downs are reached from the bar below the hero, not from
  // the catalogue — they are not something you pick instead of training.
  const trainable = drills.filter((drill) => !isPrepOrRecovery(drill))
  const inTab = trainable.filter((drill) =>
    tab === 'conditioning' ? isConditioning(drill) : !isConditioning(drill),
  )
  const visible = inTab
    .filter((drill) => !homeOnly || drill.location === 'anywhere')
    .filter((drill) => drill.slug !== featured?.slug)

  const configFor = (drill: Drill) => overrides[drill.slug] ?? configFromDrill(drill)

  const library = buildLibrary(drills)
  const browseLevel: SkillLevel = storedLevel ?? profile?.skillLevel ?? 'beginner'
  // Nothing set up and nothing trained: a real first visit, not a returning
  // player who skipped the questionnaire.
  const isNewHere = !profileLoading && !profile && !historyLoading && recent.length === 0

  return (
    <>
      <PageHeader
        title="Train"
        description="Pick a drill and go. Every call is spoken, so you never need to look at the screen."
        action={<CueSettingsDialog />}
      />

      {streak && streak.currentStreak > 0 && (
        <div className="text-muted-foreground mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link
            to="/progress"
            className="text-foreground inline-flex items-center gap-1.5 font-medium hover:underline"
          >
            <Flame className="text-primary size-4" aria-hidden />
            {pluralize(streak.currentStreak, 'week')} in a row
          </Link>
          <span>
            {streak.weeklySessionsCount === 0
              ? 'Nothing logged this week yet'
              : `${pluralize(streak.weeklySessionsCount, 'session')} this week`}
          </span>
        </div>
      )}

      {/*
       * A genuine first visit gets an introduction rather than a catalogue.
       *
       * Someone opening this for the first time does not need a readiness
       * check or a training-load chart; they need to know what the app is for
       * and where to put their first tap. Shown only when there is no profile
       * *and* nothing logged — the moment there is either, it is in the way.
       */}
      {isNewHere && (
        <Card className="border-primary/40 from-accent/60 mb-6 bg-gradient-to-br to-transparent">
          <CardContent className="p-5">
            <div className="mb-3 flex items-start gap-3">
              <span className="bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center rounded-xl">
                <GraduationCap className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-tight">Welcome to RallyReady</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  A coach for training on your own. It calls the corners out loud so you never watch
                  the screen, warms you up, tracks what it costs you, and tells you when to back
                  off.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
              <span className="text-foreground font-medium">Never played before?</span> Start with
              the basics — how to hold the racket, how to stand, and the shots everything else is
              built on.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="flex-1">
                <Link to="/focus/fundamentals">Learn the basics</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to="/onboarding">I have played before</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* First on the screen because it is the first decision of the session:
          everything below reads differently once the app knows how you feel. */}
      {!isNewHere && <ReadinessCard />}

      <TodayCard />

      {isLoading && <p className="text-muted-foreground text-sm">Loading drills…</p>}

      {/* Withheld on a first visit. "Start here: Six-Corner Shadow,
          Intermediate" sitting directly under "never played before, start with
          the basics" is two pieces of advice contradicting each other, and it
          puts a second accent-gradient card immediately below the first. */}
      {featured && !isNewHere && (
        <Card className="border-primary/40 from-accent/60 mb-6 overflow-hidden bg-gradient-to-br to-transparent">
          <CardContent className="flex flex-col gap-4 p-5">
            <div>
              <Badge variant="accent" className="mb-2">
                <Zap className="size-3" aria-hidden />
                {recommendation ? 'Picked for you' : 'Start here'}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-balance">{featured.name}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {recommendation?.reason ?? featured.description}
              </p>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{CATEGORY_LABEL[featured.category]}</Badge>
              <Badge variant="outline">
                {featured.circuit
                  ? pluralize(featured.circuit.length, 'exercise')
                  : `${featured.corners} zones`}
              </Badge>
              <Badge variant="outline">
                {formatCompactDuration(estimateDurationSec(configFor(featured)))}
              </Badge>
              <Badge variant="outline">{LEVEL_LABEL[featured.level]}</Badge>
            </div>
            <div className="flex gap-2">
              <Button asChild size="lg" className="flex-1">
                <Link to={`/run/${featured.slug}`}>
                  <Play className="fill-current" />
                  Start
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={`/train/${featured.slug}`} aria-label={`Adjust ${featured.name}`}>
                  <SlidersHorizontal />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Directly under the drill you are about to do, because that is the
          moment the advice is relevant. */}
      <WarmUpBar />

      {/* Below the drill it is offering to improve, and dismissible. Above it,
          an unclosable prompt outranked the content it was advertising. */}
      {!profileLoading && !profile && !setupDismissed && !isNewHere && (
        <div className="border-border mb-8 flex items-center gap-3 rounded-xl border border-dashed p-3">
          <Sparkles className="text-primary size-4 shrink-0" aria-hidden />
          <p className="text-muted-foreground min-w-0 flex-1 text-xs leading-relaxed">
            <span className="text-foreground font-medium">Get drills picked for you.</span> Four
            questions, under two minutes.
          </p>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to="/onboarding">Set up</Link>
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="shrink-0"
            onClick={dismissSetup}
            title="Dismiss"
          >
            <X />
            <span className="sr-only">Dismiss this prompt</span>
          </Button>
        </div>
      )}

      {/*
       * Goals rather than a catalogue.
       *
       * A flat list of twelve drills only helps someone who already knows which
       * one fixes their problem — which is nobody new. A player does know what
       * they want to be better at, so the app asks that and does the mapping.
       */}
      <section aria-labelledby="focus" className="mb-8">
        <h2 id="focus" className="mb-1 text-lg font-semibold tracking-tight">
          What do you want to work on?
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Pick one and the app shows you what trains it, at your level.
        </p>
        <FocusGrid entries={library} level={browseLevel} />
      </section>

      <section aria-labelledby="catalogue">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="catalogue" className="text-lg font-semibold tracking-tight">
              Or browse everything
            </h2>
            <p className="text-muted-foreground text-xs">
              {tab === 'drills'
                ? 'Corner-calling footwork, called out loud.'
                : 'Intervals and circuits. Most need no court at all.'}
            </p>
          </div>
          <Button
            variant={homeOnly ? 'default' : 'outline'}
            size="sm"
            className="shrink-0"
            onClick={() => setHomeOnly((current) => !current)}
            aria-pressed={homeOnly}
          >
            <Home />
            No court
          </Button>
        </div>

        <Segmented
          label="Workout type"
          value={tab}
          options={[
            { value: 'drills', label: 'Drills' },
            { value: 'conditioning', label: 'Conditioning' },
          ]}
          onChange={(next) => setTab(next as Tab)}
        />

        <div className="mt-4">
          {visible.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {homeOnly
                ? 'Nothing here works without a court. Turn the filter off to see the rest.'
                : 'Nothing here yet.'}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visible.map((drill) => (
                <li key={drill.slug}>
                  <DrillCard drill={drill} config={configFor(drill)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
