import { useState, useEffect, useRef, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  TrendingUp,
  Brain,
  History,
  Database,
  Zap,
  RefreshCw,
  Search,
  Settings,
  Menu,
  X,
  Command,
  Target,
  Radar,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { getRouteMeta } from '@/app/routes'
import { ThemeToggle } from '@/components/ThemeToggle'

interface NavItem {
  id: string
  label: string
  sublabel?: string
  icon: ReactNode
  path: string
  group: 'INTEL' | 'FERRAMENTAS' | 'SISTEMA'
  accent?: 'green' | 'amber' | 'red'
}

const MODULE_ITEMS: NavItem[] = [
  { id: 'visao',    label: 'WAR_ROOM',      sublabel: 'Visão geral',       icon: <LayoutDashboard size={15} strokeWidth={2} />, path: '/',          group: 'INTEL' },
  { id: 'terminal', label: 'TERMINAL_DB',   sublabel: 'Catálogo SKU',      icon: <BarChart3        size={15} strokeWidth={2} />, path: '/terminal',  group: 'INTEL' },
  { id: 'monitor',  label: 'MONITOR',       sublabel: 'Alertas táticos',   icon: <Activity         size={15} strokeWidth={2} />, path: '/monitor',   group: 'INTEL' },
  { id: 'growth',   label: 'GROWTH_PLAN',   sublabel: 'Playbook',          icon: <TrendingUp       size={15} strokeWidth={2} />, path: '/growth',    group: 'INTEL' },
  { id: 'ml',       label: 'NEURAL_INTEL',  sublabel: 'ML · Previsões',    icon: <Brain            size={15} strokeWidth={2} />, path: '/ml',        group: 'INTEL' },
  { id: 'price',    label: 'PRICE_REACT',   sublabel: 'Timeline preços',   icon: <History          size={15} strokeWidth={2} />, path: '/price',     group: 'INTEL' },
  { id: 'adsradar', label: 'ADS_RADAR',     sublabel: 'Performance ads',   icon: <Radar            size={15} strokeWidth={2} />, path: '/ads-radar', group: 'INTEL', accent: 'green' },
]

const TOOL_ITEMS: NavItem[] = [
  { id: 'explorer',   label: 'DATA_EXPLORER', sublabel: 'Query Supabase',  icon: <Database   size={15} strokeWidth={2} />, path: '/explorer',  group: 'FERRAMENTAS' },
  { id: 'activity',   label: 'ACTIVITY',      sublabel: 'Event timeline',  icon: <Zap        size={15} strokeWidth={2} />, path: '/activity',  group: 'FERRAMENTAS' },
  { id: 'sync',       label: 'SYNC_CTRL',     sublabel: 'DuckDB pipeline', icon: <RefreshCw  size={15} strokeWidth={2} />, path: '/sync',      group: 'FERRAMENTAS' },
  { id: 'adfactory',  label: 'AD_FACTORY',    sublabel: 'Kanban ads',      icon: <Target     size={15} strokeWidth={2} />, path: '/adfactory', group: 'FERRAMENTAS' },
  { id: 'search',     label: 'GLOBAL_SRCH',   sublabel: 'Busca integrada', icon: <Search     size={15} strokeWidth={2} />, path: '/search',    group: 'FERRAMENTAS' },
]

const SYSTEM_ITEMS: NavItem[] = [
  { id: 'settings', label: 'SETTINGS', sublabel: 'Preferências', icon: <Settings size={15} strokeWidth={2} />, path: '/settings', group: 'SISTEMA' },
]

// ─── Nav Button ───────────────────────────────────────────────────────────────

function NavButton({ item, expanded }: { item: NavItem; expanded: boolean }) {
  return (
    <NavLink
      to={item.path}
      title={!expanded ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center w-full rounded-[3px] transition-all duration-200 ease-out overflow-hidden select-none ${
          isActive
            ? 'bg-[var(--color-gs-text)] text-[var(--color-gs-bg)]'
            : 'text-[var(--color-gs-muted)] hover:text-[var(--color-gs-text)] hover:bg-white/[0.05]'
        }`
      }
      style={{ textDecoration: 'none', height: '36px' }}
    >
      {({ isActive }) => (
        <>
          {/* Active accent line */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[var(--color-gs-green)] rounded-r"
              style={{ boxShadow: '0 0 8px var(--color-gs-green)' }}
            />
          )}

          {/* New badge accent */}
          {item.accent === 'green' && !isActive && (
            <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-[var(--color-gs-green)] opacity-70"
              style={{ boxShadow: '0 0 4px var(--color-gs-green)' }}
            />
          )}

          {/* Icon cell */}
          <div className="shrink-0 w-10 h-full flex items-center justify-center">
            <span className={`transition-all duration-200 ${isActive ? 'text-[var(--color-gs-bg)]' : 'text-[var(--color-gs-muted)] group-hover:text-[var(--color-gs-text)]'}`}>
              {item.icon}
            </span>
          </div>

          {/* Label + sublabel */}
          <div
            className="flex flex-col justify-center overflow-hidden"
            style={{
              opacity: expanded ? 1 : 0,
              width: expanded ? '160px' : '0px',
              transition: 'opacity 180ms ease, width 280ms cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: expanded ? '60ms' : '0ms',
            }}
          >
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase leading-none whitespace-nowrap truncate">
              {item.label}
            </span>
            {item.sublabel && (
              <span className={`text-[9px] font-mono tracking-wide mt-0.5 whitespace-nowrap truncate ${isActive ? 'opacity-60' : 'text-[var(--color-gs-muted)] opacity-70'}`}>
                {item.sublabel}
              </span>
            )}
          </div>
        </>
      )}
    </NavLink>
  )
}

// ─── Nav Group ────────────────────────────────────────────────────────────────

function NavGroup({ items, label, expanded }: { items: NavItem[]; label: string; expanded: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div
        className="overflow-hidden whitespace-nowrap"
        style={{
          opacity: expanded ? 1 : 0,
          maxHeight: expanded ? '20px' : '0px',
          marginBottom: expanded ? '4px' : '6px',
          transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: expanded ? '40ms' : '0ms',
        }}
      >
        <span className="font-mono text-[8px] text-[var(--color-gs-muted)] tracking-[0.25em] uppercase px-2 opacity-50">
          {label}
        </span>
      </div>
      {items.map(item => (
        <NavButton key={item.id} item={item} expanded={expanded} />
      ))}
    </div>
  )
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar() {
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setHovered(true)
  }

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setHovered(false), 120)
  }

  const expanded = hovered
  const W_EXPANDED = '220px'
  const W_COLLAPSED = '52px'

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="hidden lg:flex flex-col h-screen shrink-0 relative z-20"
      style={{
        width: expanded ? W_EXPANDED : W_COLLAPSED,
        transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'var(--color-gs-panel)',
        borderRight: '1px solid var(--color-gs-border)',
      }}
    >
      {/* Ambient top glow when expanded */}
      {expanded && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,102,0.3), transparent)', opacity: 0.8 }}
        />
      )}

      {/* ── Logo Zone ── */}
      <div
        className="shrink-0 flex items-center overflow-hidden"
        style={{
          height: '60px',
          borderBottom: '1px solid var(--color-gs-border)',
          padding: '0 6px',
        }}
      >
        {/* Logo mark — always visible */}
        <div
          className="shrink-0 flex items-center justify-center font-heading font-black text-[11px] uppercase tracking-tighter"
          style={{
            width: '40px',
            height: '40px',
            background: 'var(--color-gs-text)',
            color: 'var(--color-gs-bg)',
            borderRadius: '2px',
            letterSpacing: '-0.05em',
            flexShrink: 0,
          }}
        >
          GS
        </div>

        {/* Brand text */}
        <div
          className="overflow-hidden"
          style={{
            opacity: expanded ? 1 : 0,
            width: expanded ? '150px' : '0px',
            transition: 'opacity 160ms ease, width 280ms cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: expanded ? '80ms' : '0ms',
            paddingLeft: expanded ? '10px' : '0px',
          }}
        >
          <div className="font-heading font-black text-sm tracking-wide leading-none whitespace-nowrap" style={{ color: 'var(--color-gs-text)' }}>
            GS-QUAD
          </div>
          <div className="font-mono text-[8px] tracking-[0.22em] uppercase mt-1 whitespace-nowrap" style={{ color: 'var(--color-gs-muted)' }}>
            INTEL OPS v2.1
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 flex flex-col gap-4"
        style={{ padding: '12px 6px' }}
      >
        <NavGroup items={MODULE_ITEMS} label="Intel" expanded={expanded} />
        <div style={{ height: '1px', background: 'var(--color-gs-border)', margin: '2px 0', opacity: 0.5 }} />
        <NavGroup items={TOOL_ITEMS} label="Ferramentas" expanded={expanded} />
        <div style={{ height: '1px', background: 'var(--color-gs-border)', margin: '2px 0', opacity: 0.5 }} />
        <NavGroup items={SYSTEM_ITEMS} label="Sistema" expanded={expanded} />
      </nav>

      {/* ── System Status Footer ── */}
      <div
        className="shrink-0 overflow-hidden"
        style={{
          borderTop: '1px solid var(--color-gs-border)',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 6px',
          gap: '8px',
        }}
      >
        {/* Pulse dot — always visible */}
        <div className="relative flex shrink-0" style={{ width: '40px', justifyContent: 'center' }}>
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-60"
            style={{ backgroundColor: 'var(--color-gs-green)' }}
          />
          <span className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: 'var(--color-gs-green)' }}
          />
        </div>

        {/* Status text */}
        <div
          className="overflow-hidden"
          style={{
            opacity: expanded ? 1 : 0,
            width: expanded ? '160px' : '0px',
            transition: 'opacity 160ms ease, width 280ms cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: expanded ? '80ms' : '0ms',
          }}
        >
          <div className="font-mono text-[9px] font-bold tracking-[0.18em] uppercase whitespace-nowrap"
            style={{ color: 'var(--color-gs-green)' }}>
            SYSTEM ONLINE
          </div>
          <div className="font-mono text-[8px] tracking-widest mt-0.5 whitespace-nowrap"
            style={{ color: 'var(--color-gs-muted)' }}>
            LATENCY 42ms · WS
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 left-0 z-50 h-full flex flex-col"
        style={{
          width: '260px',
          background: 'var(--color-gs-panel)',
          borderRight: '1px solid var(--color-gs-border)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 shrink-0"
          style={{ height: '60px', borderBottom: '1px solid var(--color-gs-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center font-heading font-black text-[11px] uppercase"
              style={{ background: 'var(--color-gs-text)', color: 'var(--color-gs-bg)', borderRadius: '2px' }}>
              GS
            </div>
            <div>
              <div className="font-heading font-black text-sm tracking-wide" style={{ color: 'var(--color-gs-text)', lineHeight: 1 }}>GS-QUAD</div>
              <div className="font-mono text-[8px] tracking-[0.2em] mt-1" style={{ color: 'var(--color-gs-muted)' }}>INTEL OPS v2.1</div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-gs-muted)' }}
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-4" style={{ padding: '12px 8px' }}>
          {[
            { label: 'Intel', items: MODULE_ITEMS },
            { label: 'Ferramentas', items: TOOL_ITEMS },
            { label: 'Sistema', items: SYSTEM_ITEMS },
          ].map(({ label, items }) => (
            <div key={label}>
              <div className="font-mono text-[8px] tracking-[0.25em] uppercase px-2 mb-2 opacity-40"
                style={{ color: 'var(--color-gs-muted)' }}>
                {label}
              </div>
              <div className="flex flex-col gap-0.5">
                {items.map(item => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-3 py-2.5 rounded-[3px] font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-150 ${
                        isActive
                          ? 'bg-[var(--color-gs-text)] text-[var(--color-gs-bg)]'
                          : 'text-[var(--color-gs-muted)] hover:text-[var(--color-gs-text)] hover:bg-white/5'
                      }`
                    }
                    style={{ textDecoration: 'none' }}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r"
                            style={{ background: 'var(--color-gs-green)', boxShadow: '0 0 6px var(--color-gs-green)' }}
                          />
                        )}
                        <span className={isActive ? 'text-[var(--color-gs-bg)]' : 'text-[var(--color-gs-muted)]'}>{item.icon}</span>
                        <div className="flex flex-col">
                          <span>{item.label}</span>
                          {item.sublabel && <span className="text-[8px] capitalize font-normal opacity-60 mt-0.5">{item.sublabel}</span>}
                        </div>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
              <div className="my-3" style={{ height: '1px', background: 'var(--color-gs-border)', opacity: 0.4 }} />
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 flex items-center gap-3 px-4"
          style={{ height: '52px', borderTop: '1px solid var(--color-gs-border)' }}>
          <div className="relative flex">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-60"
              style={{ backgroundColor: 'var(--color-gs-green)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: 'var(--color-gs-green)' }} />
          </div>
          <div>
            <div className="font-mono text-[9px] font-bold tracking-[0.18em] uppercase"
              style={{ color: 'var(--color-gs-green)' }}>SYSTEM ONLINE</div>
            <div className="font-mono text-[8px] tracking-widest mt-0.5"
              style={{ color: 'var(--color-gs-muted)' }}>LATENCY 42ms · WS</div>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const openCommandPalette = useUIStore(s => s.openCommandPalette)
  const location = useLocation()
  const routeMeta = getRouteMeta(location.pathname)

  return (
    <header
      className="shrink-0 flex items-center justify-between sticky top-0 z-30"
      style={{
        height: '60px',
        padding: '0 24px',
        borderBottom: '1px solid var(--color-gs-border)',
        background: 'rgba(3,3,3,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Left: mobile menu + route title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-gs-muted)' }}
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex flex-col" style={{ gap: '2px' }}>
          <h1 className="font-heading font-black tracking-wide leading-none" style={{ fontSize: '15px', color: 'var(--color-gs-text)' }}>
            {routeMeta?.title || 'GS-QUAD'}
            <span style={{ color: 'var(--color-gs-green)', marginLeft: '2px' }}>.</span>
          </h1>
          {routeMeta?.subtitle && (
            <p className="font-mono uppercase tracking-[0.18em] hidden sm:block"
              style={{ fontSize: '9px', color: 'var(--color-gs-muted)', opacity: 0.7 }}>
              {routeMeta.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: search + theme */}
      <div className="flex items-center gap-2">
        <button
          onClick={openCommandPalette}
          className="hidden sm:flex items-center gap-2 transition-all"
          style={{
            height: '34px',
            padding: '0 12px',
            borderRadius: '3px',
            border: '1px solid var(--color-gs-border)',
            background: 'transparent',
            color: 'var(--color-gs-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-gs-muted)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-gs-text)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-gs-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-gs-muted)' }}
        >
          <Command size={12} />
          <span>Buscar</span>
          <kbd style={{
            marginLeft: '8px',
            fontSize: '9px',
            border: '1px solid var(--color-gs-border)',
            borderRadius: '2px',
            padding: '1px 5px',
            color: 'var(--color-gs-muted)',
          }}>⌘K</kbd>
        </button>

        <ThemeToggle />
      </div>
    </header>
  )
}

// ─── Layout Root ──────────────────────────────────────────────────────────────

export function Layout({ children }: { children: ReactNode }) {
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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-gs-deep)', color: 'var(--color-gs-text)' }}>
      <DesktopSidebar />

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div
            className="animate-fade-in"
            style={{
              padding: '28px 28px 40px',
              maxWidth: '1680px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
