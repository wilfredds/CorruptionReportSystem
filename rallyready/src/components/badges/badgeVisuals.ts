import {
  Award,
  CalendarCheck,
  Flag,
  Flame,
  Footprints,
  Gauge,
  Hourglass,
  Shuffle,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

import type { BadgeTier } from '@/lib/data/badges'

/**
 * How a badge looks, in one place.
 *
 * Shared by the trophy case and the unlock moment: a badge that arrives in one
 * colour and then sits in the case in another is two badges as far as anybody
 * looking at it is concerned.
 */

const ICONS: Record<string, LucideIcon> = {
  flag: Flag,
  footprints: Footprints,
  'calendar-check': CalendarCheck,
  gauge: Gauge,
  flame: Flame,
  target: Target,
  trophy: Trophy,
  shuffle: Shuffle,
  hourglass: Hourglass,
}

export function badgeIcon(name: string): LucideIcon {
  return ICONS[name] ?? Award
}

export const TIER_STYLE: Record<BadgeTier, string> = {
  bronze: 'bg-[oklch(0.72_0.11_58)]/18 text-[oklch(0.55_0.12_58)] dark:text-[oklch(0.8_0.11_58)]',
  silver:
    'bg-[oklch(0.72_0.02_250)]/20 text-[oklch(0.5_0.02_250)] dark:text-[oklch(0.85_0.02_250)]',
  gold: 'bg-[oklch(0.82_0.15_88)]/20 text-[oklch(0.58_0.14_88)] dark:text-[oklch(0.86_0.15_88)]',
}

export const TIER_LABEL: Record<BadgeTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
}
