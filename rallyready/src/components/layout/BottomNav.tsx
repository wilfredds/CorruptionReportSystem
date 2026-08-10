import { BookOpen, CalendarRange, LineChart, Timer, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const ITEMS = [
  { to: '/', label: 'Train', icon: Timer, end: true },
  { to: '/progress', label: 'Progress', icon: LineChart, end: false },
  { to: '/programs', label: 'Programs', icon: CalendarRange, end: false },
  { to: '/library', label: 'Library', icon: BookOpen, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
] as const

/**
 * Persistent bottom navigation on mobile; it moves to a sidebar rail on
 * desktop so the planning views get the full width (§5).
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="bg-background/85 safe-bottom fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg md:top-0 md:right-auto md:bottom-0 md:left-0 md:w-20 md:border-t-0 md:border-r md:pb-0"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 md:h-full md:max-w-none md:flex-col md:justify-start md:gap-1 md:px-2 md:pt-6">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1 md:flex-none">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-lg py-2 text-[0.6875rem] font-medium transition-colors md:min-h-16 md:gap-1.5',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-5" strokeWidth={isActive ? 2.4 : 1.9} aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
