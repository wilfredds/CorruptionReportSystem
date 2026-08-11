import { EXERCISES, type Exercise } from '@/lib/data/seed/exercises'
import {
  TECHNIQUE_TOPICS,
  type ExternalReference,
  type PracticeMode,
  type TechniqueTopic,
} from '@/lib/data/seed/technique'
import type { Drill, DrillCategory, DrillLocation, SkillLevel } from '@/lib/data/types'
import { configFromDrill, estimateDurationSec } from '@/lib/timer/plan'

/**
 * One browsable reference list over everything the app knows how to teach
 * (§4 Phase 5).
 *
 * Entries are *derived* from the drill, exercise and technique catalogues
 * rather than being a fourth copy of the same content. A cue fixed on a drill
 * is fixed in the library on the next render, and the two can never disagree.
 *
 * Pure — no React, no storage — so the filtering is unit-testable and the whole
 * library works offline.
 */

export type LibraryKind = 'drill' | 'exercise' | 'technique'

/** Coarse enough to be useful on a phone, honest enough to mean something. */
export type DurationBucket = 'short' | 'medium' | 'long'

export interface LibraryEntry {
  /** `kind/slug` — unique, because a drill and a topic can share a slug. */
  id: string
  kind: LibraryKind
  slug: string
  title: string
  summary: string
  category: DrillCategory
  level: SkillLevel
  practiceMode: PracticeMode
  location: DrillLocation
  /** Time to run it, or to read it. */
  minutes: number
  cues: string[]
  faults: string[]
  /** How much of it to do, in words. Null for a topic you read. */
  recommendedReps: string | null
  /** Drill slug this entry can be started as, pre-configured. */
  runSlug: string | null
  /** Other entries worth reading next, by id. */
  relatedIds: string[]
  /** A vetted external clip, when one exists. See `seed/technique.ts`. */
  reference: ExternalReference | null
}

export const KIND_LABEL: Record<LibraryKind, string> = {
  drill: 'Drill',
  exercise: 'Exercise',
  technique: 'Technique',
}

export const DURATION_LABEL: Record<DurationBucket, string> = {
  short: 'Under 10 min',
  medium: '10–20 min',
  long: 'Over 20 min',
}

export const PRACTICE_LABEL: Record<PracticeMode, string> = {
  solo: 'Solo',
  partner: 'Needs a partner',
}

export function durationBucket(minutes: number): DurationBucket {
  if (minutes < 10) return 'short'
  if (minutes <= 20) return 'medium'
  return 'long'
}

/* ------------------------------------------------------------- derivation */

const EXERCISE_CATEGORY: Record<Exercise['kind'], DrillCategory> = {
  ladder: 'agility',
  plyometric: 'plyometric',
  bodyweight: 'conditioning',
  mobility: 'warmup',
  stretch: 'cooldown',
}

/**
 * Plyometrics are the advanced ones — they are the exercises that punish being
 * done tired or on cold legs, which is the same reason the periodiser keeps
 * them out of base weeks.
 */
const EXERCISE_LEVEL: Record<Exercise['kind'], SkillLevel> = {
  ladder: 'beginner',
  plyometric: 'advanced',
  bodyweight: 'beginner',
  // Warming up and stretching are for everyone, and filing them any higher
  // would hide them behind a level filter from the players who skip them most.
  mobility: 'beginner',
  stretch: 'beginner',
}

/** A single practice block of the exercise on its own, in minutes. */
const EXERCISE_MINUTES = 4

function drillReps(drill: Drill): string {
  if (drill.circuit) {
    const steps = drill.circuit.length
    return `${drill.circuitRounds} ${drill.circuitRounds === 1 ? 'round' : 'rounds'} of ${steps} ${steps === 1 ? 'exercise' : 'exercises'}`
  }
  return `${drill.defaultRounds} rounds of ${drill.defaultWorkSec}s work / ${drill.defaultRestSec}s rest`
}

function drillEntry(drill: Drill, topics: TechniqueTopic[], exercises: Exercise[]): LibraryEntry {
  const relatedTopics = topics
    .filter((topic) => topic.drills.includes(drill.slug))
    .map((topic) => `technique/${topic.slug}`)
  const relatedExercises = (drill.circuit ?? [])
    .map((step) => step.exerciseSlug)
    .filter((slug) => exercises.some((exercise) => exercise.slug === slug))
    .map((slug) => `exercise/${slug}`)

  return {
    id: `drill/${drill.slug}`,
    kind: 'drill',
    slug: drill.slug,
    title: drill.name,
    summary: drill.description,
    category: drill.category,
    level: drill.level,
    practiceMode: 'solo',
    location: drill.location,
    minutes: Math.max(1, Math.round(estimateDurationSec(configFromDrill(drill)) / 60)),
    cues: drill.coachingCues,
    faults: drill.commonFaults,
    recommendedReps: drillReps(drill),
    runSlug: drill.slug,
    // De-duplicated: a circuit can name the same exercise more than once.
    relatedIds: [...new Set([...relatedTopics, ...relatedExercises])],
    reference: drill.videoUrl
      ? { title: `${drill.name} — reference clip`, source: 'Curated', url: drill.videoUrl }
      : null,
  }
}

function exerciseEntry(exercise: Exercise, drills: Drill[]): LibraryEntry {
  const usedBy = drills
    .filter((drill) => (drill.circuit ?? []).some((step) => step.exerciseSlug === exercise.slug))
    .map((drill) => `drill/${drill.slug}`)

  return {
    id: `exercise/${exercise.slug}`,
    kind: 'exercise',
    slug: exercise.slug,
    title: exercise.name,
    summary: exercise.summary,
    category: EXERCISE_CATEGORY[exercise.kind],
    level: EXERCISE_LEVEL[exercise.kind],
    practiceMode: 'solo',
    location: 'anywhere',
    minutes: EXERCISE_MINUTES,
    cues: exercise.cues,
    faults: exercise.faults,
    recommendedReps: exercise.recommendedReps,
    // An exercise is not a session on its own; the circuit that contains it is.
    runSlug: null,
    relatedIds: usedBy,
    reference: null,
  }
}

function techniqueEntry(topic: TechniqueTopic, drills: Drill[]): LibraryEntry {
  const known = topic.drills.filter((slug) => drills.some((drill) => drill.slug === slug))
  return {
    id: `technique/${topic.slug}`,
    kind: 'technique',
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary,
    category: topic.category,
    level: topic.level,
    practiceMode: topic.practiceMode,
    location: topic.location,
    minutes: topic.readMinutes,
    cues: topic.cues,
    faults: topic.faults,
    recommendedReps: null,
    runSlug: known[0] ?? null,
    relatedIds: known.map((slug) => `drill/${slug}`),
    reference: topic.reference ?? null,
  }
}

/**
 * Technique first: the library exists so a player can learn the thing before
 * drilling it, and a list that opens with twelve drills buries the teaching
 * under the training.
 */
const KIND_ORDER: Record<LibraryKind, number> = { technique: 0, drill: 1, exercise: 2 }

export function buildLibrary(drills: Drill[]): LibraryEntry[] {
  const entries = [
    ...TECHNIQUE_TOPICS.map((topic) => techniqueEntry(topic, drills)),
    ...drills.map((drill) => drillEntry(drill, TECHNIQUE_TOPICS, EXERCISES)),
    ...EXERCISES.map((exercise) => exerciseEntry(exercise, drills)),
  ]
  return entries.sort(
    (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title),
  )
}

export function findEntry(entries: LibraryEntry[], id: string): LibraryEntry | undefined {
  return entries.find((entry) => entry.id === id)
}

/* ---------------------------------------------------------------- filters */

export interface LibraryFilters {
  query: string
  kind: LibraryKind | 'all'
  category: DrillCategory | 'all'
  level: SkillLevel | 'all'
  practiceMode: PracticeMode | 'all'
  location: DrillLocation | 'all'
  duration: DurationBucket | 'all'
}

export const EMPTY_FILTERS: LibraryFilters = {
  query: '',
  kind: 'all',
  category: 'all',
  level: 'all',
  practiceMode: 'all',
  location: 'all',
  duration: 'all',
}

/** How many filters are narrowing the list, so the UI can say so. */
export function activeFilterCount(filters: LibraryFilters): number {
  const { query: _query, ...rest } = filters
  return Object.values(rest).filter((value) => value !== 'all').length
}

/**
 * Matches whole words from anywhere in the entry, including its cues — someone
 * searching "knee" should find the lunge topic whose cues are the only place
 * the word appears.
 */
function matchesQuery(entry: LibraryEntry, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return true
  const haystack = [entry.title, entry.summary, ...entry.cues, ...entry.faults]
    .join(' ')
    .toLowerCase()
  return needle.split(/\s+/).every((word) => haystack.includes(word))
}

export function filterLibrary(entries: LibraryEntry[], filters: LibraryFilters): LibraryEntry[] {
  return entries.filter(
    (entry) =>
      matchesQuery(entry, filters.query) &&
      (filters.kind === 'all' || entry.kind === filters.kind) &&
      (filters.category === 'all' || entry.category === filters.category) &&
      (filters.level === 'all' || entry.level === filters.level) &&
      (filters.practiceMode === 'all' || entry.practiceMode === filters.practiceMode) &&
      (filters.location === 'all' || entry.location === filters.location) &&
      (filters.duration === 'all' || durationBucket(entry.minutes) === filters.duration),
  )
}

/** Categories actually present, so the UI never offers a filter that finds nothing. */
export function availableCategories(entries: LibraryEntry[]): DrillCategory[] {
  return [...new Set(entries.map((entry) => entry.category))]
}
