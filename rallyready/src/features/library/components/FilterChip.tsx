import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
}

/**
 * A filter value as a toggle. `aria-pressed` rather than a checkbox because
 * these read as one control each, and a screen reader announcing "pressed" is
 * exactly what a chip means.
 */
export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'focus-visible:ring-ring focus-visible:ring-offset-background rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:bg-secondary/60',
      )}
    >
      {label}
    </button>
  )
}
