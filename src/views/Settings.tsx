import { useUIStore } from '@/stores/uiStore'
import { Card, Badge } from '@/components/ui'
import { Separator } from '@/components/ui/separator'
import { Moon, Sun, Keyboard } from 'lucide-react'

export function Settings() {
  const { theme, setTheme } = useUIStore()

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          SETTINGS
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">
          Preferências do dashboard
        </p>
      </div>

      {/* Theme */}
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[var(--color-gs-border)]">
            <Sun className="h-4 w-4 text-[var(--color-gs-muted)]" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-[var(--color-gs-text)]">Tema</h3>
            <p className="font-mono text-[10px] text-[var(--color-gs-muted)]">
              Escolha o tema de aparência do dashboard
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex gap-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value as 'light' | 'dark')}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === value
                  ? 'border-[var(--color-gs-green)] bg-[var(--color-gs-green-dim)] text-[var(--color-gs-green)]'
                  : 'border-[var(--color-gs-border)] hover:border-[var(--color-gs-muted)] text-[var(--color-gs-muted)]'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="font-mono text-xs font-bold">{label}</span>
              {theme === value && (
                <Badge variant="success" className="text-[8px]">ATIVO</Badge>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[var(--color-gs-border)]">
            <Keyboard className="h-4 w-4 text-[var(--color-gs-muted)]" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-[var(--color-gs-text)]">Atalhos de Teclado</h3>
            <p className="font-mono text-[10px] text-[var(--color-gs-muted)]">
              Atalhos disponíveis no dashboard
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          {[
            { keys: ['⌘', 'K'], description: 'Abrir Command Palette' },
            { keys: ['Esc'], description: 'Fechar Command Palette / Dialog' },
            { keys: ['G', 'V'], description: 'Ir para Visão Geral' },
            { keys: ['G', 'T'], description: 'Ir para Terminal DB' },
            { keys: ['G', 'M'], description: 'Ir para Monitor' },
            { keys: ['G', 'S'], description: 'Ir para Settings' },
          ].map(({ keys, description }) => (
            <div
              key={description}
              className="flex items-center justify-between py-2 border-b border-[var(--color-gs-border)]/50 last:border-0"
            >
              <span className="font-mono text-xs text-[var(--color-gs-muted)]">{description}</span>
              <div className="flex gap-1">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-5 min-w-[24px] items-center justify-center rounded border border-[var(--color-gs-border)] bg-[var(--color-gs-bg)] px-1.5 font-mono text-[10px] text-[var(--color-gs-text)]"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Info */}
      <Card className="p-6 flex flex-col gap-3">
        <h3 className="font-mono text-sm font-bold text-[var(--color-gs-text)]">Informações do Sistema</h3>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Versão', value: '2.1.0' },
            { label: 'Stack', value: 'React 18 + Vite 6' },
            { label: 'Backend', value: 'DuckDB + Supabase' },
            { label: 'Deploy', value: 'Vercel' },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[var(--color-gs-muted)] tracking-widest uppercase">
                {label}
              </span>
              <span className="font-mono text-xs text-[var(--color-gs-text)]">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
