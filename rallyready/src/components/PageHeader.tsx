import type { ReactNode } from 'react'

import { ThemeToggle } from '@/components/ThemeToggle'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  /** Hide the theme control on screens that supply their own actions. */
  hideThemeToggle?: boolean
}

export function PageHeader({ title, description, action, hideThemeToggle }: PageHeaderProps) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {action}
        {!hideThemeToggle && <ThemeToggle />}
      </div>
    </header>
  )
}
