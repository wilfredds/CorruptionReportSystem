import { Monitor, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

const LABELS = {
  system: 'Theme: follows your system',
  light: 'Theme: light',
  dark: 'Theme: dark',
} as const

export function ThemeToggle() {
  const { preference, cycle } = useTheme()
  const Icon = preference === 'system' ? Monitor : preference === 'light' ? Sun : Moon

  return (
    <Button variant="ghost" size="icon" onClick={cycle} title={LABELS[preference]}>
      <Icon />
      <span className="sr-only">{LABELS[preference]} — tap to change</span>
    </Button>
  )
}
