import { useQuery } from '@tanstack/react-query'
import { Flame, Home, Play, SlidersHorizontal, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { useRepositories } from '@/lib/data/context'
import { resolveRecommendation } from '@/lib/data/recommend'
import { isConditioning } from '@/lib/data/seed/drills'
import type { Drill } from '@/lib/data/types'
import { configFromDrill, estimateDurationSec } from '@/lib/timer/plan'
import { formatCompactDuration, pluralize } from '@/lib/utils'
import { useDrillConfigStore } from '@/store/drillConfigStore'

import { TodayCard } from '../programs/components/TodayCard'
import { CueSettingsDialog } from './components/CueSettingsDialog'
import { DrillCard } from './components/DrillCard'
import { CATEGORY_LABEL, LEVEL_LABEL } from './drillLabels'

type Tab = 'drills' | 'conditioning'

export function TrainPage() {
  const repositories = useRepositories()
  const overrides = useDrillConfigStore((state) => state.overrides)
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

  // With a profile the headline drill is chosen for this player; without one it
  // is simply the first in the catalogue.
  const recommendation = profile ? resolveRecommendation(profile, drills) : null
  const featured = recommendation?.drill ?? drills[0]

  const inTab = drills.filter((drill) =>
    tab === 'conditioning' ? isConditioning(drill) : !isConditioning(drill),
  )
  const visible = inTab
    .filter((drill) => !homeOnly || drill.location === 'anywhere')
    .filter((drill) => drill.slug !== featured?.slug)

  const configFor = (drill: Drill) => overrides[drill.slug] ?? configFromDrill(drill)

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

      <TodayCard />

      {!profileLoading && !profile && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-accent text-accent-foreground grid size-11 shrink-0 place-items-center rounded-xl">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Get drills picked for you</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Four questions, under two minutes.
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link to="/onboarding">Set up</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-muted-foreground text-sm">Loading drills…</p>}

      {featured && (
        <Card className="border-primary/40 from-accent/60 mb-8 overflow-hidden bg-gradient-to-br to-transparent">
          <CardContent className="flex flex-col gap-4 p-5">
            <div>
              <Badge variant="accent" className="mb-2">
                <Zap className="size-3" aria-hidden />
                {recommendation ? 'Picked for you' : 'Start here'}
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight">{featured.name}</h2>
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

      <section aria-labelledby="catalogue">
        <h2 id="catalogue" className="sr-only">
          Drill catalogue
        </h2>

        <Segmented
          label="Workout type"
          value={tab}
          options={[
            { value: 'drills', label: 'Drills' },
            { value: 'conditioning', label: 'Conditioning' },
          ]}
          onChange={(next) => setTab(next as Tab)}
        />

        <div className="mt-3 mb-4 flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            {tab === 'drills'
              ? 'Corner-calling footwork, called out loud.'
              : 'Intervals and circuits. Most need no court at all.'}
          </p>
          <Button
            variant={homeOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHomeOnly((current) => !current)}
            aria-pressed={homeOnly}
          >
            <Home />
            No court
          </Button>
        </div>

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
      </section>
    </>
  )
}
