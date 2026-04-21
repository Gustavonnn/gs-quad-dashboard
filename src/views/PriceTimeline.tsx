import { useState, useMemo } from 'react';
import { usePriceTimeline } from '@/hooks';
import type { MLPriceTimeline } from '@/lib/schemas';

function fmt(n: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);
}

function fmtVol(n: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR').format(n ?? 0);
}

function fmtPct(n: number | null | undefined) {
  if (n === null || n === undefined) return '0%';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_CONFIG = {
  ABSORVIDO: {
    color: 'var(--color-gs-green)',
    bg: 'var(--color-gs-green-dim)',
    border: 'rgba(52, 131, 250, 0.25)',
    label: 'ABSORVIDO',
  },
  REJEITADO: {
    color: 'var(--color-gs-text)',
    bg: 'rgba(0, 0, 0, 0.05)',
    border: 'rgba(0, 0, 0, 0.25)',
    label: 'REJEITADO',
  },
  INEFICAZ: {
    color: 'var(--color-gs-muted)',
    bg: 'rgba(153, 153, 153, 0.08)',
    border: 'rgba(153, 153, 153, 0.25)',
    label: 'INEFICAZ',
  },
};

function StatusBadge({ status }: { status: MLPriceTimeline['absorcao_status'] }) {
  const cfg =
    STATUS_CONFIG[(status as keyof typeof STATUS_CONFIG) ?? 'INEFICAZ'] ?? STATUS_CONFIG.INEFICAZ;
  return (
    <span
      className="font-mono text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm uppercase"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

function DeltaTag({ value, isPrice = false }: { value: number; isPrice?: boolean }) {
  const color = isPrice
    ? value > 0
      ? 'var(--color-gs-muted)'
      : 'var(--color-gs-green)' // preço subiu = neutro/rum (cinza), caiu = bom (verde)
    : value > 0
      ? 'var(--color-gs-green)'
      : 'var(--color-gs-muted)'; // volume subiu = bom (verde), caiu = neutro/ruim (cinza)

  return (
    <span className="font-mono text-[11px] font-bold" style={{ color }}>
      {fmtPct(value)}
    </span>
  );
}

function TimelineCard({ event }: { event: MLPriceTimeline }) {
  const cfg =
    STATUS_CONFIG[(event.absorcao_status as keyof typeof STATUS_CONFIG) ?? 'INEFICAZ'] ??
    STATUS_CONFIG.INEFICAZ;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div
          className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
          style={{ background: cfg.color, color: cfg.color }}
        />
        <div className="w-px flex-1 mt-2" style={{ background: cfg.border }} />
      </div>

      <div
        className="flex-1 mb-6 rounded-md p-4 transition-all duration-200 hover:brightness-110"
        style={{ background: 'var(--color-gs-panel)', border: `1px solid ${cfg.border}` }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-gs-text tracking-widest uppercase">
              {event.sku}
            </span>
            <StatusBadge status={event.absorcao_status} />
          </div>
          <span className="font-mono text-[10px] text-gs-muted tracking-widest shrink-0">
            {fmtDate(event.evento_data)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-sm p-3"
            style={{
              background: 'var(--color-gs-surface)',
              border: '1px solid var(--color-gs-border)',
            }}
          >
            <div className="font-mono text-[9px] text-gs-muted tracking-widest uppercase mb-2">
              Reajuste de Preço
            </div>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-gs-muted">{fmt(event.preco_anterior)}</span>
              <span className="text-gs-muted">→</span>
              <span className="text-gs-text font-bold">{fmt(event.preco_novo)}</span>
            </div>
            <div className="mt-1">
              <DeltaTag value={event.delta_preco_pct ?? 0} isPrice />
            </div>
          </div>

          <div
            className="rounded-sm p-3"
            style={{
              background: 'var(--color-gs-surface)',
              border: '1px solid var(--color-gs-border)',
            }}
          >
            <div className="font-mono text-[9px] text-gs-muted tracking-widest uppercase mb-2">
              Reação de Volume (7d)
            </div>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-gs-muted">{fmtVol(event.volume_7d_antes)}</span>
              <span className="text-gs-muted">→</span>
              <span className="text-gs-text font-bold">{fmtVol(event.volume_7d_depois)}</span>
            </div>
            <div className="mt-1">
              <DeltaTag value={event.delta_volume_pct ?? 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PriceTimeline() {
  const { data, isLoading, refetch } = usePriceTimeline();
  const [activeFilter, setActiveFilter] = useState<string>('TOTAL');

  const counts = useMemo(
    () => ({
      TOTAL: data?.length ?? 0,
      ABSORVIDO: data?.filter((e) => e.absorcao_status === 'ABSORVIDO').length ?? 0,
      REJEITADO: data?.filter((e) => e.absorcao_status === 'REJEITADO').length ?? 0,
      INEFICAZ: data?.filter((e) => e.absorcao_status === 'INEFICAZ').length ?? 0,
    }),
    [data]
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (activeFilter === 'TOTAL') return data;
    return data.filter((e) => e.absorcao_status === activeFilter);
  }, [data, activeFilter]);

  const handleFilterClick = (status: string) => {
    setActiveFilter((prev) => (prev === status ? 'TOTAL' : status));
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-5xl mx-auto w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-gs-text pl-6 py-2">
        <div>
          <h2 className="font-mono text-[10px] text-gs-muted tracking-[0.3em] uppercase mb-2">
            Neural Pricing Engine // Log v3.0
          </h2>
          <div className="font-display font-black text-3xl text-gs-text tracking-tighter flex items-center gap-2">
            PRICE_REACTION<span className="text-gs-muted animate-pulse">_</span>
          </div>
          <p className="font-mono text-[11px] text-gs-muted mt-3 max-w-xl leading-relaxed uppercase tracking-wider">
            Monitoramento de absorção tática. Análise de volume (7 dias pré vs 7 dias pós) para
            validação de elasticidade real em ambiente de produção.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => refetch()}
            className="group flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm transition-all bg-gs-surface border border-gs-border hover:border-gs-text hover:text-gs-text"
          >
            <span className="group-hover:rotate-180 transition-transform duration-500">↻</span>
            Re-Sync Engine
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'TOTAL',
            label: 'TOTAL_EVENTS',
            value: counts.TOTAL,
            color: 'var(--color-gs-text)',
            border: 'var(--color-gs-border)',
          },
          {
            id: 'ABSORVIDO',
            label: 'MARKET_ABSORBED',
            value: counts.ABSORVIDO,
            color: 'var(--color-gs-green)',
            border: 'rgba(52, 131, 250, 0.2)',
          },
          {
            id: 'REJEITADO',
            label: 'PRICE_REJECTED',
            value: counts.REJEITADO,
            color: 'var(--color-gs-text)',
            border: 'rgba(0, 0, 0, 0.2)',
          },
          {
            id: 'INEFICAZ',
            label: 'INEFFECTIVE',
            value: counts.INEFICAZ,
            color: 'var(--color-gs-muted)',
            border: 'rgba(153, 153, 153, 0.2)',
          },
        ].map((item) => {
          const isActive = activeFilter === item.id;
          return (
            <div
              key={item.label}
              onClick={() => handleFilterClick(item.id)}
              className={`bg-gs-surface border p-5 rounded-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ${isActive ? 'ring-1 ring-inset brightness-105' : 'hover:border-gs-muted'}`}
              style={{
                borderColor: isActive ? item.color : item.border,
                boxShadow: isActive ? `0 0 20px -12px ${item.color}` : 'none',
              }}
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-current opacity-[0.02] rotate-45 pointer-events-none"
                style={{ color: item.color }}
              />
              <div
                className="font-mono text-[9px] tracking-[0.2em] uppercase mb-3 opacity-50 flex justify-between items-center"
                style={{ color: item.color }}
              >
                {item.label}
                {isActive && (
                  <div
                    className="w-1 h-1 rounded-full animate-pulse"
                    style={{ background: item.color }}
                  />
                )}
              </div>
              <div className="font-mono text-3xl font-black" style={{ color: item.color }}>
                {isLoading ? '---' : String(item.value).padStart(2, '0')}
              </div>
              <div className="mt-4 h-1 w-full bg-gs-border rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    backgroundColor: item.color,
                    width: isLoading ? '0%' : `${(item.value / (counts.TOTAL || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gs-surface border border-gs-border rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gs-border bg-gs-panel flex justify-between items-center">
          <span className="font-mono text-[10px] text-gs-muted tracking-[0.2em] uppercase">
            Live Feed // Events Log {activeFilter !== 'TOTAL' && `// Filtering: ${activeFilter}`}
          </span>
          {isLoading && (
            <span className="font-mono text-[10px] text-gs-muted animate-pulse">
              SCANNING DATABASE...
            </span>
          )}
        </div>

        <div className="p-6">
          {!isLoading && filteredData.length === 0 && (
            <div className="py-20 text-center border border-dashed border-gs-border">
              <div className="font-mono text-[11px] text-gs-muted tracking-[0.2em] uppercase">
                Zero reajustes {activeFilter !== 'TOTAL' ? `com status ${activeFilter}` : ''}{' '}
                detectados no período.
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filteredData.map((event, i) => (
              <TimelineCard key={`${event.sku}-${event.evento_data}-${i}`} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
