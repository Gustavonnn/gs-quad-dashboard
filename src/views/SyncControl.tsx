import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import {
  Play,
  RefreshCw,
  Database,
  GitPullRequest,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type SyncStatus = 'idle' | 'running' | 'success' | 'error';

interface SyncResult {
  mode: string;
  status: SyncStatus;
  message: string;
  duration?: string;
  records?: number;
}

const SYNC_MODES = [
  {
    id: 'push',
    label: 'PUSH',
    description: 'DuckDB → Supabase',
    icon: Database,
    color: 'text-[var(--color-gs-green)]',
    badge: 'success' as const,
  },
  {
    id: 'pull',
    label: 'PULL',
    description: 'Supabase → DuckDB',
    icon: GitPullRequest,
    color: 'text-[var(--color-gs-blue)]',
    badge: 'default' as const,
  },
  {
    id: 'both',
    label: 'BOTH',
    description: 'Sincronização bidirecional completa',
    icon: RefreshCw,
    color: 'text-[var(--color-gs-yellow)]',
    badge: 'warning' as const,
  },
];

export function SyncControl() {
  const [activeSync, setActiveSync] = useState<string | null>(null);
  const [results, setResults] = useState<SyncResult[]>([]);

  const handleSync = async (mode: string) => {
    setActiveSync(mode);

    toast.info(`Iniciando sync ${mode}...`, { duration: 2000 });

    // Simulate API call to backend pipeline
    try {
      const res = await fetch(
        'https://mxwzvdbzwnavsnvndted.supabase.co/functions/v1/sync-trigger',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json().catch(() => ({}));
      setResults((prev) => [
        {
          mode,
          status: 'success',
          message: data.message ?? `Sync ${mode} concluído com sucesso.`,
          duration: data.duration ?? '~30s',
          records: data.records ?? 0,
        },
        ...prev,
      ]);
      toast.success(`Sync ${mode} concluído!`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha na execução.';
      setResults((prev) => [
        {
          mode,
          status: 'error',
          message: errorMessage,
        },
        ...prev,
      ]);
      toast.error(`Sync ${mode} falhou: ${errorMessage}`);
    } finally {
      setActiveSync(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          SYNC <span className="text-gs-green">CONTROL</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">
          Acionar pipeline DuckDB ↔ Supabase
        </p>
      </div>

      {/* Sync Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SYNC_MODES.map((mode) => {
          const Icon = mode.icon;
          const isRunning = activeSync === mode.id;

          return (
            <Card
              key={mode.id}
              className={`p-6 flex flex-col gap-4 transition-all ${
                isRunning
                  ? 'border-[var(--color-gs-green)]/50 shadow-[0_0_20px_rgba(52,131,250,0.1)]'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-3 ${mode.color}`}>
                  <Icon className="h-6 w-6" />
                  <div>
                    <div className="font-mono text-sm font-bold tracking-wider">{mode.label}</div>
                    <div className="font-mono text-[10px] text-[var(--color-gs-muted)] tracking-wide">
                      {mode.description}
                    </div>
                  </div>
                </div>
                <Badge variant={mode.badge}>{mode.id.toUpperCase()}</Badge>
              </div>

              <Button
                onClick={() => handleSync(mode.id)}
                disabled={!!activeSync}
                className={`gap-2 w-full ${isRunning ? 'opacity-70' : ''}`}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    EXECUTANDO...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    ACIONAR PIPELINE
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Results Log */}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-mono text-xs font-bold tracking-widest text-[var(--color-gs-muted)] uppercase">
            Histórico de Execuções
          </h3>
          <div className="space-y-2">
            {results.map((result, i) => (
              <Card
                key={i}
                className={`p-4 border-l-4 ${
                  result.status === 'success'
                    ? 'border-l-[var(--color-gs-green)]'
                    : 'border-l-[var(--color-gs-red)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-[var(--color-gs-green)]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[var(--color-gs-text)]" />
                    )}
                    <div>
                      <span className="font-mono text-xs font-bold text-[var(--color-gs-text)]">
                        {result.mode.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--color-gs-muted)] ml-3">
                        {result.message}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {result.duration && (
                      <span className="font-mono text-[10px] text-[var(--color-gs-muted)]">
                        {result.duration}
                      </span>
                    )}
                    {result.records !== undefined && (
                      <Badge variant="secondary">{result.records} registros</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
