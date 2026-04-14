import { useState, useEffect, type ReactNode } from 'react'
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  TrendingUp,
  Brain,
  History,
  Factory,
  Menu,
  X,
} from 'lucide-react'

type ViewId = 'visao' | 'curva' | 'monitor' | 'growth' | 'ml_intel' | 'price_history' | 'adfactory'

interface NavItem {
  id: ViewId
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { id: 'visao', label: 'VISÃO GERAL', icon: <LayoutDashboard size={16} strokeWidth={2.5} /> },
  { id: 'curva', label: 'TERMINAL_DB', icon: <BarChart3 size={16} strokeWidth={2.5} /> },
  { id: 'monitor', label: 'MONITOR', icon: <Activity size={16} strokeWidth={2.5} /> },
  { id: 'growth', label: 'GROWTH_PLAN', icon: <TrendingUp size={16} strokeWidth={2.5} /> },
  { id: 'ml_intel', label: 'NEURAL_INTEL', icon: <Brain size={16} strokeWidth={2.5} /> },
  { id: 'price_history', label: 'PRICE_REACTION', icon: <History size={16} strokeWidth={2.5} /> },
  { id: 'adfactory', label: 'ADFACTORY', icon: <Factory size={16} strokeWidth={2.5} /> },
]

/* ── Nav Button ─────────────────────────────────────────── */
function NavButton({
  item,
  isActive,
  expanded,
  alertCount,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  expanded: boolean
  alertCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full flex items-center rounded-md text-left
        font-medium font-mono uppercase tracking-wider
        transition-all duration-[300ms] cursor-pointer
        ${isActive
          ? 'bg-[var(--color-gs-text)] text-[var(--color-gs-bg)] shadow-[0_0_20px_rgba(237,237,237,0.15)]'
          : 'text-[var(--color-gs-muted)] hover:text-[var(--color-gs-text)] hover:bg-[var(--color-gs-border)]/50'
        }
      `}
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[var(--color-gs-green)] rounded-r shadow-[0_0_8px_var(--color-gs-green)]" />
      )}
      <div className="shrink-0 flex items-center justify-center h-9 w-9 rounded-md transition-all duration-[300ms]">
        {item.icon}
      </div>
      <span
        className="flex-1 truncate transition-all duration-300 overflow-hidden whitespace-nowrap"
        style={{
          opacity: expanded ? 1 : 0,
          maxWidth: expanded ? '200px' : '0px',
          transitionDelay: expanded ? '80ms' : '0ms',
          paddingLeft: expanded ? '12px' : '0px',
        }}
      >
        {item.label}
      </span>
      {item.id === 'monitor' && alertCount > 0 && (
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded-[3px] font-bold tracking-widest shrink-0 transition-all duration-300 mr-2 ${
            isActive ? 'bg-[var(--color-gs-red)] text-white' : 'bg-[var(--color-gs-red)]/10 text-[var(--color-gs-red)]'
          }`}
          style={{ opacity: expanded ? 1 : 0 }}
        >
          {alertCount}
        </span>
      )}
    </button>
  )
}

/* ── Desktop Sidebar (Hover-Retractable) ─────────────────── */
function DesktopSidebar({
  activeView,
  onNavigate,
  alertCount,
}: {
  activeView: ViewId
  onNavigate: (view: ViewId) => void
  alertCount: number
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="hidden lg:flex flex-col h-screen shrink-0 bg-[var(--color-gs-panel)] border-r border-[var(--color-gs-border)] overflow-hidden"
      style={{
        width: expanded ? '18rem' : '5rem',
        transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Logo area */}
      <div
        className="h-16 shrink-0 border-b border-[var(--color-gs-border)] bg-[var(--color-gs-bg)] flex items-center"
        style={{
          justifyContent: expanded ? 'flex-start' : 'center',
          paddingLeft: expanded ? '1rem' : '0',
          paddingRight: expanded ? '1rem' : '0',
          transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="flex items-center gap-3 min-w-0"
          style={{
            opacity: expanded ? 1 : 0,
            transition: 'opacity 150ms ease',
            transitionDelay: expanded ? '100ms' : '0ms',
          }}
        >
          <div className="w-8 h-8 bg-[var(--color-gs-text)] text-[var(--color-gs-bg)] flex items-center justify-center font-heading font-bold text-sm uppercase tracking-tighter shrink-0">
            GS
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-heading font-bold text-sm text-[var(--color-gs-text)] tracking-wide leading-none truncate">GS-QUAD</span>
            <span className="font-mono text-[9px] text-[var(--color-gs-muted)] tracking-[0.2em] mt-1">INTEL OPS v2.1</span>
          </div>
        </div>
        {!expanded && (
          <div className="w-8 h-8 bg-[var(--color-gs-text)] text-[var(--color-gs-bg)] flex items-center justify-center font-heading font-bold text-sm uppercase tracking-tighter shrink-0">
            GS
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        <div
          className="font-mono text-[10px] text-[var(--color-gs-muted)] tracking-[0.2em] uppercase mb-3 ml-2 whitespace-nowrap overflow-hidden"
          style={{
            opacity: expanded ? 1 : 0,
            maxWidth: expanded ? '200px' : '0px',
            transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: expanded ? '60ms' : '0ms',
          }}
        >
          Modules
        </div>
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            expanded={expanded}
            alertCount={alertCount}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Status footer */}
      <div
        className="h-[68px] shrink-0 border-t border-[var(--color-gs-border)] bg-[var(--color-gs-bg)] flex items-center px-4 overflow-hidden"
        style={{
          justifyContent: expanded ? 'flex-start' : 'center',
          transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="flex items-center gap-3"
          style={{
            opacity: expanded ? 1 : 0,
            transition: 'opacity 150ms ease',
            transitionDelay: expanded ? '100ms' : '0ms',
          }}
        >
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-gs-green)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-gs-green)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold text-[var(--color-gs-green)] tracking-[0.2em]">SYSTEM ONLINE</span>
            <span className="font-mono text-[9px] text-[var(--color-gs-muted)] tracking-widest mt-0.5">LATENCY 42ms · WS</span>
          </div>
        </div>
        {!expanded && (
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-gs-green)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-gs-green)]" />
          </div>
        )}
      </div>
    </aside>
  )
}

/* ── Mobile Drawer ───────────────────────────────────────── */
function MobileDrawer({
  activeView,
  onNavigate,
  alertCount,
  mobileOpen,
  setMobileOpen,
}: {
  activeView: ViewId
  onNavigate: (view: ViewId) => void
  alertCount: number
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}) {
  return (
    <div className="lg:hidden">
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className="fixed top-0 left-0 z-50 h-full w-72 bg-[var(--color-gs-panel)] border-r border-[var(--color-gs-border)] flex flex-col transition-transform duration-[300ms]"
        style={{
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-gs-border)] bg-[var(--color-gs-bg)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-gs-text)] text-[var(--color-gs-bg)] flex items-center justify-center font-heading font-bold text-sm uppercase tracking-tighter shrink-0">GS</div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-sm text-[var(--color-gs-text)] tracking-wide leading-none">GS-QUAD</span>
              <span className="font-mono text-[9px] text-[var(--color-gs-muted)] tracking-widest mt-1">INTEL OPS v2.1</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded text-[var(--color-gs-muted)] hover:text-[var(--color-gs-text)] hover:bg-[var(--color-gs-border)] transition-colors" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setMobileOpen(false) }}
              className={`
                group relative w-full flex items-center gap-3 px-3 py-3 rounded-md text-left
                font-medium font-mono uppercase tracking-wider
                transition-all duration-200
                ${activeView === item.id
                  ? 'bg-[var(--color-gs-text)] text-[var(--color-gs-bg)] shadow-[0_0_20px_rgba(237,237,237,0.15)]'
                  : 'text-[var(--color-gs-muted)] hover:text-[var(--color-gs-text)] hover:bg-[var(--color-gs-border)]/50'
                }
              `}
            >
              {activeView === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[var(--color-gs-green)] rounded-r shadow-[0_0_8px_var(--color-gs-green)]" />
              )}
              <span className={activeView === item.id ? 'text-[var(--color-gs-bg)]' : 'text-[var(--color-gs-muted)] group-hover:text-[var(--color-gs-text)]'}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.id === 'monitor' && alertCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] font-bold tracking-widest bg-[var(--color-gs-red)]/10 text-[var(--color-gs-red)]">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-gs-border)] bg-[var(--color-gs-bg)] shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-gs-green)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-gs-green)]" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-bold text-[var(--color-gs-green)] tracking-[0.2em]">SYSTEM ONLINE</span>
              <span className="font-mono text-[9px] text-[var(--color-gs-muted)] tracking-widest mt-0.5">LATENCY 42ms · WS</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

/* ── Sidebar (exported) ──────────────────────────────────── */
interface SidebarProps {
  activeView: ViewId
  onNavigate: (view: ViewId) => void
  alertCount?: number
}

export function Sidebar({ activeView, onNavigate, alertCount = 0 }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <DesktopSidebar activeView={activeView} onNavigate={onNavigate} alertCount={alertCount} />

      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-5 left-4 z-[60] p-2 rounded-md bg-[var(--color-gs-panel)] border border-[var(--color-gs-border)] text-[var(--color-gs-text)] hover:bg-[var(--color-gs-border)] transition-colors shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <MobileDrawer
        activeView={activeView}
        onNavigate={onNavigate}
        alertCount={alertCount}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
    </>
  )
}

/* ── Topbar ─────────────────────────────────────────────── */
interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-[var(--color-gs-border)] bg-[var(--color-gs-bg)]/90 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex flex-col animate-slide-up pl-8 lg:pl-0" style={{ animationDelay: '50ms' }}>
        <h1 className="font-heading font-bold text-lg text-[var(--color-gs-text)] tracking-wide leading-none">
          {title}<span className="text-[var(--color-gs-green)] ml-0.5">.</span>
        </h1>
        {subtitle && (
          <p className="font-mono text-[10px] text-[var(--color-gs-muted)] tracking-[0.15em] mt-1 uppercase hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="text-right flex flex-col">
          <span className="font-mono text-[10px] font-bold text-[var(--color-gs-text)] tracking-wider uppercase hidden sm:block">ADMIN COMMAND</span>
          <span className="font-mono text-[9px] text-[var(--color-gs-muted)] tracking-wide mt-0.5">ID: 8077295</span>
        </div>
        <div className="w-8 h-8 rounded-sm bg-[var(--color-gs-panel)] border border-[var(--color-gs-border)] flex items-center justify-center font-heading text-xs font-bold text-[var(--color-gs-text)] shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          C
        </div>
      </div>
    </header>
  )
}

/* ── Layout ──────────────────────────────────────────────── */
interface LayoutProps {
  children: ReactNode
  activeView: ViewId
  onNavigate: (view: ViewId) => void
  alertCount?: number
}

const VIEW_TITLES: Record<ViewId, { title: string; subtitle: string }> = {
  visao: { title: 'WAR_ROOM', subtitle: 'N8N CLOUD ↔ SUPABASE REALTIME ↔ CLAUDE AI' },
  curva: { title: 'TERMINAL_DB', subtitle: 'CATÁLOGO COMPLETO • SISTEMA DE BANCO DE DADOS' },
  monitor: { title: 'MONITOR', subtitle: 'ALERTAS OPERACIONAIS • SINAIS DE RUPTURA' },
  growth: { title: 'GROWTH_PLAN', subtitle: 'ESTRATÉGIAS VALIDADAS • PLAYBOOK INTELIGENTE' },
  ml_intel: { title: 'NEURAL_INTEL', subtitle: 'MACHINE LEARNING • PREVISÕES E CLUSTERS' },
  price_history: { title: 'PRICE_REACTION', subtitle: 'TIMELINE DE PREÇOS • ABSORÇÃO DE MERCADO' },
  adfactory: { title: 'ADFACTORY', subtitle: 'KANBAN HÍBRIDO • CRIAÇÃO INTELIGENTE DE ANÚNCIOS' },
}

export function Layout({ children, activeView, onNavigate, alertCount }: LayoutProps) {
  const viewInfo = VIEW_TITLES[activeView]

  return (
    <div className="flex h-screen bg-[var(--color-gs-deep)] text-[var(--color-gs-text)] overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={onNavigate} alertCount={alertCount} />
      <div className="flex-1 flex flex-col relative min-w-0">
        <Topbar title={viewInfo.title} subtitle={viewInfo.subtitle} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-fade-in w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
