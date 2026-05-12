import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'neutral';

const toneClass: Record<Tone, string> = {
  blue: 'bg-[var(--color-gs-blue-dim)] text-[var(--color-gs-blue)]',
  green: 'bg-[var(--color-gs-green-dim)] text-[var(--color-gs-green)]',
  yellow: 'bg-[var(--color-gs-yellow-dim)] text-[var(--color-gs-yellow)]',
  red: 'bg-[var(--color-gs-red-dim)] text-[var(--color-gs-red)]',
  neutral: 'bg-[var(--color-gs-hover-overlay)] text-[var(--color-gs-muted)]',
};

export function StatusBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] px-2 py-1 font-mono text-[9px] font-bold uppercase',
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
