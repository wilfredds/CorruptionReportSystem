import type { LucideIcon } from 'lucide-react'

import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

interface ComingSoonProps {
  title: string
  description: string
  phase: string
  icon: LucideIcon
  planned: string[]
}

/**
 * Placeholder for the sections that later phases fill in. It states plainly
 * what is coming and when, rather than pretending to be a finished screen.
 */
export function ComingSoon({ title, description, phase, icon: Icon, planned }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="bg-accent text-accent-foreground grid size-14 place-items-center rounded-2xl">
            <Icon className="size-7" aria-hidden />
          </div>
          <div>
            <p className="font-semibold">Arriving in {phase}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              The drill trainer, progress tracking and the fitness benchmark are complete and ready
              to use now.
            </p>
          </div>
          <ul className="text-muted-foreground w-full max-w-sm space-y-2 text-left text-sm">
            {planned.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="bg-primary mt-[0.4375rem] size-1.5 shrink-0 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  )
}
