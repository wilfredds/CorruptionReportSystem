import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** All badge colours meet WCAG AA (>= 4.5:1) against their background. */
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-4 py-1.5 text-base font-bold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        paid: 'bg-success/15 text-success ring-2 ring-success/40',
        unpaid: 'bg-destructive/15 text-destructive ring-2 ring-destructive/40',
        partial: 'bg-warning/20 text-warning ring-2 ring-warning/50',
        muted: 'bg-muted text-muted-foreground',
        outline: 'ring-2 ring-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Map a job status to its badge colour. */
export function statusVariant(status: 'PAID' | 'UNPAID' | 'PARTIAL') {
  return status === 'PAID' ? 'paid' : status === 'UNPAID' ? 'unpaid' : 'partial';
}

export { badgeVariants };
