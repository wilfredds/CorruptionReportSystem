import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      // 44px tall and 16px text: anything smaller and iOS zooms the page on focus.
      'border-input bg-background focus-visible:ring-ring placeholder:text-muted-foreground h-11 w-full rounded-lg border px-3 text-base focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'
