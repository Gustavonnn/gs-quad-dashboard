import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-[6px] border border-dashed border-[var(--color-gs-border)] p-6 text-center">
      {icon && <div className="text-[var(--color-gs-muted)]">{icon}</div>}
      <div>
        <p className="font-heading text-sm font-extrabold uppercase text-[var(--color-gs-text)]">
          {title}
        </p>
        {description && <p className="mt-1 text-sm text-[var(--color-gs-muted)]">{description}</p>}
      </div>
    </div>
  );
}
