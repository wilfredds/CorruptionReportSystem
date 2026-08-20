import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Coffee, Gauge, Lock, Play, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { pageVariants, useInitialSafe, useMotionSafe } from '@/lib/motion'
import { usePremium } from '@/store/premiumStore'
import { cn } from '@/lib/utils'

import { useCoach } from '../useCoach'

/**
 * The coach speaking: one instruction, one reason, one button.
 *
 * This is the payoff for every measurement the app takes. Readiness, load,
 * neglected drills, the program and the benchmark clock all arrive here and
 * leave as a single sentence, because that is what a coach does — they do not
 * hand you the dashboard, they tell you what today is.
 */
export function CoachCard() {
  const { loading, pick } = useCoach()
  const premium = usePremium()
  const variants = useMotionSafe(pageVariants)
  const initial = useInitialSafe('hidden')

  if (loading) return null

  if (!premium.has('coach')) return <CoachTeaser headline={pick.headline} />

  const Icon = pick.restDay ? Coffee : pick.code === 'benchmark' ? Gauge : Target

  return (
    <motion.div variants={variants} initial={initial} animate="visible">
      <Card
        className={cn(
          'mb-6 overflow-hidden',
          pick.restDay
            ? 'border-rest/40 from-rest/10 bg-gradient-to-br to-transparent'
            : 'border-primary/40 from-accent/60 bg-gradient-to-br to-transparent',
        )}
      >
        <CardContent className="p-5">
          <div className="mb-3 flex items-start gap-3">
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-xl',
                pick.restDay
                  ? 'bg-rest text-rest-foreground'
                  : 'bg-primary text-primary-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <Badge variant="accent" className="mb-1.5">
                <Sparkles className="size-3" aria-hidden />
                Your coach
              </Badge>
              <h2 className="text-2xl leading-tight font-bold tracking-tight text-balance">
                {pick.headline}
              </h2>
            </div>
          </div>

          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{pick.reason}</p>

          {pick.adjustment !== 'as-planned' && !pick.restDay && (
            <Badge variant="outline" className="mb-3">
              {pick.adjustment === 'lighter' ? (
                <ArrowDown className="size-3" aria-hidden />
              ) : (
                <ArrowUp className="size-3" aria-hidden />
              )}
              {pick.adjustment === 'lighter' ? 'Dialled back for today' : 'Room to push today'}
            </Badge>
          )}

          {pick.restDay ? (
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/run/cooldown-stretch">Do a five-minute stretch instead</Link>
            </Button>
          ) : pick.code === 'benchmark' ? (
            <Button asChild size="lg" className="w-full">
              <Link to="/benchmark">
                <Gauge />
                Take the benchmark
              </Link>
            </Button>
          ) : pick.drill ? (
            <div className="flex gap-2">
              <Button asChild size="lg" className="flex-1">
                <Link to={`/run/${pick.drill.slug}`}>
                  <Play className="fill-current" />
                  Start
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={`/train/${pick.drill.slug}`} aria-label={`Adjust ${pick.drill.name}`}>
                  Adjust
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/focus/fundamentals">Start with the basics</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * What a free player sees. It shows that a decision *was* made and withholds
 * only the decision — a locked box with nothing visible behind it advertises
 * nothing, and pretending no thinking happened would be a lie.
 */
function CoachTeaser({ headline }: { headline: string }) {
  return (
    <Card className="border-border mb-6 border-dashed">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start gap-3">
          <span className="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-xl">
            <Lock className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Your coach has picked today&rsquo;s session</p>
            <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
              Based on your check-in, your workload this week and the drills you have been avoiding.
              Everything below stays free — this is the part that decides for you.
            </p>
          </div>
        </div>
        <div className="bg-secondary/60 mb-3 rounded-lg px-3 py-2.5">
          <p className="text-muted-foreground text-xs font-medium">Today would be</p>
          <p className="mt-0.5 font-semibold blur-[5px] select-none" aria-hidden>
            {headline}
          </p>
          <span className="sr-only">Upgrade to see today&rsquo;s recommended session.</span>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link to="/premium">See what Premium adds</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
