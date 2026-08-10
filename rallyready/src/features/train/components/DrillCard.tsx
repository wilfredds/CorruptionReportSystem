import { Dumbbell, Home, MapPin, Play, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Drill } from '@/lib/data/types'
import { configFromDrill, estimateDurationSec } from '@/lib/timer/plan'
import type { DrillConfig } from '@/lib/timer/plan'
import { formatCompactDuration, pluralize } from '@/lib/utils'

import { CATEGORY_LABEL, LEVEL_LABEL } from '../drillLabels'

interface DrillCardProps {
  drill: Drill
  /** The user's saved setup, if they have one. */
  config?: DrillConfig
}

export function DrillCard({ drill, config }: DrillCardProps) {
  const resolved = config ?? configFromDrill(drill)
  const isCircuit = drill.circuit !== null && drill.circuit.length > 0

  return (
    <Card className="hover:border-primary/50 h-full transition-colors">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge>{CATEGORY_LABEL[drill.category]}</Badge>
            <Badge variant="outline">{LEVEL_LABEL[drill.level]}</Badge>
            {drill.location === 'anywhere' && (
              <Badge variant="outline" title="No court needed">
                <Home className="size-3" aria-hidden />
                No court
              </Badge>
            )}
            {drill.location === 'court' && (
              <Badge variant="outline" title="Best on a court">
                <MapPin className="size-3" aria-hidden />
                Court
              </Badge>
            )}
          </div>
          <h3 className="leading-snug font-semibold">{drill.name}</h3>
          <p className="text-muted-foreground mt-1 line-clamp-3 text-sm leading-relaxed">
            {drill.description}
          </p>
        </div>

        <p className="text-muted-foreground tnum text-xs">
          {isCircuit
            ? `${pluralize(drill.circuit?.length ?? 0, 'exercise')} · ${pluralize(drill.circuitRounds, 'round')} · ${formatCompactDuration(estimateDurationSec(resolved))}`
            : `${drill.corners} zones · ${drill.defaultWorkSec}s / ${drill.defaultRestSec}s × ${drill.defaultRounds} · ${formatCompactDuration(estimateDurationSec(resolved))}`}
        </p>

        {drill.equipment.length > 0 && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Dumbbell className="size-3.5 shrink-0" aria-hidden />
            {drill.equipment.join(', ')}
          </p>
        )}

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
  )
}
