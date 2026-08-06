import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Every size here is at least 64px tall — the elderly-first tap-target minimum.
 * There is no icon-only variant on purpose: buttons always carry a text label.
 */
const buttonVariants = cva(
  'press relative overflow-hidden inline-flex items-center justify-center gap-3 whitespace-nowrap ' +
    'rounded-lg font-semibold ' +
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:pointer-events-none disabled:opacity-60 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        /** The orange hero button, with a slow sheen so it reads as THE action. */
        hero: 'brand-gradient text-primary-foreground shadow-lg hover:brightness-110',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm',
        outline:
          'border-2 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        success: 'bg-success text-success-foreground hover:bg-success/90 shadow-sm',
        link: 'text-primary underline underline-offset-4 hover:no-underline',
      },
      size: {
        // 64px — the floor for anything tappable.
        default: 'min-h-tap px-6 py-3 text-lg [&_svg]:size-6',
        // 80px — for primary page actions.
        lg: 'min-h-[5rem] px-8 py-4 text-xl [&_svg]:size-7',
        // 96px — reserved for "Record New Job", the biggest button on screen.
        hero: 'min-h-[6rem] w-full px-8 py-6 text-2xl [&_svg]:size-9',
        // Still 64px tall, just narrower; used inside table rows.
        compact: 'min-h-tap px-4 py-3 text-base [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
