import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { useConversionMetrics } from '@/hooks/useConversionMetrics';
import { Sparkline } from '@/components/Sparkline';
import { MLBNotesDrawer } from '@/components/MLBNotesDrawer';

function ConversionBadge({ value }: { value: number }) {
  let color: string;
  let pulse = false;

  if (value > 16) {
    color = 'var(--color-gs-green)';
    pulse = true;
  } else if (value > 8) {
    color = 'var(--color-gs-green)';
  } else if (value >= 3) {
    color = 'var(--color-gs-yellow)';
  } else {
    color = 'var(--color-gs-red)';
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm ${pulse ? 'animate-pulse' : ''}`}
      style={{ background: color, color: '#000', minWidth: 48 }}
    >
      {value.toFixed(1)}%
    </span>
  );
}

export function ConversionRadar() {
  const navigate = useNavigate();
  const { data, isLoading } = useConversionMetrics();
  const [drawerMlb, setDrawerMlb] = useState<{ mlb: string; sku: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'good' | 'excellent'>('all');

  const products = useMemo(() => {
    if (!data) return [];
    switch (filter) {
      case 'critical':
        return data.filter((p) => p.conversao < 3);
      case 'good':
        return data.filter((p) => p.conversao >= 3 && p.conversao <= 8);
      case 'excellent':
        return data.filter((p) => p.conversao > 8);
      default:
        return data;
    }
  }, [data, filter]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gauge size={14} style={{ color: 'var(--color-gs-green)' }} />
            <span
              className="font-mono text-[9px] tracking-[0.25em] uppercase"
              style={{ color: 'var(--color-gs-green)' }}
            >
              TERMÔMETRO OPERACIONAL
            </span>
          </div>
          <h2
            className="font-heading font-black tracking-wide uppercase"
            style={{ fontSize: '22px', color: 'var(--color-gs-text)', lineHeight: 1 }}
          >
            CONV_RADAR<span style={{ color: 'var(--color-gs-green)' }}>.</span>
          </h2>
          <p
            className="font-mono text-[9px] tracking-[0.2em] uppercase mt-1"
            style={{ color: 'var(--color-gs-muted)' }}
          >
            RANQUEAMENTO POR TAXA DE CONVERSÃO · DIAGNÓSTICO AUTOMÁTICO
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          {[
            { key: 'all', label: 'TODOS' },
            { key: 'critical', label: '< 3%' },
            { key: 'good', label: '3-8%' },
            { key: 'excellent', label: '> 8%' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className="font-mono text-[9px] tracking-wider uppercase px-3 py-1.5 rounded-sm transition-all"
              style={{
                background: filter === f.key ? 'var(--color-gs-green)' : 'transparent',
                color: filter === f.key ? '#000' : 'var(--color-gs-muted)',
                border: `1px solid ${filter === f.key ? 'var(--color-gs-green)' : 'var(--color-gs-border)'}`,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--color-gs-panel)',
          border: '1px solid var(--color-gs-border)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          className="grid items-center px-4 py-2"
          style={{
            gridTemplateColumns: '2fr 1fr 80px 80px 80px 120px',
            borderBottom: '1px solid var(--color-gs-border)',
            background: 'var(--color-gs-bg)',
          }}
        >
          {['PRODUTO', 'SKU', 'CONVERSÃO', 'ESTOQUE', 'VISITAS', '7 DIAS'].map((h) => (
            <span
              key={h}
              className="font-mono text-[8px] tracking-[0.22em] uppercase font-bold"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="flex flex-col gap-1 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-sm"
                style={{ background: 'var(--color-gs-border)', width: `${70 + i * 5}%` }}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center">
            <span className="font-mono text-[10px]" style={{ color: 'var(--color-gs-muted)' }}>
              Sem dados de conversão disponíveis
            </span>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.mlb}
                onClick={() => setDrawerMlb({ mlb: p.mlb, sku: p.sku })}
                className="grid items-center px-4 py-2.5 w-full text-left transition-colors hover:bg-[var(--color-gs-hover-overlay)]"
                style={{
                  gridTemplateColumns: '2fr 1fr 80px 80px 80px 120px',
                  borderBottom: '1px solid var(--color-gs-border)',
                  background: 'transparent',
                }}
              >
                {/* Title + Diagnostic */}
                <div
                  className="flex flex-col gap-0.5 min-w-0 pr-2 cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/terminal?sku=${p.sku}&mlb=${p.mlb}`);
                  }}
                >
                  <span
                    className="font-mono text-[10px] font-bold truncate group-hover:text-gs-blue transition-colors"
                    style={{ color: 'var(--color-gs-text)' }}
                  >
                    {p.titulo || p.mlb}
                  </span>
                  {p.diagnostico && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle size={9} style={{ color: 'var(--color-gs-yellow)' }} />
                      <span
                        className="font-mono text-[8px] font-bold tracking-wider"
                        style={{ color: 'var(--color-gs-yellow)' }}
                      >
                        {p.diagnostico}
                      </span>
                    </div>
                  )}
                  {!p.diagnostico && p.variacao_pct !== 0 && (
                    <div className="flex items-center gap-1">
                      {p.variacao_pct > 0 ? (
                        <TrendingUp size={9} style={{ color: 'var(--color-gs-green)' }} />
                      ) : (
                        <TrendingDown size={9} style={{ color: 'var(--color-gs-red)' }} />
                      )}
                      <span
                        className="font-mono text-[8px]"
                        style={{
                          color:
                            p.variacao_pct > 0 ? 'var(--color-gs-green)' : 'var(--color-gs-red)',
                        }}
                      >
                        {p.variacao_pct > 0 ? '+' : ''}
                        {p.variacao_pct.toFixed(1)}% vs sem. anterior
                      </span>
                    </div>
                  )}
                </div>

                {/* SKU */}
                <span
                  className="font-mono text-[10px] text-gs-muted hover:text-gs-blue cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/terminal?sku=${p.sku}&mlb=${p.mlb}`);
                  }}
                >
                  {p.sku}
                </span>

                {/* Conversion badge */}
                <ConversionBadge value={p.conversao} />

                {/* Stock */}
                <span
                  className="font-mono text-[10px] font-bold"
                  style={{ color: p.estoque < 5 ? 'var(--color-gs-red)' : 'var(--color-gs-text)' }}
                >
                  {p.estoque}
                </span>

                {/* Visits */}
                <span className="font-mono text-[10px]" style={{ color: 'var(--color-gs-muted)' }}>
                  {p.visits > 0
                    ? p.visits >= 1000
                      ? `${(p.visits / 1000).toFixed(1)}K`
                      : p.visits
                    : '—'}
                </span>

                {/* Sparkline */}
                <div style={{ height: 28 }}>
                  <Sparkline
                    data={p.sparkData}
                    color={
                      p.conversao > 8
                        ? 'var(--color-gs-green)'
                        : p.conversao >= 3
                          ? 'var(--color-gs-yellow)'
                          : 'var(--color-gs-red)'
                    }
                    gradientId={`spark-${p.mlb}`}
                    showGrid={false}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Drawer */}
      {drawerMlb && (
        <MLBNotesDrawer
          mlb={drawerMlb.mlb}
          sku={drawerMlb.sku}
          open={!!drawerMlb}
          onClose={() => setDrawerMlb(null)}
        />
      )}
    </div>
  );
}
