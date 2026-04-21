import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useUIStore } from '@/stores/uiStore';
import { useCurvaABC } from '@/hooks';
import { Badge } from '@/components/ui';
import {
  Search,
  LayoutDashboard,
  BarChart3,
  Activity,
  TrendingUp,
  Brain,
  History,
  Settings,
  Database,
  Zap,
  RefreshCw,
  Megaphone,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Visão Geral', icon: LayoutDashboard, path: '/', group: 'Navegação' },
  { label: 'Terminal DB', icon: BarChart3, path: '/terminal', group: 'Navegação' },
  { label: 'Monitor', icon: Activity, path: '/monitor', group: 'Navegação' },
  { label: 'Growth Plan', icon: TrendingUp, path: '/growth', group: 'Navegação' },
  { label: 'Neural Intel', icon: Brain, path: '/ml', group: 'Navegação' },
  { label: 'Price Reaction', icon: History, path: '/price', group: 'Navegação' },
  { label: 'Data Explorer', icon: Database, path: '/explorer', group: 'Ferramentas' },
  { label: 'Activity Feed', icon: Zap, path: '/activity', group: 'Ferramentas' },
  { label: 'Sync Control', icon: RefreshCw, path: '/sync', group: 'Ferramentas' },
  { label: 'Global Search', icon: Search, path: '/search', group: 'Ferramentas' },
  { label: 'Ad Factory', icon: Megaphone, path: '/adfactory', group: 'Ferramentas' },
  { label: 'Settings', icon: Settings, path: '/settings', group: 'Sistema' },
];

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const navigate = useNavigate();
  const { data: curvaData } = useCurvaABC(50);
  const [search, setSearch] = useState('');

  // Listen for ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useUIStore.getState().toggleCommandPalette();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Close palette on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) close();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, close]);

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      close();
      setSearch('');
    },
    [navigate, close]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={close}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <Command
        className="w-full max-w-xl bg-[var(--color-gs-surface)] border border-[var(--color-gs-border)] rounded-xl shadow-[0_16px_64px_rgba(0,0,0,0.7)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-[var(--color-gs-border)]">
          <Search className="h-4 w-4 text-[var(--color-gs-muted)] shrink-0" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar SKU, navegação ou ações..."
            className="flex-1 h-12 bg-transparent text-[var(--color-gs-text)] placeholder:text-[var(--color-gs-muted)] outline-none text-sm font-mono"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[var(--color-gs-border)] bg-[var(--color-gs-bg)] px-1.5 font-mono text-[10px] text-[var(--color-gs-muted)]">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-72 overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="py-6 text-center text-sm text-[var(--color-gs-muted)] font-mono">
            Nenhum resultado encontrado.
          </Command.Empty>

          <Command.Group
            heading="Navegação"
            className="text-[10px] font-mono font-bold tracking-widest text-[var(--color-gs-muted)] px-2 py-1.5"
          >
            {NAV_ITEMS.filter((item) => item.group === 'Navegação').map((item) => (
              <Command.Item
                key={item.path}
                value={item.label}
                onSelect={() => handleSelect(item.path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-[var(--color-gs-border)]/50 transition-colors group"
              >
                <item.icon className="h-4 w-4 text-[var(--color-gs-muted)] group-data-[selected=true]:text-[var(--color-gs-green)]" />
                <span className="text-sm text-[var(--color-gs-text)] font-mono">{item.label}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading="Ferramentas"
            className="text-[10px] font-mono font-bold tracking-widest text-[var(--color-gs-muted)] px-2 py-1.5"
          >
            {NAV_ITEMS.filter((item) => item.group === 'Ferramentas').map((item) => (
              <Command.Item
                key={item.path}
                value={item.label}
                onSelect={() => handleSelect(item.path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-[var(--color-gs-border)]/50 transition-colors group"
              >
                <item.icon className="h-4 w-4 text-[var(--color-gs-muted)] group-data-[selected=true]:text-[var(--color-gs-green)]" />
                <span className="text-sm text-[var(--color-gs-text)] font-mono">{item.label}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading="SKU — Curva ABC"
            className="text-[10px] font-mono font-bold tracking-widest text-[var(--color-gs-muted)] px-2 py-1.5"
          >
            {curvaData
              ?.filter(
                (item) =>
                  search === '' ||
                  (item.id ?? '').toLowerCase().includes(search.toLowerCase()) ||
                  (item.titulo ?? '').toLowerCase().includes(search.toLowerCase())
              )
              .slice(0, 10)
              .map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.id ?? ''} ${item.titulo ?? ''}`}
                  onSelect={() => {
                    handleSelect(`/terminal?sku=${item.id}`);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-[var(--color-gs-border)]/50 transition-colors group"
                >
                  <Badge
                    variant={
                      item.curva_abc === 'A'
                        ? 'success'
                        : item.curva_abc === 'B'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {item.curva_abc ?? 'C'}
                  </Badge>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-mono text-[var(--color-gs-text)] truncate">
                      {item.id}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-gs-muted)] truncate">
                      {item.titulo ?? '—'}
                    </span>
                  </div>
                </Command.Item>
              ))}
          </Command.Group>
        </Command.List>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--color-gs-border)] bg-[var(--color-gs-bg)]">
          <span className="text-[10px] font-mono text-[var(--color-gs-muted)]">
            <kbd className="font-mono">↑↓</kbd> navegar
          </span>
          <span className="text-[10px] font-mono text-[var(--color-gs-muted)]">
            <kbd className="font-mono">↵</kbd> selecionar
          </span>
          <span className="text-[10px] font-mono text-[var(--color-gs-muted)]">
            <kbd className="font-mono">esc</kbd> fechar
          </span>
        </div>
      </Command>
    </div>
  );
}
