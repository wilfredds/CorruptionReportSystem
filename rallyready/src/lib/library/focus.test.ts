import { describe, expect, it } from 'vitest'

import { SEED_DRILLS } from '@/lib/data/seed/drills'
import { TECHNIQUE_TOPICS } from '@/lib/data/seed/technique'

import { buildLibrary } from './entries'
import {
  countForFocus,
  entriesForFocus,
  findFocus,
  fundamentalSlugs,
  sortForFocus,
  withinLevel,
  FOCUS_AREAS,
} from './focus'

const entries = buildLibrary(SEED_DRILLS)

describe('FOCUS_AREAS', () => {
  it('offers every one of them something to show a beginner or above', () => {
    // A goal card that opens onto an empty list is worse than no card: it reads
    // as the app being broken rather than as the catalogue being small.
    for (const focus of FOCUS_AREAS) {
      expect(
        countForFocus(entries, focus, { level: 'advanced' }),
        `${focus.id} at advanced`,
      ).toBeGreaterThan(0)
    }
  })

  it('shows a genuine beginner something in every area they can train', () => {
    for (const focus of FOCUS_AREAS) {
      // Power is plyometric work and is deliberately withheld from beginners —
      // the periodiser keeps it out of base weeks for the same reason.
      if (focus.id === 'power') continue
      expect(
        countForFocus(entries, focus, { level: 'beginner' }),
        `${focus.id} at beginner`,
      ).toBeGreaterThan(0)
    }
  })

  it('has unique ids and is findable by them', () => {
    const ids = FOCUS_AREAS.map((area) => area.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(findFocus(id)?.id).toBe(id)
  })

  it('does not point at a category nothing is filed under', () => {
    const used = new Set(entries.map((entry) => entry.category))
    for (const focus of FOCUS_AREAS) {
      for (const category of focus.categories) {
        expect(used.has(category), `${focus.id} → ${category}`).toBe(true)
      }
    }
  })
})

describe('the beginner path', () => {
  it('starts with holding the racket', () => {
    expect(fundamentalSlugs()[0]).toBe('how-to-hold-the-racket')
  })

  it('teaches the grip before the shots that need it', () => {
    const slugs = fundamentalSlugs()
    const at = (slug: string) => slugs.indexOf(slug)
    expect(at('how-to-hold-the-racket')).toBeLessThan(at('the-overhead-clear'))
    expect(at('the-backhand-grip')).toBeLessThan(at('the-net-lunge'))
    expect(at('the-ready-stance')).toBeLessThan(at('the-smash'))
    expect(at('the-overhead-clear')).toBeLessThan(at('the-smash'))
  })

  it('is presented in that order rather than alphabetically', () => {
    const focus = findFocus('fundamentals')!
    const shown = sortForFocus(entriesForFocus(entries, focus, { level: 'beginner' }), focus)
    expect(shown.map((entry) => entry.slug)).toEqual(fundamentalSlugs())
  })

  it('lists every flagged topic, even one missing from the declared order', () => {
    const flagged = TECHNIQUE_TOPICS.filter((topic) => topic.fundamental).map((topic) => topic.slug)
    expect([...fundamentalSlugs()].sort()).toEqual([...flagged].sort())
  })

  it('covers grip, stance, an overhead and a serve', () => {
    const slugs = fundamentalSlugs()
    for (const needed of [
      'how-to-hold-the-racket',
      'the-backhand-grip',
      'the-ready-stance',
      'the-overhead-clear',
      'the-low-serve',
    ]) {
      expect(slugs, needed).toContain(needed)
    }
  })

  it('draws a picture for every grip and swing it teaches', () => {
    // The whole point of the fundamentals is that they are shown, not described.
    for (const slug of fundamentalSlugs()) {
      const topic = TECHNIQUE_TOPICS.find((entry) => entry.slug === slug)
      expect(topic, slug).toBeDefined()
      if (slug === 'base-and-recovery') continue // a court-position idea, not a body shape
      expect(topic?.diagram, `${slug} needs a diagram`).toBeDefined()
    }
  })

  it('ignores the level filter — you read these before you have a level', () => {
    const focus = findFocus('fundamentals')!
    const asBeginner = entriesForFocus(entries, focus, { level: 'beginner' })
    const asAdvanced = entriesForFocus(entries, focus, { level: 'advanced' })
    expect(asBeginner.map((e) => e.id)).toEqual(asAdvanced.map((e) => e.id))
    expect(asBeginner.length).toBe(fundamentalSlugs().length)
  })
})

describe('withinLevel', () => {
  it('lets a player see their own level and everything below it', () => {
    expect(withinLevel('beginner', 'advanced')).toBe(true)
    expect(withinLevel('intermediate', 'intermediate')).toBe(true)
    expect(withinLevel('advanced', 'intermediate')).toBe(false)
    expect(withinLevel('intermediate', 'beginner')).toBe(false)
  })

  it('opens everything up when the player asks for it', () => {
    expect(withinLevel('advanced', 'beginner', true)).toBe(true)
  })
})

describe('entriesForFocus', () => {
  it('keeps a beginner out of the advanced material by default', () => {
    const footwork = findFocus('footwork')!
    const shown = entriesForFocus(entries, footwork, { level: 'beginner' })
    expect(shown.every((entry) => entry.level === 'beginner')).toBe(true)
  })

  it('shows the lot once they ask', () => {
    const footwork = findFocus('footwork')!
    const restricted = entriesForFocus(entries, footwork, { level: 'beginner' })
    const opened = entriesForFocus(entries, footwork, { level: 'beginner', showHarder: true })
    expect(opened.length).toBeGreaterThan(restricted.length)
  })

  it('only returns entries belonging to the area', () => {
    const net = findFocus('net')!
    expect(
      entriesForFocus(entries, net, { level: 'advanced' }).every(
        (entry) => entry.category === 'net',
      ),
    ).toBe(true)
  })
})

describe('sortForFocus', () => {
  it('puts what you can do above what you can read', () => {
    const focus = findFocus('footwork')!
    const sorted = sortForFocus(entriesForFocus(entries, focus, { level: 'advanced' }))
    const firstTechnique = sorted.findIndex((entry) => entry.kind === 'technique')
    const lastDrill = sorted.map((entry) => entry.kind).lastIndexOf('drill')
    if (firstTechnique !== -1 && lastDrill !== -1) expect(lastDrill).toBeLessThan(firstTechnique)
  })

  it('runs easiest first inside a kind', () => {
    const focus = findFocus('footwork')!
    const drills = sortForFocus(entriesForFocus(entries, focus, { level: 'advanced' })).filter(
      (entry) => entry.kind === 'drill',
    )
    const order = { beginner: 0, intermediate: 1, advanced: 2 }
    for (let i = 1; i < drills.length; i++) {
      expect(order[drills[i]!.level]).toBeGreaterThanOrEqual(order[drills[i - 1]!.level])
    }
  })
})
