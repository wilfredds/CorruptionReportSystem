import { useQuery } from '@tanstack/react-query'
import { Flame, Play, SlidersHorizontal, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRepositories } from '@/lib/data/context'
import { resolveRecommendation } from '@/lib/data/recommend'
import type { Drill } from '@/lib/data/types'
import { configFromDrill, estimateDurationSec } from '@/lib/timer/plan'
import { formatCompactDuration, pluralize } from '@/lib/utils'
import { useDrillConfigStore } from '@/store/drillConfigStore'

import { CueSettingsDialog } from './components/CueSettingsDialog'

const CATEGORY_LABEL: Record<Drill['category'], string> = {
  footwork: 'Footwork',
  net: 'Net',
  'rear-court': 'Rear court',
  conditioning: 'Conditioning',
  agility: 'Agility',
  plyometric: 'Plyometric',
}

const LEVEL_LABEL: Record<Drill['level'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function TrainPage() {
  const repositories = useRepositories()
  const overrides = useDrillConfigStore((state) => state.overrides)

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
  const rest = drills.filter((drill) => drill.slug !== featured?.slug)

  const durationOf = (drill: Drill) =>
    estimateDurationSec(overrides[drill.slug] ?? configFromDrill(drill))

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

      {!profileLoading && !profile && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-accent text-accent-foreground grid size-11 shrink-0 place-items-center rounded-xl">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Get drills picked for you</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Three questions, under two minutes.
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
              <Badge variant="outline">{featured.corners} zones</Badge>
              <Badge variant="outline">{formatCompactDuration(durationOf(featured))}</Badge>
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

      {rest.length > 0 && (
        <section aria-labelledby="all-drills">
          <h2 id="all-drills" className="mb-3 text-sm font-semibold tracking-wide uppercase">
            All drills
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {rest.map((drill) => (
              <li key={drill.slug}>
                <Card className="hover:border-primary/50 h-full transition-colors">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <Badge>{CATEGORY_LABEL[drill.category]}</Badge>
                        <Badge variant="outline">{LEVEL_LABEL[drill.level]}</Badge>
                      </div>
                      <h3 className="leading-snug font-semibold">{drill.name}</h3>
                      <p className="text-muted-foreground mt-1 line-clamp-3 text-sm leading-relaxed">
                        {drill.description}
                      </p>
                    </div>
                    <p className="text-muted-foreground tnum text-xs">
                      {drill.corners} zones · {drill.defaultWorkSec}s / {drill.defaultRestSec}s ×{' '}
                      {drill.defaultRounds} · {formatCompactDuration(durationOf(drill))}
                    </p>
                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to={`/run/${drill.slug}`}>
                          <Play className="fill-current" />
                          Start
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="icon">
                        <Link to={`/train/${drill.slug}`} aria-label={`Adjust ${drill.name}`}>
                          <SlidersHorizontal />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
