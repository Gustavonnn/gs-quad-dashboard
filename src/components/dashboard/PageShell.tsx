import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-5 animate-fade-in', className)}>{children}</section>
  );
}
