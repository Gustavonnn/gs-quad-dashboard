import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gs-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-gs-bg)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-gs-green)] text-white shadow-[0_1px_3px_rgba(52,131,250,0.2)] hover:shadow-[0_4px_12px_rgba(52,131,250,0.3)]',
        destructive:
          'bg-[var(--color-gs-red)] text-white shadow-[0_1px_3px_rgba(255,68,68,0.2)] hover:shadow-[0_4px_12px_rgba(255,68,68,0.3)]',
        outline:
          'border border-[var(--color-gs-border)] bg-transparent text-[var(--color-gs-text)] hover:bg-[var(--color-gs-border)]/50 hover:border-[var(--color-gs-muted)]',
        secondary:
          'bg-[var(--color-gs-border)] text-[var(--color-gs-text)] hover:bg-[var(--color-gs-border)]/80',
        ghost:
          'text-[var(--color-gs-muted)] hover:text-[var(--color-gs-text)] hover:bg-[var(--color-gs-border)]/50',
        link: 'text-[var(--color-gs-green)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
