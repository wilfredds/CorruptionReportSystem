/**
 * Which way a screen should arrive from.
 *
 * A page that always slides in from the same side tells you nothing. A page
 * that slides in from the right when you go deeper and from the left when you
 * come back tells you where you are in the app without a word of copy — which
 * matters most on a phone, where there is no breadcrumb and no back button
 * except the browser's.
 *
 * Pure and separate from the shell so the rule can be tested directly; getting
 * it subtly backwards is the kind of thing nobody notices in review and
 * everybody feels in use.
 */

/**
 * The five destinations in the bottom bar, in bar order.
 *
 * `BottomNav` builds itself from this list, so the order the marker travels in
 * and the order the pages slide in cannot drift apart.
 */
export const TOP_LEVEL_PATHS = ['/', '/progress', '/programs', '/library', '/profile'] as const

export type TopLevelPath = (typeof TOP_LEVEL_PATHS)[number]

export type Direction = 1 | -1

/** React Router's navigation type, narrowed to what we actually branch on. */
export type NavKind = 'PUSH' | 'POP' | 'REPLACE'

/**
 * Which tab a path belongs to, or -1. A library entry is still the Library
 * tab, so `/library/technique/the-smash` counts as index 3.
 */
export function tabIndexOf(path: string): number {
  return TOP_LEVEL_PATHS.findIndex((tab) =>
    tab === '/' ? path === '/' : path === tab || path.startsWith(`${tab}/`),
  )
}

export function pageDirection(from: string, to: string, kind: NavKind): Direction {
  const fromTab = tabIndexOf(from)
  const toTab = tabIndexOf(to)

  // Moving between two tabs: follow the bar. Tapping Library while on Train
  // should slide the same way whether you got to Train by tapping or by Back.
  if (fromTab !== -1 && toTab !== -1 && fromTab !== toTab) {
    return toTab > fromTab ? 1 : -1
  }

  // Everything else is depth. Back is the only reliable signal the router
  // gives us, and it is the one that matters: a screen you dismissed should
  // leave the way it came.
  return kind === 'POP' ? -1 : 1
}
