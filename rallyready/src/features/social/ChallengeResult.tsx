import { useEffect } from 'react'
import { Swords, Trophy } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { pluralize } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useChallengeStore } from '@/store/challengeStore'

/**
 * Whether you beat the challenge you took.
 *
 * Cleared as soon as it has been shown. A challenge that stayed active would
 * quietly compare itself against next week's completely different session and
 * announce a victory nobody earned.
 */
export function ChallengeResult({
  drillSlug,
  calls,
}: {
  drillSlug: string | undefined
  calls: number
}) {
  const active = useChallengeStore((state) => state.active)
  const clear = useChallengeStore((state) => state.clear)

  const relevant = active !== null && drillSlug !== undefined && active.drill === drillSlug

  // Reported once, then forgotten. Runs after paint so the card is on screen
  // for the render that clears it.
  useEffect(() => {
    if (relevant) clear()
  }, [relevant, clear])

  if (!relevant || active === null) return null

  const target = active.target
  const won = target !== null && calls > target
  const drew = target !== null && calls === target

  return (
    <Card level={won ? 'lead' : 'default'} className="mb-5">
      <CardContent className="flex items-start gap-3 p-5">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-xl',
            won ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
          )}
        >
          {won ? (
            <Trophy className="size-5" aria-hidden />
          ) : (
            <Swords className="size-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">
            {target === null
              ? 'Challenge complete'
              : won
                ? `You beat ${active.from ?? 'them'}`
                : drew
                  ? 'Dead heat'
                  : `${active.from ?? 'They'} still lead`}
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {target === null
              ? `${pluralize(calls, 'call')} answered on their session.`
              : `${calls} to ${target}${
                  won ? '.' : drew ? ' — same score, same drill.' : `. ${target - calls} to find.`
                }`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
