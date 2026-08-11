import { describe, expect, it } from 'vitest'

import { SEED_DRILLS } from '@/lib/data/seed/drills'
import { EXERCISES } from '@/lib/data/seed/exercises'
import { TECHNIQUE_TOPICS } from '@/lib/data/seed/technique'

import {
  activeFilterCount,
  availableCategories,
  buildLibrary,
  durationBucket,
  EMPTY_FILTERS,
  filterLibrary,
  findEntry,
  type LibraryFilters,
} from './entries'

const library = buildLibrary(SEED_DRILLS)
const filters = (overrides: Partial<LibraryFilters> = {}): LibraryFilters => ({
  ...EMPTY_FILTERS,
  ...overrides,
})

describe('buildLibrary', () => {
  it('covers every drill, exercise and topic exactly once', () => {
    expect(library).toHaveLength(SEED_DRILLS.length + EXERCISES.length + TECHNIQUE_TOPICS.length)
    expect(new Set(library.map((entry) => entry.id)).size).toBe(library.length)
  })

  it('namespaces ids by kind, because a drill and a topic can share a slug', () => {
    // `rear-court-scissor` is both a drill and a technique topic. If the ids
    // were bare slugs one would silently shadow the other.
    expect(findEntry(library, 'drill/rear-court-scissor')).toBeDefined()
    expect(findEntry(library, 'technique/rear-court-scissor')).toBeDefined()
  })

  it('puts technique before the drills that train it', () => {
    const firstDrill = library.findIndex((entry) => entry.kind === 'drill')
    const lastTopic = library.map((entry) => entry.kind).lastIndexOf('technique')
    expect(lastTopic).toBeLessThan(firstDrill)
  })

  it('gives every entry cues and something to do about them', () => {
    for (const entry of library) {
      expect(entry.title.length).toBeGreaterThan(0)
      expect(entry.summary.length).toBeGreaterThan(0)
      expect(entry.cues.length).toBeGreaterThan(0)
      expect(entry.faults.length).toBeGreaterThan(0)
      expect(entry.minutes).toBeGreaterThan(0)
    }
  })

  it('recommends reps for everything you do and nothing you read', () => {
    for (const entry of library) {
      if (entry.kind === 'technique') expect(entry.recommendedReps).toBeNull()
      else expect(entry.recommendedReps).toBeTruthy()
    }
  })

  it('makes every drill runnable and no exercise runnable on its own', () => {
    for (const entry of library) {
      if (entry.kind === 'drill') expect(entry.runSlug).toBe(entry.slug)
      if (entry.kind === 'exercise') expect(entry.runSlug).toBeNull()
    }
  })

  it('only ever points at entries that exist', () => {
    const ids = new Set(library.map((entry) => entry.id))
    for (const entry of library) {
      for (const related of entry.relatedIds) expect(ids.has(related)).toBe(true)
      if (entry.runSlug) expect(ids.has(`drill/${entry.runSlug}`)).toBe(true)
    }
  })

  it('links a circuit to its exercises and back again', () => {
    const circuit = findEntry(library, 'drill/agility-ladder-circuit')
    expect(circuit?.relatedIds.some((id) => id.startsWith('exercise/'))).toBe(true)

    const ladder = findEntry(library, 'exercise/ladder-in-out')
    expect(ladder?.relatedIds).toContain('drill/agility-ladder-circuit')
  })

  it('links a topic to the drills that train it', () => {
    const split = findEntry(library, 'technique/the-split-step')
    expect(split?.relatedIds).toContain('drill/four-corner-footwork')
    expect(split?.runSlug).toBe('four-corner-footwork')
  })

  it('does not invent references it cannot vouch for', () => {
    // Every seeded drill has `videoUrl: null` for the reason documented in
    // seed/technique.ts. If that changes, it should change deliberately.
    expect(library.every((entry) => entry.reference === null)).toBe(true)
  })
})

describe('durationBucket', () => {
  it('splits at ten and twenty minutes', () => {
    expect(durationBucket(4)).toBe('short')
    expect(durationBucket(9)).toBe('short')
    expect(durationBucket(10)).toBe('medium')
    expect(durationBucket(20)).toBe('medium')
    expect(durationBucket(21)).toBe('long')
  })
})

describe('filterLibrary', () => {
  it('returns everything when nothing is set', () => {
    expect(filterLibrary(library, EMPTY_FILTERS)).toHaveLength(library.length)
  })

  it('filters by kind', () => {
    const drills = filterLibrary(library, filters({ kind: 'drill' }))
    expect(drills).toHaveLength(SEED_DRILLS.length)
    expect(drills.every((entry) => entry.kind === 'drill')).toBe(true)
  })

  it('filters by level, location and practice mode', () => {
    for (const entry of filterLibrary(library, filters({ level: 'beginner' }))) {
      expect(entry.level).toBe('beginner')
    }
    for (const entry of filterLibrary(library, filters({ location: 'anywhere' }))) {
      expect(entry.location).toBe('anywhere')
    }
    const partner = filterLibrary(library, filters({ practiceMode: 'partner' }))
    expect(partner.length).toBeGreaterThan(0)
    expect(partner.every((entry) => entry.practiceMode === 'partner')).toBe(true)
  })

  it('filters by duration bucket', () => {
    for (const entry of filterLibrary(library, filters({ duration: 'short' }))) {
      expect(entry.minutes).toBeLessThan(10)
    }
  })

  it('searches cues, not just titles', () => {
    // "knee" appears in the lunge topic's cues and nowhere in its title.
    const found = filterLibrary(library, filters({ query: 'knee' }))
    expect(found.map((entry) => entry.id)).toContain('technique/the-net-lunge')
  })

  it('requires every word in the query to match', () => {
    const both = filterLibrary(library, filters({ query: 'split step' }))
    expect(both.length).toBeGreaterThan(0)
    const nonsense = filterLibrary(library, filters({ query: 'split step trombone' }))
    expect(nonsense).toHaveLength(0)
  })

  it('ignores case and surrounding whitespace', () => {
    expect(filterLibrary(library, filters({ query: '  SPLIT  ' })).length).toBe(
      filterLibrary(library, filters({ query: 'split' })).length,
    )
  })

  it('combines filters rather than widening', () => {
    const combined = filterLibrary(library, filters({ kind: 'drill', location: 'anywhere' }))
    for (const entry of combined) {
      expect(entry.kind).toBe('drill')
      expect(entry.location).toBe('anywhere')
    }
    expect(combined.length).toBeLessThan(filterLibrary(library, filters({ kind: 'drill' })).length)
  })
})

describe('filter bookkeeping', () => {
  it('counts only the filters that narrow the list', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0)
    expect(activeFilterCount(filters({ query: 'anything' }))).toBe(0)
    expect(activeFilterCount(filters({ kind: 'drill', level: 'beginner' }))).toBe(2)
  })

  it('offers only categories that exist', () => {
    const categories = availableCategories(library)
    expect(categories.length).toBeGreaterThan(0)
    for (const category of categories) {
      expect(filterLibrary(library, filters({ category })).length).toBeGreaterThan(0)
    }
  })
})
