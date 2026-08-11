import { Volume2 } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Segmented } from '@/components/ui/segmented'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { CourtBoard } from '@/features/train/components/CourtBoard'
import { TimerDial } from '@/features/train/components/TimerDial'
import { cornerIdsForLayout } from '@/lib/timer/corners'

const CORE_TOKENS = [
  ['--background', 'Page ground'],
  ['--foreground', 'Body text'],
  ['--card', 'Raised surface'],
  ['--muted', 'Quiet surface'],
  ['--muted-foreground', 'Secondary text'],
  ['--border', 'Hairlines'],
  ['--primary', 'The one accent — volt'],
  ['--destructive', 'Irreversible actions'],
] as const

const PHASE_TOKENS = [
  ['--work', 'Work — energetic'],
  ['--rest', 'Rest — calm and cool'],
  ['--sprint', 'Sprint — the hard set'],
  ['--warmup', 'Warm-up'],
  ['--cooldown', 'Cool-down'],
] as const

function Swatch({ token, label }: { token: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="border-border size-11 shrink-0 rounded-lg border"
        style={{ background: `var(${token})` }}
      />
      <div className="min-w-0">
        <p className="truncate font-mono text-xs">{token}</p>
        <p className="text-muted-foreground truncate text-xs">{label}</p>
      </div>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/**
 * Living documentation for the design system (§5). Rendering the real
 * components against the real tokens means this page cannot drift from the app.
 */
export function DesignSystemPage() {
  const [sliderValue, setSliderValue] = useState([1400])
  const [switchOn, setSwitchOn] = useState(true)
  const [segment, setSegment] = useState('work')

  return (
    <>
      <PageHeader
        title="Design system"
        description="The tokens, type and components RallyReady is built from. Everything below is the live component, not a picture of one."
      />

      <div className="space-y-5">
        <Section title="Colour" description="A neutral graphite base and exactly one accent.">
          <div className="grid gap-4 sm:grid-cols-2">
            {CORE_TOKENS.map(([token, label]) => (
              <Swatch key={token} token={token} label={label} />
            ))}
          </div>
        </Section>

        <Section
          title="Phase colours"
          description="Each drill phase owns a colour, so the state of a session is readable across a room."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {PHASE_TOKENS.map(([token, label]) => (
              <Swatch key={token} token={token} label={label} />
            ))}
          </div>
        </Section>

        <Section
          title="Type"
          description="Inter, self-hosted. Timer numerals are tabular so digits never shift width."
        >
          <div className="space-y-3">
            <p className="text-4xl font-bold tracking-tight">Display · 36/700</p>
            <p className="text-2xl font-bold tracking-tight">Heading · 24/700</p>
            <p className="text-base font-semibold">Subheading · 16/600</p>
            <p className="text-sm leading-relaxed">
              Body · 14/400. Long-form guidance sits at this size with generous leading, so coaching
              cues stay readable on a phone at arm&rsquo;s length.
            </p>
            <p className="text-muted-foreground text-xs">Caption · 12/400</p>
            <p className="tnum text-5xl font-extrabold tracking-tighter">01:23:45</p>
          </div>
        </Section>

        <Section title="Buttons" description="Every target is at least 44px on its short edge.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra large</Button>
              <Button size="icon" aria-label="Sound">
                <Volume2 />
              </Button>
            </div>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="work">Work</Badge>
            <Badge variant="rest">Rest</Badge>
            <Badge variant="sprint">Sprint</Badge>
          </div>
        </Section>

        <Section title="Controls">
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <Label htmlFor="ds-slider">Slider</Label>
                <span className="tnum text-muted-foreground text-sm">{sliderValue[0]}ms</span>
              </div>
              <Slider
                id="ds-slider"
                min={800}
                max={3000}
                step={50}
                value={sliderValue}
                onValueChange={setSliderValue}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ds-switch">Switch</Label>
              <Switch id="ds-switch" checked={switchOn} onCheckedChange={setSwitchOn} />
            </div>

            <div className="space-y-2">
              <Label>Segmented — inline</Label>
              <Segmented
                label="Example segmented control"
                value={segment}
                options={[
                  { value: 'work', label: 'Work' },
                  { value: 'rest', label: 'Rest' },
                  { value: 'sprint', label: 'Sprint' },
                ]}
                onChange={setSegment}
              />
            </div>

            <div className="space-y-2">
              <Label>Segmented — stacked</Label>
              <Segmented
                label="Example stacked segmented control"
                layout="stacked"
                value={segment}
                options={[
                  { value: 'work', label: 'Work', hint: 'Energetic accent' },
                  { value: 'rest', label: 'Rest', hint: 'Calm and cool' },
                ]}
                onChange={setSegment}
              />
            </div>
          </div>
        </Section>

        <Section
          title="Court board"
          description="The drill surface. Real half-court proportions; the active zone carries a draining countdown pip and the marker recovers to base."
        >
          <div className="mx-auto h-80 w-full max-w-[18rem]">
            <CourtBoard
              layout={6}
              enabled={cornerIdsForLayout(6)}
              activeCorner="rear-left"
              callProgress={0.35}
              showNumbers
            />
          </div>
        </Section>

        <Section
          title="Timer dial"
          description="Seconds remaining in the current interval, ringed by progress through the whole session."
        >
          <div className="mx-auto w-full max-w-[16rem]">
            <TimerDial
              display="12"
              overallProgress={0.42}
              phase="work"
              phaseLabel="Round 3 of 6"
              detail="18 calls"
            />
          </div>
        </Section>
      </div>
    </>
  )
}
