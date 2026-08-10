import { Outlet } from 'react-router-dom'

import { BottomNav } from './BottomNav'

/**
 * Chrome for every screen except the drill runner, which goes full-bleed and
 * renders outside this shell — nothing should compete with the board mid-drill.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh md:pl-20">
      <a
        href="#main"
        className="sr-only-focusable bg-primary text-primary-foreground fixed top-3 left-3 z-50 rounded-lg px-4 py-2 text-sm font-semibold"
      >
        Skip to content
      </a>
      <main id="main" className="mx-auto max-w-3xl px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-12">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
