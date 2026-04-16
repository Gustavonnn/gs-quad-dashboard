import { Card } from '@/components/ui';
import { Activity, AlertTriangle, CheckCircle, TrendingUp, Zap, Clock } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'alerta' | 'sync' | 'growth' | 'price' | 'system';
  title: string;
  description: string;
  timestamp: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
}

const MOCK_EVENTS: ActivityEvent[] = [
  {
    id: '1',
    type: 'alerta',
    title: 'Alerta CRÍTICO — SKU #458291',
    description: 'Ruptura de estoque detectada. Probabilidade 87%.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    severity: 'error',
  },
  {
    id: '2',
    type: 'sync',
    title: 'Sync DuckDB → Supabase',
    description: 'Push completo. 1.247 registros atualizados.',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    severity: 'success',
  },
  {
    id: '3',
    type: 'growth',
    title: 'Growth Plan aprovado — SKU #120384',
    description: 'Plano de intervenção aprovado e enviado para fila.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    severity: 'info',
  },
  {
    id: '4',
    type: 'price',
    title: 'Absorção de preço REJEITADA — SKU #782910',
    description: 'Volume caiu 34% após aumento de 8%. Recomendado reverter.',
    timestamp: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    severity: 'warning',
  },
  {
    id: '5',
    type: 'system',
    title: 'Pipeline ML executado',
    description: 'Modelos Holt-Winters, Isolation Forest e K-Means atualizados.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    severity: 'success',
  },
  {
    id: '6',
    type: 'alerta',
    title: 'Anomalia detectada — SKU #334820',
    description: 'Vendas 3x acima da média histórica. Investigar promotore.',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    severity: 'warning',
  },
  {
    id: '7',
    type: 'sync',
    title: 'Webhook /vendas recebido',
    description: '23 novas vendas processadas. Receita: R$ 12.847,00.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    severity: 'info',
  },
];

const TYPE_CONFIG: Record<string, { icon: typeof Activity; color: string }> = {
  alerta: { icon: AlertTriangle, color: 'text-[var(--color-gs-text)]' },
  sync: { icon: Zap, color: 'text-[var(--color-gs-green)]' },
  growth: { icon: TrendingUp, color: 'text-[var(--color-gs-blue)]' },
  price: { icon: CheckCircle, color: 'text-[var(--color-gs-yellow)]' },
  system: { icon: Clock, color: 'text-[var(--color-gs-muted)]' },
};

const SEVERITY_BORDER: Record<string, string> = {
  error: 'border-l-[var(--color-gs-text)]',
  warning: 'border-l-[var(--color-gs-yellow)]',
  success: 'border-l-[var(--color-gs-green)]',
  info: 'border-l-[var(--color-gs-blue)]',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export function ActivityFeed() {
  const [events] = useState<ActivityEvent[]>(MOCK_EVENTS);
  const [filter, setFilter] = useState<string>('ALL');

  const filtered = filter === 'ALL' ? events : events.filter((e) => e.type === filter);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          ACTIVITY <span className="text-gs-green">FEED</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">
          Timeline de eventos — sistema &amp; operações
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'alerta', 'sync', 'growth', 'price', 'system'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-sm font-mono text-[10px] font-bold tracking-widest uppercase border transition-all ${
              filter === f
                ? 'border-[var(--color-gs-green)] text-[var(--color-gs-green)] bg-[var(--color-gs-green-dim)]'
                : 'border-[var(--color-gs-border)] text-[var(--color-gs-muted)] hover:border-[var(--color-gs-muted)]'
            }`}
          >
            {f === 'ALL' ? 'Todos' : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--color-gs-border)]" />

        <div className="space-y-4">
          {filtered.map((event) => {
            const config = TYPE_CONFIG[event.type];
            const Icon = config.icon;

            return (
              <div key={event.id} className="relative pl-14">
                <div
                  className={`absolute left-3 top-1 w-6 h-6 rounded-full bg-[var(--color-gs-surface)] border-2 border-[var(--color-gs-border)] flex items-center justify-center ${config.color}`}
                >
                  <Icon className="h-3 w-3" />
                </div>

                <Card
                  className={`border-l-4 ${SEVERITY_BORDER[event.severity ?? 'info']} p-4 hover:border-[var(--color-gs-muted)]/30 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h4 className="font-mono text-xs font-bold text-[var(--color-gs-text)]">
                      {event.title}
                    </h4>
                    <span className="font-mono text-[10px] text-[var(--color-gs-muted)] shrink-0">
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-gs-muted)] leading-relaxed">
                    {event.description}
                  </p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
