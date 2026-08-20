import { motion } from 'framer-motion'
import { useState } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'

import { directionalPageVariants, useInitialSafe, useMotionSafe } from '@/lib/motion'
import { pageDirection, type Direction } from '@/lib/pageDirection'

import { BottomNav } from './BottomNav'

/**
 * Chrome for every screen except the drill runner, which goes full-bleed and
 * renders outside this shell — nothing should compete with the board mid-drill.
 */
export function AppShell() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const variants = useMotionSafe(directionalPageVariants)
  const initial = useInitialSafe('hidden')

  /*
   * The direction the next screen arrives from, decided at the moment the path
   * changes and remembered until it changes again.
   *
   * Held in state and adjusted during render rather than in an effect: an
   * effect runs after the new page has already been painted, so the slide
   * would play with the previous screen's direction. React supports this
   * pattern precisely for derived state that depends on a changing input.
   */
  const [nav, setNav] = useState<{ path: string; direction: Direction }>(() => ({
    path: location.pathname,
    direction: 1,
  }))
  let direction = nav.direction
  if (nav.path !== location.pathname) {
    direction = pageDirection(nav.path, location.pathname, navigationType)
    setNav({ path: location.pathname, direction })
  }

  return (
    <div className="min-h-dvh md:pl-20">
      <a
        href="#main"
        className="sr-only-focusable bg-primary text-primary-foreground fixed top-3 left-3 z-50 rounded-lg px-4 py-2 text-sm font-semibold"
      >
        Skip to content
      </a>
      <main id="main" className="mx-auto max-w-3xl px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-12">
        {/* Keyed on the path so each screen arrives on its own. Short and small
            on purpose: this should register as the page having settled, not as
            an animation you have to sit through before tapping. */}
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={variants}
          initial={initial}
          animate="visible"
        >
          <Outlet />
        </motion.div>
      </main>
      <BottomNav />
    </div>
  )
}
