import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GitMerge, Info } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

interface MatrixProduct {
  mlb: string;
  sku: string;
  titulo: string;
  estoque: number;
  adsScore: number;
  quadrant: 'ESCALAR' | 'FREAR' | 'ALERTA' | 'CRITICO';
  acao: string;
}

const QUADRANT_COLORS: Record<string, string> = {
  ESCALAR: 'var(--color-gs-green)',
  FREAR: 'var(--color-gs-yellow)',
  ALERTA: 'var(--color-gs-orange)',
  CRITICO: 'var(--color-gs-red)',
};

const QUADRANT_ACTIONS: Record<string, string> = {
  ESCALAR: 'ESCALAR ADS — Full Power',
  FREAR: 'FREAR ADS — Queimar menos até repor',
  ALERTA: 'ALERTA — Ruptura Iminente',
  CRITICO: 'CRÍTICO — Parar Ads AGORA',
};

export function StockAdsMatrix() {
  const navigate = useNavigate();
  const [stockThreshold, setStockThreshold] = useState(15);
  const [adsThreshold] = useState(50);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-ads-matrix'],
    queryFn: async (): Promise<MatrixProduct[]> => {
      // Real schema: item_id=mlb, visitas_total, vendas_total
      const { data: produtos } = await supabase
        .from('live_produtos')
        .select('item_id, sku, titulo, estoque')
        .limit(200);

      if (!produtos || produtos.length === 0) return [];

      const skus = produtos.map((p: Record<string, unknown>) => p.sku as string).filter(Boolean);

      // Real schema: severidade (not severity)
      const { data: alertas } = await supabase
        .from('ia_alertas_operacionais')
        .select('sku, tipo_alerta, severidade')
        .in('sku', skus);

      const alertasBySku = new Map<string, number>();
      for (const a of alertas ?? []) {
        const curr = alertasBySku.get(a.sku) ?? 0;
        const sev = (a.severidade ?? '').toUpperCase();
        const weight = sev === 'CRITICO' || sev === 'CRÍTICO' ? 30 : sev === 'ALTO' ? 20 : 10;
        alertasBySku.set(a.sku, curr + weight);
      }

      return produtos.map((p: Record<string, unknown>) => {
        const estoque = (p.estoque as number) ?? 0;
        const adsScore = Math.min(alertasBySku.get(p.sku as string) ?? 0, 100);

        let quadrant: MatrixProduct['quadrant'];
        if (estoque >= stockThreshold && adsScore >= adsThreshold) quadrant = 'ESCALAR';
        else if (estoque >= stockThreshold && adsScore < adsThreshold) quadrant = 'FREAR';
        else if (estoque < stockThreshold && adsScore >= adsThreshold) quadrant = 'ALERTA';
        else quadrant = 'CRITICO';

        return {
          mlb: (p.item_id as string) ?? (p.sku as string) ?? '',
          sku: (p.sku as string) ?? '',
          titulo: (p.titulo as string) ?? '',
          estoque,
          adsScore,
          quadrant,
          acao: QUADRANT_ACTIONS[quadrant],
        };
      });
    },
    staleTime: 60_000,
  });

  const products = useMemo(() => data ?? [], [data]);

  const quadrantCounts = useMemo(() => {
    const counts = { ESCALAR: 0, FREAR: 0, ALERTA: 0, CRITICO: 0 };
    for (const p of products) counts[p.quadrant]++;
    return counts;
  }, [products]);

  const maxEstoque = useMemo(() => Math.max(...products.map((p) => p.estoque), 50), [products]);
  const maxAds = 100;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitMerge size={14} style={{ color: 'var(--color-gs-green)' }} />
            <span
              className="font-mono text-[9px] tracking-[0.25em] uppercase"
              style={{ color: 'var(--color-gs-green)' }}
            >
              CORRELAÇÃO ESTOQUE × ADS
            </span>
          </div>
          <h2
            className="font-heading font-black tracking-wide uppercase"
            style={{ fontSize: '22px', color: 'var(--color-gs-text)', lineHeight: 1 }}
          >
            STOCK_ADS<span style={{ color: 'var(--color-gs-green)' }}>.</span>
          </h2>
          <p
            className="font-mono text-[9px] tracking-[0.2em] uppercase mt-1"
            style={{ color: 'var(--color-gs-muted)' }}
          >
            MATRIZ DE 4 QUADRANTES · DECISÃO TÁTICA DE ADS VS ESTOQUE
          </p>
        </div>

        {/* Threshold controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[8px] tracking-wider uppercase"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              CORTE ESTOQUE:
            </span>
            <input
              type="number"
              value={stockThreshold}
              onChange={(e) => setStockThreshold(Number(e.target.value) || 15)}
              className="font-mono text-[10px] w-12 px-1 py-0.5 text-center rounded-sm"
              style={{
                background: 'var(--color-gs-bg)',
                border: '1px solid var(--color-gs-border)',
                color: 'var(--color-gs-text)',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Quadrant summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['ESCALAR', 'FREAR', 'ALERTA', 'CRITICO'] as const).map((q) => (
          <div
            key={q}
            className="flex flex-col items-center py-3 rounded-sm"
            style={{
              background: 'var(--color-gs-panel)',
              border: '1px solid var(--color-gs-border)',
            }}
          >
            <span className="font-heading font-black text-xl" style={{ color: QUADRANT_COLORS[q] }}>
              {quadrantCounts[q]}
            </span>
            <span
              className="font-mono text-[8px] tracking-[0.2em] uppercase mt-0.5"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              {q}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        style={{
          background: 'var(--color-gs-panel)',
          border: '1px solid var(--color-gs-border)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-gs-border)' }}>
          <div className="flex items-center gap-2">
            <Info size={11} style={{ color: 'var(--color-gs-muted)' }} />
            <span
              className="font-mono text-[9px] tracking-[0.2em] uppercase font-bold"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              DISPERSÃO ESTOQUE × INVESTIMENTO ADS
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div
              className="h-32 w-32 animate-pulse rounded-full"
              style={{ background: 'var(--color-gs-border)' }}
            />
          </div>
        ) : (
          <div className="p-4" style={{ height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="var(--color-gs-chart-grid)" strokeDasharray="3 6" />
                <XAxis
                  type="number"
                  dataKey="adsScore"
                  name="Ads Score"
                  domain={[0, maxAds]}
                  tick={{
                    fill: 'var(--color-gs-muted)',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                  }}
                  label={{
                    value: 'ADS SCORE →',
                    position: 'bottom',
                    style: {
                      fill: 'var(--color-gs-muted)',
                      fontSize: 8,
                      fontFamily: 'JetBrains Mono',
                      letterSpacing: '0.2em',
                    },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="estoque"
                  name="Estoque"
                  domain={[0, maxEstoque]}
                  tick={{
                    fill: 'var(--color-gs-muted)',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                  }}
                  label={{
                    value: 'ESTOQUE ↑',
                    angle: -90,
                    position: 'insideLeft',
                    style: {
                      fill: 'var(--color-gs-muted)',
                      fontSize: 8,
                      fontFamily: 'JetBrains Mono',
                      letterSpacing: '0.2em',
                    },
                  }}
                />

                {/* Quadrant backgrounds */}
                <ReferenceArea
                  x1={adsThreshold}
                  x2={maxAds}
                  y1={stockThreshold}
                  y2={maxEstoque}
                  fill="var(--color-gs-green)"
                  fillOpacity={0.05}
                />
                <ReferenceArea
                  x1={0}
                  x2={adsThreshold}
                  y1={stockThreshold}
                  y2={maxEstoque}
                  fill="var(--color-gs-yellow)"
                  fillOpacity={0.05}
                />
                <ReferenceArea
                  x1={adsThreshold}
                  x2={maxAds}
                  y1={0}
                  y2={stockThreshold}
                  fill="var(--color-gs-orange)"
                  fillOpacity={0.05}
                />
                <ReferenceArea
                  x1={0}
                  x2={adsThreshold}
                  y1={0}
                  y2={stockThreshold}
                  fill="var(--color-gs-red)"
                  fillOpacity={0.05}
                />

                {/* Threshold lines */}
                <ReferenceLine
                  x={adsThreshold}
                  stroke="var(--color-gs-border)"
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  y={stockThreshold}
                  stroke="var(--color-gs-border)"
                  strokeDasharray="4 4"
                />

                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: 'var(--color-gs-muted)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const item = payload[0].payload as MatrixProduct;
                    return (
                      <div
                        className="px-3 py-2"
                        style={{
                          background: 'var(--color-gs-panel)',
                          border: '1px solid var(--color-gs-border)',
                          borderRadius: '2px',
                        }}
                      >
                        <div
                          className="font-mono text-[10px] font-bold"
                          style={{ color: 'var(--color-gs-text)' }}
                        >
                          {item.sku}
                        </div>
                        <div
                          className="font-mono text-[9px] mt-1"
                          style={{ color: 'var(--color-gs-muted)' }}
                        >
                          Estoque: {item.estoque} · Ads: {item.adsScore}
                        </div>
                        <div
                          className="font-mono text-[8px] font-bold mt-1"
                          style={{ color: QUADRANT_COLORS[item.quadrant] }}
                        >
                          → {item.acao}
                        </div>
                        <div className="font-mono text-[7px] mt-2 text-gs-muted italic border-t border-gs-border/30 pt-1 uppercase tracking-tighter">
                          Clique para detalhamento no Terminal
                        </div>
                      </div>
                    );
                  }}
                />

                <Scatter
                  data={products}
                  onClick={(data: Record<string, unknown>) => {
                    if (data && data.payload) {
                      const payload = data.payload as MatrixProduct;
                      navigate(`/terminal?sku=${payload.sku}&mlb=${payload.mlb}`);
                    }
                  }}
                  shape={(props: unknown) => {
                    const item = props as { cx: number; cy: number; payload: MatrixProduct };
                    return (
                      <circle
                        cx={item.cx}
                        cy={item.cy}
                        r={5}
                        fill={QUADRANT_COLORS[item.payload.quadrant]}
                        fillOpacity={0.7}
                        stroke={QUADRANT_COLORS[item.payload.quadrant]}
                        strokeWidth={1}
                        style={{ cursor: 'pointer' }}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quadrant legend */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-0"
          style={{ borderTop: '1px solid var(--color-gs-border)' }}
        >
          {[
            { q: 'CRITICO', label: 'PARAR ADS AGORA', desc: 'Estoque baixo + Sem ads' },
            { q: 'ALERTA', label: 'RUPTURA IMINENTE', desc: 'Estoque baixo + Alto ads' },
            { q: 'FREAR', label: 'FREAR ADS', desc: 'Estoque alto + Sem ads' },
            { q: 'ESCALAR', label: 'ESCALAR ADS', desc: 'Estoque alto + Alto ads' },
          ].map((item) => (
            <div
              key={item.q}
              className="flex items-center gap-2 px-3 py-2"
              style={{ borderRight: '1px solid var(--color-gs-border)' }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: QUADRANT_COLORS[item.q] }}
              />
              <div className="flex flex-col">
                <span
                  className="font-mono text-[8px] font-bold tracking-wider uppercase"
                  style={{ color: QUADRANT_COLORS[item.q] }}
                >
                  {item.label}
                </span>
                <span className="font-mono text-[7px]" style={{ color: 'var(--color-gs-muted)' }}>
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
