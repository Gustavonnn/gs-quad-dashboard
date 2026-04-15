import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold tracking-widest uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-gs-green)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--color-gs-green)] text-[var(--color-gs-bg)]',
        secondary: 'border-transparent bg-[var(--color-gs-border)] text-[var(--color-gs-text)]',
        destructive: 'border-transparent bg-[var(--color-gs-red)] text-white',
        outline: 'text-[var(--color-gs-text)] border-[var(--color-gs-border)]',
        success: 'border-transparent bg-[var(--color-gs-green)]/20 text-[var(--color-gs-green)]',
        warning: 'border-transparent bg-[var(--color-gs-yellow)]/20 text-[var(--color-gs-yellow)]',
        danger: 'border-transparent bg-[var(--color-gs-red)]/20 text-[var(--color-gs-red)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
