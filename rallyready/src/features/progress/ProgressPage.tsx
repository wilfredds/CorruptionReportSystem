import { Award, Flame, Gauge, LineChart as LineChartIcon, Timer, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { gradeBenchmark } from '@/lib/timer/benchmark'
import { formatDuration, pluralize } from '@/lib/utils'

import { AXIS_TICK, CHART, TOOLTIP_STYLE } from './chartTheme'
import { StreakCalendar } from './components/StreakCalendar'
import { TrophyCase } from './components/TrophyCase'
import { useTrainingData } from './useTrainingData'

export function ProgressPage() {
  const { loading, stats, streak, benchmarks, badges, earnedCount } = useTrainingData()

  const hasHistory = stats.sessionCount > 0
  const latestBenchmark = benchmarks[0]

  const paceSeries = stats.intervalTrend.map((point, index) => ({
    index: index + 1,
    date: new Date(point.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    seconds: Number((point.intervalMs / 1000).toFixed(2)),
  }))

  return (
    <>
      <PageHeader
        title="Progress"
        description="Everything here is derived from the sessions you have actually logged."
      />

      {loading && <p className="text-muted-foreground text-sm">Loading your history…</p>}

      {!loading && !hasHistory && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="bg-accent text-accent-foreground grid size-14 place-items-center rounded-2xl">
              <LineChartIcon className="size-7" aria-hidden />
            </div>
            <div>
              <p className="font-semibold">No sessions yet</p>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-relaxed">
                Complete a drill and this fills in: a weekly streak, your training load, your pace
                over time, and the badges you have earned along the way.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/">Start a drill</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && hasHistory && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={<Flame className="size-4" />}
              label="Week streak"
              value={String(streak.currentStreak)}
              hint={`best ${streak.longestStreak}`}
            />
            <Stat
              icon={<Timer className="size-4" />}
              label="This week"
              value={String(streak.weeklySessionsCount)}
              hint={streak.weeklySessionsCount === 1 ? 'session' : 'sessions'}
            />
            <Stat
              icon={<LineChartIcon className="size-4" />}
              label="Total time"
              value={formatDuration(stats.totalTrainingSec)}
              hint={pluralize(stats.sessionCount, 'session')}
            />
            <Stat
              icon={<Trophy className="size-4" />}
              label="Badges"
              value={`${earnedCount}/${badges.length}`}
              hint="unlocked"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Last 12 weeks</CardTitle>
              <CardDescription>
                A week counts if you trained in it at all. Rest days cost you nothing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StreakCalendar weeks={stats.weekly} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Training load</CardTitle>
              <CardDescription>Minutes trained per week.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weekly} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar
                      dataKey="minutes"
                      name="Minutes"
                      fill={CHART.primary}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {paceSeries.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pace</CardTitle>
                <CardDescription>
                  Average seconds between calls, per session. The axis is inverted so a rising line
                  means a faster caller — improvement always reads as up.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={paceSeries}
                      margin={{ top: 4, right: 8, bottom: 0, left: -10 }}
                    >
                      <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        width={58}
                        domain={['auto', 'auto']}
                        // Two decimals: sessions often sit within 0.1s of each
                        // other, and one decimal collapses them to the same tick.
                        tickFormatter={(value: number) => `${value.toFixed(2)}s`}
                        // Faster is better, so improvement should read as up.
                        reversed
                      />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="seconds"
                        name="Seconds per call"
                        stroke={CHART.rest}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: CHART.rest, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Fitness benchmark</CardTitle>
                <CardDescription>
                  {latestBenchmark
                    ? `Level ${latestBenchmark.levelReached ?? 0} · ${gradeBenchmark(latestBenchmark.levelReached ?? 0).label}`
                    : 'A repeatable number to chase.'}
                </CardDescription>
              </div>
              {latestBenchmark && (
                <span className="tnum shrink-0 text-3xl font-bold">{latestBenchmark.score}</span>
              )}
            </CardHeader>
            <CardContent>
              <Button asChild variant={latestBenchmark ? 'outline' : 'default'} className="w-full">
                <Link to="/benchmark">
                  <Gauge />
                  {latestBenchmark ? 'View history and retest' : 'Take the benchmark'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {stats.perDrill.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal bests</CardTitle>
                <CardDescription>Your best figures for each drill.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-border divide-y">
                  {stats.perDrill.map((drill) => (
                    <li key={drill.drillId} className="py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium">{drill.drillName}</p>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {pluralize(drill.sessions, 'session')}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <span className="tnum">
                          Best <strong className="text-foreground">{drill.bestCalls}</strong> calls
                        </span>
                        {drill.bestIntervalMs && (
                          <span className="tnum">
                            Fastest{' '}
                            <strong className="text-foreground">
                              {(drill.bestIntervalMs / 1000).toFixed(2)}s
                            </strong>{' '}
                            per call
                          </span>
                        )}
                        <span className="tnum">{formatDuration(drill.totalSec)} total</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="text-primary size-4" aria-hidden />
                Trophy case
              </CardTitle>
              <CardDescription>
                <Badge variant="outline">
                  {earnedCount} of {badges.length} unlocked
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrophyCase badges={badges} />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          {icon}
          {label}
        </p>
        <p className="tnum mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
        {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  )
}
