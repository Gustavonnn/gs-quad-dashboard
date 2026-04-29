import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Command,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  ClipboardList,
  Minus,
} from 'lucide-react';
import { Sparkline } from '@/components/Sparkline';
import { MLBNotesDrawer } from '@/components/MLBNotesDrawer';

type SalesFilter = 'ALL' | 'UP' | 'DOWN' | 'STABLE';

interface HubProduct {
  mlb: string;
  sku: string;
  titulo: string;
  receita7d: number;
  variacaoD1: number;
  variacaoD7: number;
  sparkData: number[];
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);
}

function VariationBadge({ value, compact }: { value: number; compact?: boolean }) {
  const color =
    value > 2
      ? 'var(--color-gs-green)'
      : value < -2
        ? 'var(--color-gs-red)'
        : 'var(--color-gs-muted)';
  const arrow = value > 2 ? '↑' : value < -2 ? '↓' : '→';
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono font-bold rounded-sm ${compact ? 'text-[8px] px-1 py-0.5' : 'text-[9px] px-1.5 py-0.5'}`}
      style={{ color, background: 'var(--color-gs-hover-overlay)' }}
    >
      {arrow} {value >= 0 ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

export function OperationHub() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SalesFilter>('ALL');
  const [drawerMlb, setDrawerMlb] = useState<{ mlb: string; sku: string } | null>(null);

  // ia_alertas: tipo, severidade (real schema)
  const { data: alertasRaw } = useQuery({
    queryKey: ['ia-alertas-hub'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ia_alertas_operacionais')
        .select('id, sku, tipo_alerta, severidade, descricao')
        .limit(50);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: hubProducts, isLoading } = useQuery({
    queryKey: ['operation-hub-products'],
    queryFn: async (): Promise<HubProduct[]> => {
      // Real schema: item_id=mlb
      const { data: produtos } = await supabase
        .from('live_produtos')
        .select('item_id, sku, titulo')
        .limit(200);

      if (!produtos || produtos.length === 0) return [];

      const skus = produtos.map((p: Record<string, unknown>) => p.sku as string).filter(Boolean);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Real schema: receita_total (not receita)
      const { data: vendas } = await supabase
        .from('live_vendas')
        .select('sku, receita_total, data_venda')
        .in('sku', skus)
        .gte('data_venda', fourteenDaysAgo.toISOString())
        .order('data_venda', { ascending: true });

      const now = Date.now();
      const msPerDay = 86400000;
      const skuToItem = new Map<string, Record<string, unknown>>();
      for (const p of produtos) skuToItem.set(p.sku as string, p);

      const byMlb = new Map<
        string,
        {
          prod: Record<string, unknown>;
          today: number;
          yesterday: number;
          week: number;
          prevWeek: number;
          dailyData: Map<number, number>;
        }
      >();

      for (const p of produtos) {
        byMlb.set((p.item_id as string) ?? (p.sku as string), {
          prod: p,
          today: 0,
          yesterday: 0,
          week: 0,
          prevWeek: 0,
          dailyData: new Map(),
        });
      }

      for (const v of vendas ?? []) {
        const prod = skuToItem.get(v.sku as string);
        if (!prod) continue;
        const mlbKey = (prod.item_id as string) ?? (prod.sku as string);
        const entry = byMlb.get(mlbKey);
        if (!entry) continue;

        const age = now - new Date(v.data_venda as string).getTime();
        const dayIndex = Math.floor(age / msPerDay);
        const receita = (v.receita_total as number) ?? 0;

        if (dayIndex === 0) entry.today += receita;
        if (dayIndex === 1) entry.yesterday += receita;
        if (dayIndex < 7) {
          entry.week += receita;
          const sparkIdx = 6 - dayIndex;
          entry.dailyData.set(sparkIdx, (entry.dailyData.get(sparkIdx) ?? 0) + receita);
        }
        if (dayIndex >= 7 && dayIndex < 14) entry.prevWeek += receita;
      }

      const results: HubProduct[] = [];
      for (const [mlb, entry] of byMlb) {
        const varD1 =
          entry.yesterday > 0 ? ((entry.today - entry.yesterday) / entry.yesterday) * 100 : 0;
        const varD7 =
          entry.prevWeek > 0 ? ((entry.week - entry.prevWeek) / entry.prevWeek) * 100 : 0;
        const sparkData = Array.from({ length: 7 }, (_, i) => entry.dailyData.get(i) ?? 0);
        results.push({
          mlb,
          sku: (entry.prod.sku as string) ?? '',
          titulo: (entry.prod.titulo as string) ?? '',
          receita7d: entry.week,
          variacaoD1: varD1,
          variacaoD7: varD7,
          sparkData,
        });
      }

      return results.sort((a, b) => b.variacaoD7 - a.variacaoD7);
    },
    staleTime: 60_000,
  });

  const allProducts = useMemo(() => hubProducts ?? [], [hubProducts]);
  const alertas = useMemo(() => alertasRaw ?? [], [alertasRaw]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'UP':
        return allProducts.filter((p) => p.variacaoD7 > 5);
      case 'DOWN':
        return allProducts.filter((p) => p.variacaoD7 < -5);
      case 'STABLE':
        return allProducts.filter((p) => p.variacaoD7 >= -5 && p.variacaoD7 <= 5);
      default:
        return allProducts;
    }
  }, [allProducts, filter]);

  const sortedByReceita = useMemo(
    () => [...allProducts].sort((a, b) => b.receita7d - a.receita7d),
    [allProducts]
  );
  const top5 = sortedByReceita.slice(0, 5);
  const bottom5 = sortedByReceita.slice(-5).reverse();

  // Real alert fields: severidade (CRITICO/ALTO/BAIXO)
  const criticalAlerts = useMemo(
    () =>
      alertas.filter((a) => {
        const sev = (a.severidade ?? '').toUpperCase();
        return sev === 'CRITICO' || sev === 'CRÍTICO' || sev === 'ALTO';
      }),
    [alertas]
  );

  const positiveAlerts = useMemo(
    () =>
      alertas.filter((a) => {
        const sev = (a.severidade ?? '').toUpperCase();
        return sev === 'BAIXO';
      }),
    [alertas]
  );

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Command size={14} style={{ color: 'var(--color-gs-green)' }} />
          <span
            className="font-mono text-[9px] tracking-[0.25em] uppercase"
            style={{ color: 'var(--color-gs-green)' }}
          >
            CENTRAL DE COMANDO
          </span>
        </div>
        <h2
          className="font-heading font-black tracking-wide uppercase"
          style={{ fontSize: '22px', color: 'var(--color-gs-text)', lineHeight: 1 }}
        >
          OP_HUB<span style={{ color: 'var(--color-gs-green)' }}>.</span>
        </h2>
        <p
          className="font-mono text-[9px] tracking-[0.2em] uppercase mt-1"
          style={{ color: 'var(--color-gs-muted)' }}
        >
          TERMOMETRO DE VENDAS · ALERTAS · RANKING
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3" style={{ minHeight: '500px' }}>
        {/* Sales Thermometer */}
        <div
          className="lg:col-span-4 flex flex-col"
          style={{
            background: 'var(--color-gs-panel)',
            border: '1px solid var(--color-gs-border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-2 shrink-0"
            style={{ borderBottom: '1px solid var(--color-gs-border)' }}
          >
            <span
              className="font-mono text-[9px] tracking-[0.2em] uppercase font-bold"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              TERMOMETRO VENDAS
            </span>
          </div>
          <div
            className="flex items-center gap-1 px-3 py-2 shrink-0"
            style={{ borderBottom: '1px solid var(--color-gs-border)' }}
          >
            {(
              [
                { key: 'ALL', label: 'TODOS', icon: null },
                { key: 'UP', label: 'ALTA', icon: <TrendingUp size={9} /> },
                { key: 'DOWN', label: 'QUEDA', icon: <TrendingDown size={9} /> },
                { key: 'STABLE', label: 'ESTAVEL', icon: <Minus size={9} /> },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="flex items-center gap-1 font-mono text-[8px] tracking-wider uppercase px-2 py-1 rounded-sm transition-all"
                style={{
                  background: filter === f.key ? 'var(--color-gs-green)' : 'transparent',
                  color: filter === f.key ? '#000' : 'var(--color-gs-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-sm"
                    style={{ background: 'var(--color-gs-border)' }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center">
                <span className="font-mono text-[10px]" style={{ color: 'var(--color-gs-muted)' }}>
                  Sem dados neste filtro
                </span>
              </div>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.mlb}
                  onClick={() => navigate(`/terminal?sku=${p.sku}&mlb=${p.mlb}`)}
                  className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[var(--color-gs-hover-overlay)] cursor-pointer group"
                  style={{ borderBottom: '1px solid var(--color-gs-border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-mono text-[9px] font-bold truncate group-hover:text-gs-blue transition-colors"
                      style={{ color: 'var(--color-gs-text)' }}
                    >
                      {p.titulo || p.sku}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="font-mono text-[8px]"
                        style={{ color: 'var(--color-gs-muted)' }}
                      >
                        D-1
                      </span>
                      <VariationBadge value={p.variacaoD1} compact />
                      <span
                        className="font-mono text-[8px]"
                        style={{ color: 'var(--color-gs-muted)' }}
                      >
                        D-7
                      </span>
                      <VariationBadge value={p.variacaoD7} compact />
                    </div>
                  </div>
                  <div style={{ width: 80, height: 24 }}>
                    <Sparkline
                      data={p.sparkData}
                      color={
                        p.variacaoD7 > 0
                          ? 'var(--color-gs-green)'
                          : p.variacaoD7 < -5
                            ? 'var(--color-gs-red)'
                            : 'var(--color-gs-muted)'
                      }
                      gradientId={`hub-${p.mlb}`}
                      showGrid={false}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts Feed */}
        <div
          className="lg:col-span-4 flex flex-col"
          style={{
            background: 'var(--color-gs-panel)',
            border: '1px solid var(--color-gs-border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center px-3 py-2 shrink-0"
            style={{ borderBottom: '1px solid var(--color-gs-border)' }}
          >
            <AlertTriangle size={11} style={{ color: 'var(--color-gs-yellow)' }} />
            <span
              className="font-mono text-[9px] tracking-[0.2em] uppercase font-bold ml-2"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              ALERTAS & OPORTUNIDADES
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-gs-border)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--color-gs-red)' }}
                />
                <span
                  className="font-mono text-[8px] tracking-[0.2em] uppercase font-bold"
                  style={{ color: 'var(--color-gs-red)' }}
                >
                  PIORANDO AGORA ({criticalAlerts.length})
                </span>
              </div>
              {criticalAlerts.length === 0 ? (
                <span className="font-mono text-[9px]" style={{ color: 'var(--color-gs-muted)' }}>
                  Sem alertas criticos
                </span>
              ) : (
                criticalAlerts.slice(0, 8).map((a, i) => (
                  <div
                    key={`crit-${i}`}
                    className="flex items-start gap-2 py-1.5"
                    style={{ borderBottom: '1px solid var(--color-gs-border)' }}
                  >
                    <span
                      className="font-mono text-[8px] font-bold shrink-0 px-1 py-0.5 rounded-sm"
                      style={{ color: 'var(--color-gs-red)', background: 'rgba(255,59,48,0.1)' }}
                    >
                      {(a.severidade ?? '').slice(0, 3).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span
                        className="font-mono text-[9px] font-bold"
                        style={{ color: 'var(--color-gs-text)' }}
                      >
                        {a.sku}
                      </span>
                      <span
                        className="font-mono text-[8px] truncate block"
                        style={{ color: 'var(--color-gs-muted)' }}
                      >
                        {a.tipo_alerta}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-3 py-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={10} style={{ color: 'var(--color-gs-green)' }} />
                <span
                  className="font-mono text-[8px] tracking-[0.2em] uppercase font-bold"
                  style={{ color: 'var(--color-gs-green)' }}
                >
                  OPORTUNIDADES ({positiveAlerts.length})
                </span>
              </div>
              {positiveAlerts.length === 0 ? (
                <span className="font-mono text-[9px]" style={{ color: 'var(--color-gs-muted)' }}>
                  Sem oportunidades detectadas
                </span>
              ) : (
                positiveAlerts.slice(0, 6).map((a, i) => (
                  <div
                    key={`opp-${i}`}
                    className="flex items-start gap-2 py-1.5"
                    style={{ borderBottom: '1px solid var(--color-gs-border)' }}
                  >
                    <Zap size={9} style={{ color: 'var(--color-gs-green)' }} />
                    <div className="min-w-0 flex-1">
                      <span
                        className="font-mono text-[9px] font-bold"
                        style={{ color: 'var(--color-gs-text)' }}
                      >
                        {a.sku}
                      </span>
                      <span
                        className="font-mono text-[8px] truncate block"
                        style={{ color: 'var(--color-gs-muted)' }}
                      >
                        {a.tipo_alerta}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rankings */}
        <div
          className="lg:col-span-4 flex flex-col"
          style={{
            background: 'var(--color-gs-panel)',
            border: '1px solid var(--color-gs-border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-2 shrink-0"
            style={{ borderBottom: '1px solid var(--color-gs-border)' }}
          >
            <span
              className="font-mono text-[9px] tracking-[0.2em] uppercase font-bold"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              RANKING 7 DIAS
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-gs-border)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={10} style={{ color: 'var(--color-gs-green)' }} />
                <span
                  className="font-mono text-[8px] tracking-[0.2em] uppercase font-bold"
                  style={{ color: 'var(--color-gs-green)' }}
                >
                  TOP 5
                </span>
              </div>
              {top5.map((p, i) => (
                <div
                  key={p.mlb}
                  className="flex items-center gap-2 py-1.5"
                  style={{ borderBottom: '1px solid var(--color-gs-border)' }}
                >
                  <span
                    className="font-heading font-black text-sm shrink-0"
                    style={{ color: 'var(--color-gs-green)', width: 20, textAlign: 'center' }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="flex-1 min-w-0 cursor-pointer group"
                    onClick={() => navigate(`/terminal?sku=${p.sku}&mlb=${p.mlb}`)}
                  >
                    <span
                      className="font-mono text-[9px] font-bold truncate block group-hover:text-gs-blue transition-colors"
                      style={{ color: 'var(--color-gs-text)' }}
                    >
                      {p.titulo || p.sku}
                    </span>
                    <span
                      className="font-mono text-[9px]"
                      style={{ color: 'var(--color-gs-green)' }}
                    >
                      {fmt(p.receita7d)}
                    </span>
                  </div>
                  <button
                    onClick={() => setDrawerMlb({ mlb: p.mlb, sku: p.sku })}
                    className="flex items-center gap-1 font-mono text-[7px] tracking-wider uppercase px-1.5 py-1 rounded-sm"
                    style={{
                      color: 'var(--color-gs-muted)',
                      border: '1px solid var(--color-gs-border)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <ClipboardList size={8} />
                    ANOTAR
                  </button>
                </div>
              ))}
            </div>
            <div className="px-3 py-2">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown size={10} style={{ color: 'var(--color-gs-red)' }} />
                <span
                  className="font-mono text-[8px] tracking-[0.2em] uppercase font-bold"
                  style={{ color: 'var(--color-gs-red)' }}
                >
                  BOTTOM 5
                </span>
              </div>
              {bottom5.map((p, i) => (
                <div
                  key={p.mlb}
                  className="flex items-center gap-2 py-1.5"
                  style={{ borderBottom: '1px solid var(--color-gs-border)' }}
                >
                  <span
                    className="font-heading font-black text-sm shrink-0"
                    style={{ color: 'var(--color-gs-red)', width: 20, textAlign: 'center' }}
                  >
                    {allProducts.length - 4 + i}
                  </span>
                  <div
                    className="flex-1 min-w-0 cursor-pointer group"
                    onClick={() => navigate(`/terminal?sku=${p.sku}&mlb=${p.mlb}`)}
                  >
                    <span
                      className="font-mono text-[9px] font-bold truncate block group-hover:text-gs-blue transition-colors"
                      style={{ color: 'var(--color-gs-text)' }}
                    >
                      {p.titulo || p.sku}
                    </span>
                    <span className="font-mono text-[9px]" style={{ color: 'var(--color-gs-red)' }}>
                      {fmt(p.receita7d)}
                    </span>
                  </div>
                  <button
                    onClick={() => setDrawerMlb({ mlb: p.mlb, sku: p.sku })}
                    className="flex items-center gap-1 font-mono text-[7px] tracking-wider uppercase px-1.5 py-1 rounded-sm"
                    style={{
                      color: 'var(--color-gs-muted)',
                      border: '1px solid var(--color-gs-border)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <ClipboardList size={8} />
                    ANOTAR
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
