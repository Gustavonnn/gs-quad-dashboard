import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModuleHeaderProps {
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ModuleHeader({
  eyebrow,
  title,
  accent,
  description,
  icon,
  actions,
  className,
}: ModuleHeaderProps) {
  return (
    <header
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          {icon && <span className="text-[var(--color-gs-blue)]">{icon}</span>}
          <span className="font-mono text-[10px] font-bold uppercase text-[var(--color-gs-muted)]">
            {eyebrow}
          </span>
        </div>
        <h2 className="font-heading text-2xl font-black uppercase leading-none text-[var(--color-gs-text)]">
          {title}
          {accent && <span className="text-[var(--color-gs-blue)]"> {accent}</span>}
        </h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-gs-muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
