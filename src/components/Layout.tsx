import type { ReactNode } from 'react'
import { LayoutDashboard, BarChart3, Activity, TrendingUp, MessageSquare, Brain, History } from 'lucide-react'

type ViewId = 'visao' | 'curva' | 'monitor' | 'growth' | 'ml_intel' | 'price_history'

interface NavItem {
  id: ViewId
  label: string
  icon: ReactNode
  badge?: number
}

interface SidebarProps {
  activeView: ViewId
  onNavigate: (view: ViewId) => void
  alertCount?: number
}

const navItems: NavItem[] = [
  { id: 'visao', label: 'VISÃO GERAL', icon: <LayoutDashboard size={14} strokeWidth={2.5} /> },
  { id: 'curva', label: 'TERMINAL_DB', icon: <BarChart3 size={14} strokeWidth={2.5} /> },
  { id: 'monitor', label: 'MONITOR', icon: <Activity size={14} strokeWidth={2.5} />, badge: 0 },
  { id: 'growth', label: 'GROWTH_PLAN', icon: <TrendingUp size={14} strokeWidth={2.5} /> },
  { id: 'ml_intel', label: 'NEURAL_INTEL', icon: <Brain size={14} strokeWidth={2.5} /> },
  { id: 'price_history', label: 'PRICE_REACTION', icon: <History size={14} strokeWidth={2.5} /> },
]

export function Sidebar({ activeView, onNavigate, alertCount = 0 }: SidebarProps) {
  return (
    <aside className="w-64 bg-gs-panel border-r border-gs-border flex flex-col h-screen shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gs-border bg-gs-bg">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 bg-gs-text text-gs-bg flex items-center justify-center font-display font-bold text-xs uppercase tracking-tighter">
            GS
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm text-gs-text tracking-wide leading-none">GS-QUAD</span>
            <span className="font-mono text-[9px] text-gs-muted tracking-widest mt-1">INTEL OPS v2.1</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="font-mono text-[10px] text-gs-muted tracking-widest uppercase mb-4 ml-2">Modules</div>
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-xs font-medium font-mono uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-gs-text text-gs-bg'
                  : 'text-gs-muted hover:text-gs-text hover:bg-gs-border/50'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span className="flex-1">{item.label}</span>
              {item.id === 'monitor' && alertCount > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-[3px] font-bold tracking-widest ${
                  isActive ? 'bg-gs-red text-white' : 'bg-gs-red/10 text-gs-red'
                }`}>
                  {alertCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gs-border bg-gs-bg">
        <div className="flex items-center gap-3 px-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gs-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gs-green"></span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold text-gs-green tracking-widest">SYSTEM ONLINE</span>
            <span className="font-mono text-[9px] text-gs-muted tracking-widest mt-0.5">LATENCY 42ms · WS</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-gs-border bg-gs-bg/90 backdrop-blur-md sticky top-0 z-50">
      <div className="flex flex-col animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h1 className="font-display font-bold text-lg text-gs-text tracking-wide">
          {title}<span className="text-gs-red ml-0.5">.</span>
        </h1>
        {subtitle && <p className="font-mono text-[10px] text-gs-muted tracking-widest mt-1 uppercase">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="text-right flex flex-col">
          <span className="font-mono text-[10px] font-bold text-gs-text tracking-wider uppercase">ADMIN COMMAND</span>
          <span className="font-mono text-[9px] text-gs-muted tracking-wide mt-0.5">ID: 8077295</span>
        </div>
        <div className="w-8 h-8 rounded-sm bg-gs-panel border border-gs-border flex items-center justify-center font-display text-xs font-bold text-gs-text shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          C
        </div>
      </div>
    </header>
  )
}

interface LayoutProps {
  children: ReactNode
  activeView: ViewId
  onNavigate: (view: ViewId) => void
  alertCount?: number
}

export function Layout({ children, activeView, onNavigate, alertCount }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gs-bg text-gs-text font-inter overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={onNavigate} alertCount={alertCount} />
      <div className="flex-1 flex flex-col relative">
        <Topbar title="WAR_ROOM" subtitle="N8N CLOUD ↔ SUPABASE REALTIME ↔ CLAUDE AI" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gs-bg">
          <div className="p-8 max-w-[1600px] mx-auto animate-fade-in w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}