import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-gs-panel border border-gs-border rounded-sm p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${className}`}>
      {children}
    </div>
  )
}

interface BadgeProps {
  children: ReactNode
  variant?: 'ok' | 'warn' | 'live' | 'critical'
}

export function Badge({ children, variant = 'ok' }: BadgeProps) {
  const styles = {
    ok: 'bg-gs-green/10 text-gs-green border-gs-green/20',
    warn: 'bg-gs-yellow/10 text-gs-yellow border-gs-yellow/20',
    live: 'bg-gs-green/20 text-gs-green border-gs-green/30 animate-pulse',
    critical: 'bg-gs-red/10 text-gs-red border-gs-red/20',
  }
  return (
    <span className={`text-[10px] border px-2 py-0.5 rounded-[3px] font-mono font-bold tracking-widest uppercase ${styles[variant]}`}>
      {children}
    </span>
  )
}

interface MetricDisplayProps {
  label: string
  value: string | number
  badge?: ReactNode
  trend?: ReactNode
  barFill?: number
  barColor?: string
}

export function MetricDisplay({ label, value, badge, trend, barFill, barColor = 'bg-gs-blue' }: MetricDisplayProps) {
  return (
    <Card className="flex flex-col gap-3 group hover:border-gs-muted/30 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gs-muted font-mono font-bold tracking-widest uppercase">{label}</span>
        {badge}
      </div>
      <div className="text-3xl font-display font-bold text-gs-text tracking-tight">{value}</div>
      {barFill !== undefined && (
        <div className="h-1 bg-gs-bg w-full rounded-none overflow-hidden mt-1">
          <div className={`${barColor} h-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(barFill * 100, 100)}%` }} />
        </div>
      )}
      {trend && <div className="text-[10px] text-gs-muted font-mono tracking-wide mt-1">{trend}</div>}
    </Card>
  )
}

interface TerminalBoxProps {
  title: string
  children: ReactNode
  onExport?: () => void
}

export function TerminalBox({ title, children, onExport }: TerminalBoxProps) {
  return (
    <div className="bg-gs-bg border border-gs-border rounded-sm flex flex-col shadow-inner">
      <div className="flex items-center justify-between bg-gs-panel border-b border-gs-border px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 opacity-50">
            <span className="w-2 h-2 rounded-full bg-gs-red" />
            <span className="w-2 h-2 rounded-full bg-gs-yellow" />
            <span className="w-2 h-2 rounded-full bg-gs-green" />
          </div>
          <span className="text-[10px] text-gs-muted font-mono font-bold tracking-widest uppercase">{title}</span>
          <span className="w-1.5 h-3 bg-gs-green animate-pulse" />
        </div>
        {onExport && (
          <button onClick={onExport} className="text-[10px] font-mono tracking-widest font-bold text-gs-muted hover:text-gs-text transition-colors uppercase">
            EXPORT_LOGS
          </button>
        )}
      </div>
      <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-gs-text/80">{children}</div>
    </div>
  )
}