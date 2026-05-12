import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DataPanelProps {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DataPanel({
  title,
  eyebrow,
  action,
  children,
  className,
  contentClassName,
}: DataPanelProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[6px] border border-[var(--color-gs-border)] bg-[var(--color-gs-panel)] shadow-[var(--shadow-card)]',
        className
      )}
    >
      {(title || eyebrow || action) && (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--color-gs-border)] px-4 py-3">
          <div className="min-w-0">
            {eyebrow && (
              <div className="font-mono text-[9px] font-bold uppercase text-[var(--color-gs-muted)]">
                {eyebrow}
              </div>
            )}
            {title && (
              <h3 className="truncate font-heading text-sm font-extrabold uppercase text-[var(--color-gs-text)]">
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-4', contentClassName)}>{children}</div>
    </section>
  );
}
