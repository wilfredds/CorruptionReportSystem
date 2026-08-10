import { BookOpen, CalendarRange, LineChart } from 'lucide-react'

import { ComingSoon } from '@/components/ComingSoon'

export function ProgressPage() {
  return (
    <ComingSoon
      title="Progress"
      description="Streaks, personal bests and trends over time."
      phase="Phase 2"
      icon={LineChart}
      planned={[
        'Streak calendar on a weekly cadence, so one missed day costs you nothing',
        'Sessions per week, and personal bests per drill',
        'Trend charts for circuit times and endurance',
        'The B-ENDURANCE-style benchmark test, with a score to chase',
        'A trophy case of badges',
      ]}
    />
  )
}

export function ProgramsPage() {
  return (
    <ComingSoon
      title="Programs"
      description="Periodised multi-week plans for getting back to match fitness."
      phase="Phase 4"
      icon={CalendarRange}
      planned={[
        '8–12 week returning-player programs: Base → Build → Sharpen → Deload',
        '3–5 sessions a week mixing footwork, conditioning and genuine rest days',
        '“Today’s session” surfaced on the home screen',
        'Volume adapted to your level and whether you have court access',
        'Publish your own program for other players to follow',
      ]}
    />
  )
}

export function LibraryPage() {
  return (
    <ComingSoon
      title="Library"
      description="A vetted reference so you never have to go hunting on YouTube."
      phase="Phase 5"
      icon={BookOpen}
      planned={[
        'Filter by category, level, solo or partner, court or home, and duration',
        'Short reference clips from reputable coaches and federations',
        'Coaching cues, common faults and recommended reps on every entry',
        'One tap to start any entry as a timed drill, pre-configured',
      ]}
    />
  )
}
