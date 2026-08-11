import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

import { useReducedMotion } from '@/hooks/useReducedMotion'

import { BottomNav } from './BottomNav'

/**
 * Chrome for every screen except the drill runner, which goes full-bleed and
 * renders outside this shell — nothing should compete with the board mid-drill.
 */
export function AppShell() {
  const location = useLocation()
  const reducedMotion = useReducedMotion()

  return (
    <div className="min-h-dvh md:pl-20">
      <a
        href="#main"
        className="sr-only-focusable bg-primary text-primary-foreground fixed top-3 left-3 z-50 rounded-lg px-4 py-2 text-sm font-semibold"
      >
        Skip to content
      </a>
      <main id="main" className="mx-auto max-w-3xl px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-12">
        {/* Keyed on the path so each screen fades up on arrival. Short and
            small on purpose: this should register as the page having settled,
            not as an animation you have to sit through before tapping. */}
        <motion.div
          key={location.pathname}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <BottomNav />
    </div>
  )
}
