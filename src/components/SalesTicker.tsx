import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DropAnalysisRadar } from './DropAnalysisRadar';

interface TickerItem {
  mlb: string;
  sku: string;
  delta: number;
  deltaPct: number;
}

export function SalesTicker() {
  const navigate = useNavigate();
  const [selectedMlb, setSelectedMlb] = useState<string | null>(null);

  const { data: items } = useQuery({
    queryKey: ['sales-ticker'],
    queryFn: async (): Promise<TickerItem[]> => {
      // Real schema: item_id=mlb, no mlb field directly
      const { data: produtos } = await supabase
        .from('live_produtos')
        .select('item_id, sku')
        .limit(100);

      if (!produtos || produtos.length === 0) return [];

      const skus = produtos.map((p: Record<string, unknown>) => p.sku as string).filter(Boolean);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);

      // Real schema: receita_total (not receita)
      const { data: vendas } = await supabase
        .from('live_vendas')
        .select('sku, receita_total, data_venda')
        .in('sku', skus)
        .gte('data_venda', sevenDaysAgo.toISOString());

      const now = Date.now();
      const msPerDay = 86400000;

      const byMlb = new Map<string, { sku: string; curr: number; prev: number }>();
      const skuToMlb = new Map<string, string>();
      for (const p of produtos) {
        // Use item_id as mlb key
        const mlbKey = (p.item_id as string) ?? (p.sku as string);
        skuToMlb.set(p.sku as string, mlbKey);
        byMlb.set(mlbKey, { sku: p.sku as string, curr: 0, prev: 0 });
      }

      for (const v of vendas ?? []) {
        const mlb = skuToMlb.get(v.sku as string);
        if (!mlb) continue;
        const entry = byMlb.get(mlb);
        if (!entry) continue;
        const age = now - new Date(v.data_venda as string).getTime();
        // Use receita_total from real schema
        if (age < 7 * msPerDay) {
          entry.curr += (v.receita_total as number) ?? 0;
        } else {
          entry.prev += (v.receita_total as number) ?? 0;
        }
      }

      const result: TickerItem[] = [];
      for (const [mlb, { sku, curr, prev }] of byMlb) {
        const delta = curr - prev;
        const deltaPct = prev > 0 ? (delta / prev) * 100 : curr > 0 ? 100 : 0;
        result.push({ mlb, sku, delta, deltaPct });
      }

      return result.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    },
    staleTime: 60_000,
  });

  const tickerItems = useMemo(() => items ?? [], [items]);

  if (tickerItems.length === 0) return null;

  const duplicated = [...tickerItems, ...tickerItems];

  return (
    <>
      <div
        className="overflow-hidden shrink-0"
        style={{
          height: '28px',
          borderBottom: '1px solid var(--color-gs-border)',
          background: 'var(--color-gs-panel)',
        }}
      >
        <div
          className="flex items-center h-full whitespace-nowrap gap-6"
          style={{
            animation: `ticker-scroll ${Math.max(tickerItems.length * 3, 20)}s linear infinite`,
            width: 'max-content',
          }}
        >
          {duplicated.map((item, idx) => {
            const color =
              item.delta > 0
                ? 'var(--color-gs-blue)'
                : item.delta < 0
                  ? 'var(--color-gs-red)'
                  : 'var(--color-gs-muted)';
            const arrow = item.delta > 0 ? '↑' : item.delta < 0 ? '↓' : '•';

            return (
              <button
                key={`${item.mlb}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/terminal?sku=${item.sku}&mlb=${item.mlb}`);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedMlb(item.mlb);
                }}
                className="flex items-center gap-1.5 transition-all hover:opacity-80"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <span
                  className="font-mono text-[9px] font-bold"
                  style={{ color: 'var(--color-gs-text)' }}
                >
                  {item.sku}
                </span>
                <span className="font-mono text-[9px] font-bold" style={{ color }}>
                  {arrow}
                </span>
                <span className="font-mono text-[9px]" style={{ color }}>
                  {item.delta >= 0 ? '+' : '-'}R${Math.abs(item.delta).toFixed(0)}
                </span>
                <span className="font-mono text-[8px] font-bold" style={{ color, opacity: 0.8 }}>
                  ({item.deltaPct >= 0 ? '+' : ''}
                  {item.deltaPct.toFixed(1)}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal for DropAnalysisRadar */}
      {selectedMlb && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedMlb(null)}
          />
          <div
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 w-[380px] max-w-[90vw]"
            style={{
              background: 'var(--color-gs-panel)',
              border: '1px solid var(--color-gs-border)',
              borderRadius: '2px',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="font-mono text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--color-gs-text)' }}
              >
                DIAGNÓSTICO: {selectedMlb}
              </span>
              <button
                onClick={() => setSelectedMlb(null)}
                className="font-mono text-[10px] px-2 py-1 rounded-sm"
                style={{
                  color: 'var(--color-gs-muted)',
                  background: 'var(--color-gs-hover-overlay)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ESC
              </button>
            </div>
            <DropAnalysisRadar mlb={selectedMlb} />
          </div>
        </>
      )}

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}
