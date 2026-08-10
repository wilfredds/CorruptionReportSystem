import { useQuery } from '@tanstack/react-query'
import { Flame, Play, SlidersHorizontal, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRepositories } from '@/lib/data/context'
import type { Drill } from '@/lib/data/types'
import { estimateDurationSec } from '@/lib/timer/plan'
import { formatCompactDuration, pluralize } from '@/lib/utils'
import { useDrillConfigStore } from '@/store/drillConfigStore'
import { configFromDrill } from '@/lib/timer/plan'

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

  const featured = drills[0]
  const rest = drills.slice(1)

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
          <span className="text-foreground inline-flex items-center gap-1.5 font-medium">
            <Flame className="text-primary size-4" aria-hidden />
            {pluralize(streak.currentStreak, 'week')} in a row
          </span>
          <span>
            {streak.weeklySessionsCount === 0
              ? 'Nothing logged this week yet'
              : `${pluralize(streak.weeklySessionsCount, 'session')} this week`}
          </span>
        </div>
      )}

      {isLoading && <p className="text-muted-foreground text-sm">Loading drills…</p>}

      {featured && (
        <Card className="border-primary/40 from-accent/60 mb-8 overflow-hidden bg-gradient-to-br to-transparent">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="accent" className="mb-2">
                  <Zap className="size-3" aria-hidden />
                  Start here
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight">{featured.name}</h2>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {featured.description}
                </p>
              </div>
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
