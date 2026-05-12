import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'neutral';

const toneVar: Record<Tone, string> = {
  blue: 'var(--color-gs-blue)',
  green: 'var(--color-gs-green)',
  yellow: 'var(--color-gs-yellow)',
  red: 'var(--color-gs-red)',
  neutral: 'var(--color-gs-muted)',
};

interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  tone?: Tone;
  progress?: number;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = 'blue',
  progress,
  loading,
  className,
}: MetricCardProps) {
  const accent = toneVar[tone];

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-[6px] border border-[var(--color-gs-border)] bg-[var(--color-gs-panel)] p-4 shadow-[var(--shadow-card)]',
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[9px] font-bold uppercase text-[var(--color-gs-muted)]">
          {label}
        </span>
        {icon && <span style={{ color: accent }}>{icon}</span>}
      </div>
      {loading ? (
        <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-[var(--color-gs-border)]" />
      ) : (
        <div className="mt-4 font-heading text-3xl font-black leading-none text-[var(--color-gs-text)]">
          {value}
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--color-gs-border)]">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%`, background: accent }}
          />
        </div>
      )}
      {detail && (
        <p className="mt-3 font-mono text-[10px] text-[var(--color-gs-muted)]">{detail}</p>
      )}
    </article>
  );
}
