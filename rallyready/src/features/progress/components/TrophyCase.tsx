import { Lock } from 'lucide-react'

import { badgeIcon, TIER_STYLE } from '@/components/badges/badgeVisuals'
import type { BadgeState } from '@/lib/data/badges'
import { cn } from '@/lib/utils'

export function TrophyCase({ badges }: { badges: BadgeState[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((badge) => {
        const Icon = badgeIcon(badge.icon)
        return (
          <li
            key={badge.slug}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors',
              badge.earned ? 'border-border bg-card' : 'border-dashed bg-transparent',
            )}
          >
            <span
              className={cn(
                'grid size-11 place-items-center rounded-xl',
                badge.earned ? TIER_STYLE[badge.tier] : 'bg-muted text-muted-foreground',
              )}
            >
              {badge.earned ? (
                <Icon className="size-5" aria-hidden />
              ) : (
                <Lock className="size-4" aria-hidden />
              )}
            </span>
            <span
              className={cn(
                'text-sm leading-tight font-semibold',
                !badge.earned && 'text-muted-foreground',
              )}
            >
              {badge.name}
            </span>
            <span className="text-muted-foreground text-xs leading-snug">{badge.description}</span>

            {!badge.earned && badge.progressLabel && (
              <span className="w-full">
                <span className="bg-muted block h-1 w-full overflow-hidden rounded-full">
                  <span
                    className="bg-primary/70 block h-full rounded-full"
                    style={{ width: `${Math.round(badge.progressRatio * 100)}%` }}
                  />
                </span>
                <span className="text-muted-foreground tnum mt-1 block text-[0.625rem]">
                  {badge.progressLabel}
                </span>
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
