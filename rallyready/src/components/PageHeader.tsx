import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

/**
 * The theme control used to live here, on every screen, as an unlabelled
 * monitor glyph — a second way to set something Profile already owns properly.
 * One home for one setting.
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="type-display text-[2rem] text-balance md:text-4xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground type-lede mt-2 max-w-prose">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
    </header>
  )
}
