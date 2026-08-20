import { describe, expect, it } from 'vitest'

import { pageDirection, tabIndexOf, TOP_LEVEL_PATHS } from './pageDirection'

describe('tabIndexOf', () => {
  it('finds each tab', () => {
    TOP_LEVEL_PATHS.forEach((path, index) => {
      expect(tabIndexOf(path), path).toBe(index)
    })
  })

  it('keeps a nested screen inside its tab', () => {
    expect(tabIndexOf('/library/technique/the-smash')).toBe(tabIndexOf('/library'))
    expect(tabIndexOf('/programs/base-8-week')).toBe(tabIndexOf('/programs'))
  })

  it('does not swallow every path into Train', () => {
    // `/` matches exactly or it would claim the whole app.
    expect(tabIndexOf('/premium')).toBe(-1)
    expect(tabIndexOf('/session/abc')).toBe(-1)
    expect(tabIndexOf('/onboarding')).toBe(-1)
  })

  it('does not match a tab as a prefix of an unrelated route', () => {
    expect(tabIndexOf('/progressive-overload')).toBe(-1)
  })
})

describe('pageDirection', () => {
  it('follows the bar between tabs', () => {
    expect(pageDirection('/', '/library', 'PUSH')).toBe(1)
    expect(pageDirection('/library', '/', 'PUSH')).toBe(-1)
    expect(pageDirection('/progress', '/profile', 'PUSH')).toBe(1)
    expect(pageDirection('/profile', '/progress', 'PUSH')).toBe(-1)
  })

  it('follows the bar even when the browser did the navigating', () => {
    // Pressing Back from Library to Train is still leftward along the bar; the
    // direction should describe where you land, not how you got there.
    expect(pageDirection('/library', '/', 'POP')).toBe(-1)
    expect(pageDirection('/', '/library', 'POP')).toBe(1)
  })

  it('treats going deeper as forward', () => {
    expect(pageDirection('/library', '/library/technique/the-smash', 'PUSH')).toBe(1)
    expect(pageDirection('/', '/train/six-corner-shadow', 'PUSH')).toBe(1)
    expect(pageDirection('/progress', '/session/abc', 'PUSH')).toBe(1)
  })

  it('treats coming back out as backward', () => {
    expect(pageDirection('/library/technique/the-smash', '/library', 'POP')).toBe(-1)
    expect(pageDirection('/session/abc', '/progress', 'POP')).toBe(-1)
  })

  it('sends a redirect forward rather than nowhere', () => {
    expect(pageDirection('/', '/welcome', 'REPLACE')).toBe(1)
  })

  it('never returns 0 — a page has to arrive from somewhere', () => {
    for (const kind of ['PUSH', 'POP', 'REPLACE'] as const) {
      expect(Math.abs(pageDirection('/premium', '/premium', kind))).toBe(1)
    }
  })
})
