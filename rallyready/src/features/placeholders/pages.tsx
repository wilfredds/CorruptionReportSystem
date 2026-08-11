import { BookOpen } from 'lucide-react'

import { ComingSoon } from '@/components/ComingSoon'

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
