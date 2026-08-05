'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { hint?: string }
>(({ className, children, hint, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('block text-lg font-semibold text-foreground', className)}
    {...props}
  >
    {children}
    {hint ? <span className="ml-2 text-base font-normal text-muted-foreground">({hint})</span> : null}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

/** Label + control + error message, so forms stay consistent everywhere. */
export function Field({
  label,
  hint,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-base font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { Label };
