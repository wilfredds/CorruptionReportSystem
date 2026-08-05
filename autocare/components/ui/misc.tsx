'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';

/** A large toggle — 40px tall thumb track, easy to hit and easy to see. */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-10 w-[4.5rem] shrink-0 cursor-pointer items-center rounded-full border-2',
      'border-transparent transition-colors focus-visible:outline-none focus-visible:ring-4',
      'focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-success data-[state=unchecked]:bg-muted-foreground/40',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block size-8 rounded-full bg-background shadow-lg ring-0 transition-transform',
        'data-[state=checked]:translate-x-[2.1rem] data-[state=unchecked]:translate-x-1',
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[2px] w-full' : 'h-full w-[2px]',
      className,
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

/** A big, obvious checkbox for the policy acknowledgement. */
export function BigCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex min-h-tap cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors',
        checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent',
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="size-8 shrink-0 cursor-pointer accent-[hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      />
      <span className="text-lg font-semibold">{label}</span>
    </label>
  );
}

/** An empty-state block with a friendly sentence instead of a blank screen. */
export function EmptyState({
  title,
  action,
  icon,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border p-12 text-center">
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <p className="text-xl text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

export { Switch, Separator };
