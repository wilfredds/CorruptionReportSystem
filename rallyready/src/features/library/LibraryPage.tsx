import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { StaggerItem } from '@/components/motion/StaggerItem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useRepositories } from '@/lib/data/context'
import type { DrillCategory, DrillLocation, SkillLevel } from '@/lib/data/types'
import type { PracticeMode } from '@/lib/data/seed/technique'
import {
  activeFilterCount,
  availableCategories,
  buildLibrary,
  DURATION_LABEL,
  EMPTY_FILTERS,
  filterLibrary,
  PRACTICE_LABEL,
  type DurationBucket,
  type LibraryFilters,
  type LibraryKind,
} from '@/lib/library/entries'
import { pluralize } from '@/lib/utils'

import { CATEGORY_LABEL, LEVEL_LABEL } from '../train/drillLabels'
import { EntryCard } from './components/EntryCard'
import { FilterChip } from './components/FilterChip'

const LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced']
const LOCATIONS: DrillLocation[] = ['court', 'anywhere']
const PRACTICE_MODES: PracticeMode[] = ['solo', 'partner']
const DURATIONS: DurationBucket[] = ['short', 'medium', 'long']

const LOCATION_LABEL: Record<DrillLocation, string> = {
  court: 'On a court',
  anywhere: 'No court',
}

export function LibraryPage() {
  const repositories = useRepositories()
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  const { data: drills = [], isLoading } = useQuery({
    queryKey: ['drills'],
    queryFn: () => repositories.drills.list(),
  })

  // Derived from the drill catalogue, so a cue edited on a drill is edited here.
  const library = useMemo(() => buildLibrary(drills), [drills])
  const results = useMemo(() => filterLibrary(library, filters), [library, filters])
  const categories = useMemo(() => availableCategories(library), [library])

  const set = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }))

  /** Chips are toggles: tapping the active value clears it. */
  const toggle = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: current[key] === value ? 'all' : value }))

  const narrowing = activeFilterCount(filters)

  return (
    <>
      <PageHeader
        title="Library"
        description="Every drill, exercise and technique the app knows, with the cues that make them work. No hunting on YouTube."
      />

      <div className="mb-4">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={filters.query}
            onChange={(event) => set('query', event.target.value)}
            placeholder="Search cues, faults and drills…"
            aria-label="Search the library"
            className="pl-9"
          />
        </div>
      </div>

      <Segmented
        label="Kind of entry"
        value={filters.kind}
        options={[
          { value: 'all', label: 'All' },
          { value: 'technique', label: 'Technique' },
          { value: 'drill', label: 'Drills' },
          { value: 'exercise', label: 'Exercises' },
        ]}
        onChange={(value) => set('kind', value as LibraryKind | 'all')}
      />

      <div className="mt-3 mb-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {pluralize(results.length, 'result')}
        </p>
        <div className="flex items-center gap-2">
          {narrowing > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
              <X />
              Clear
            </Button>
          )}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal />
            Filters
            {narrowing > 0 && (
              <Badge variant="accent" className="ml-1">
                {narrowing}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="border-border mb-6 space-y-4 rounded-xl border p-4">
          <FilterGroup label="Category">
            {categories.map((category: DrillCategory) => (
              <FilterChip
                key={category}
                label={CATEGORY_LABEL[category]}
                active={filters.category === category}
                onClick={() => toggle('category', category)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="Level">
            {LEVELS.map((level) => (
              <FilterChip
                key={level}
                label={LEVEL_LABEL[level]}
                active={filters.level === level}
                onClick={() => toggle('level', level)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="Where">
            {LOCATIONS.map((location) => (
              <FilterChip
                key={location}
                label={LOCATION_LABEL[location]}
                active={filters.location === location}
                onClick={() => toggle('location', location)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="Alone or with someone">
            {PRACTICE_MODES.map((mode) => (
              <FilterChip
                key={mode}
                label={PRACTICE_LABEL[mode]}
                active={filters.practiceMode === mode}
                onClick={() => toggle('practiceMode', mode)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="How long">
            {DURATIONS.map((duration) => (
              <FilterChip
                key={duration}
                label={DURATION_LABEL[duration]}
                active={filters.duration === duration}
                onClick={() => toggle('duration', duration)}
              />
            ))}
          </FilterGroup>
        </div>
      )}

      {isLoading ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      ) : results.length === 0 ? (
        <EmptyState
          illustration="shuttle"
          title="Nothing matches that"
          body="Try fewer filters, or search for a cue rather than a drill name."
          action={
            <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear everything
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((entry, index) => (
            <StaggerItem key={entry.id} index={index}>
              <EntryCard entry={entry} />
            </StaggerItem>
          ))}
        </ul>
      )}
    </>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  )
}
