import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Gem, Package, Zap, TrendingUp } from 'lucide-react';
import { DropAnalysisRadar } from '@/components/DropAnalysisRadar';

interface PotentialProduct {
  mlb: string;
  sku: string;
  titulo: string;
  estoque: number;
  preco: number;
  conversao: number;
  visits: number;
  vendas30d: number;
  receitaPotencial: number;
  perdaDiaria: number;
  tipo: 'parado' | 'oportunidade';
  acao: string;
}

export function HiddenPotential() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'parado' | 'oportunidade'>('parado');
  const [selectedMlb, setSelectedMlb] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hidden-potential'],
    queryFn: async (): Promise<PotentialProduct[]> => {
      // Real schema: item_id=mlb, visitas_total, vendas_total
      const { data: produtos } = await supabase
        .from('live_produtos')
        .select('item_id, sku, titulo, preco, estoque, visitas_total, vendas_total')
        .limit(300);

      if (!produtos || produtos.length === 0) return [];

      const skus = produtos.map((p: Record<string, unknown>) => p.sku as string).filter(Boolean);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Real schema: receita_total, quantidade
      const { data: vendas } = await supabase
        .from('live_vendas')
        .select('sku, quantidade, receita_total')
        .in('sku', skus)
        .gte('data_venda', thirtyDaysAgo.toISOString());

      const { data: alertas } = await supabase
        .from('ia_alertas_operacionais')
        .select('sku, tipo_alerta')
        .in('sku', skus)
        .eq('status', 'ATIVO');

      const vendasBySku = new Map<string, number>();
      for (const v of vendas ?? []) {
        vendasBySku.set(v.sku, (vendasBySku.get(v.sku) ?? 0) + ((v.quantidade as number) ?? 0));
      }

      const alertasBySku = new Map<string, number>();
      for (const a of alertas ?? []) {
        alertasBySku.set(a.sku, (alertasBySku.get(a.sku) ?? 0) + 1);
      }

      // Compute averages from real fields
      const allConvRaw = produtos
        .map((p: Record<string, unknown>) => {
          const vis = (p.visitas_total as number) ?? 0;
          const vend = (p.vendas_total as number) ?? 0;
          return vis > 0 ? (vend / vis) * 100 : 0;
        })
        .filter((c: number) => c > 0);
      const avgConv =
        allConvRaw.length > 0
          ? allConvRaw.reduce((s: number, c: number) => s + c, 0) / allConvRaw.length
          : 5;
      const allVendas30d = Array.from(vendasBySku.values());
      const avgVendas =
        allVendas30d.length > 0 ? allVendas30d.reduce((s, v) => s + v, 0) / allVendas30d.length : 5;
      const avgAlertas =
        alertasBySku.size > 0
          ? Array.from(alertasBySku.values()).reduce((s, v) => s + v, 0) / alertasBySku.size
          : 1;

      const results: PotentialProduct[] = [];

      for (const p of produtos) {
        const prod = p as Record<string, unknown>;
        const estoque = (prod.estoque as number) ?? 0;
        const preco = (prod.preco as number) ?? 0;
        const visitas = (prod.visitas_total as number) ?? 0;
        const vendas_t = (prod.vendas_total as number) ?? 0;
        const conv = visitas > 0 ? Math.min((vendas_t / visitas) * 100, 100) : 0;
        const vendas30d = vendasBySku.get(prod.sku as string) ?? 0;
        const adsCount = alertasBySku.get(prod.sku as string) ?? 0;

        if (estoque > 30 && vendas30d < avgVendas) {
          const receitaPotencial = estoque * preco * (avgConv / 100);
          results.push({
            mlb: (prod.item_id as string) ?? '',
            sku: (prod.sku as string) ?? '',
            titulo: (prod.titulo as string) ?? '',
            estoque,
            preco,
            conversao: conv,
            visits: visitas,
            vendas30d,
            receitaPotencial,
            perdaDiaria: receitaPotencial / 30,
            tipo: 'parado',
            acao: 'ESTOQUE PARADO — ATIVAR CAMPANHAS',
          });
        }

        if (conv > 8 && estoque > 10 && adsCount < avgAlertas) {
          const receitaPotencial = estoque * preco * (conv / 100);
          results.push({
            mlb: (prod.item_id as string) ?? '',
            sku: (prod.sku as string) ?? '',
            titulo: (prod.titulo as string) ?? '',
            estoque,
            preco,
            conversao: conv,
            visits: visitas,
            vendas30d,
            receitaPotencial,
            perdaDiaria: receitaPotencial / 30,
            tipo: 'oportunidade',
            acao: 'ESCALAR ADS AGORA — ROI PROVAVEL ALTO',
          });
        }
      }

      return results.sort((a, b) => b.receitaPotencial - a.receitaPotencial);
    },
    staleTime: 60_000,
  });

  const products = useMemo(() => (data ?? []).filter((p) => p.tipo === tab), [data, tab]);

  const totalPotencial = useMemo(
    () => products.reduce((s, p) => s + p.receitaPotencial, 0),
    [products]
  );

  function fmt(v: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(v);
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gem size={14} style={{ color: 'var(--color-gs-green)' }} />
            <span
              className="font-mono text-[9px] tracking-[0.25em] uppercase"
              style={{ color: 'var(--color-gs-green)' }}
            >
              POTENCIAL ESCONDIDO
            </span>
          </div>
          <h2
            className="font-heading font-black tracking-wide uppercase"
            style={{ fontSize: '22px', color: 'var(--color-gs-text)', lineHeight: 1 }}
          >
            HIDDEN_POTENTIAL<span style={{ color: 'var(--color-gs-green)' }}>.</span>
          </h2>
          <p
            className="font-mono text-[9px] tracking-[0.2em] uppercase mt-1"
            style={{ color: 'var(--color-gs-muted)' }}
          >
            RECEITA PRESA EM ESTOQUE PARADO · OPORTUNIDADES RÁPIDAS
          </p>
        </div>

        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{
            background: 'var(--color-gs-panel)',
            border: '1px solid var(--color-gs-border)',
            borderRadius: '2px',
          }}
        >
          <span
            className="font-mono text-[8px] tracking-wider uppercase"
            style={{ color: 'var(--color-gs-muted)' }}
          >
            RECEITA POTENCIAL TOTAL:
          </span>
          <span
            className="font-heading font-black text-lg"
            style={{ color: 'var(--color-gs-green)' }}
          >
            {fmt(totalPotencial)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setTab('parado')}
          className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase px-4 py-2 rounded-sm transition-all"
          style={{
            background: tab === 'parado' ? 'var(--color-gs-yellow)' : 'transparent',
            color: tab === 'parado' ? '#000' : 'var(--color-gs-muted)',
            border: `1px solid ${tab === 'parado' ? 'var(--color-gs-yellow)' : 'var(--color-gs-border)'}`,
            cursor: 'pointer',
          }}
        >
          <Package size={11} />
          ESTOQUE PARADO
        </button>
        <button
          onClick={() => setTab('oportunidade')}
          className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase px-4 py-2 rounded-sm transition-all"
          style={{
            background: tab === 'oportunidade' ? 'var(--color-gs-green)' : 'transparent',
            color: tab === 'oportunidade' ? '#000' : 'var(--color-gs-muted)',
            border: `1px solid ${tab === 'oportunidade' ? 'var(--color-gs-green)' : 'var(--color-gs-border)'}`,
            cursor: 'pointer',
          }}
        >
          <Zap size={11} />
          OPORTUNIDADES RÁPIDAS
        </button>
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
        {/* Header */}
        <div
          className="grid items-center px-4 py-2"
          style={{
            gridTemplateColumns: '2fr 80px 80px 80px 120px 100px',
            borderBottom: '1px solid var(--color-gs-border)',
            background: 'var(--color-gs-bg)',
          }}
        >
          {['PRODUTO', 'ESTOQUE', 'PREÇO', 'CONV.', 'REC. POTENCIAL', 'PERDA/DIA'].map((h) => (
            <span
              key={h}
              className="font-mono text-[8px] tracking-[0.22em] uppercase font-bold"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-1 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-sm"
                style={{ background: 'var(--color-gs-border)' }}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center">
            <span className="font-mono text-[10px]" style={{ color: 'var(--color-gs-muted)' }}>
              {tab === 'parado'
                ? 'Nenhum produto com estoque parado detectado'
                : 'Nenhuma oportunidade rápida no momento'}
            </span>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {products.map((p) => (
              <button
                key={`${p.mlb}-${p.tipo}`}
                onClick={() => setSelectedMlb(p.mlb)}
                className="grid items-center px-4 py-2.5 w-full text-left transition-colors hover:bg-[var(--color-gs-hover-overlay)]"
                style={{
                  gridTemplateColumns: '2fr 80px 80px 80px 120px 100px',
                  borderBottom: '1px solid var(--color-gs-border)',
                  background: 'transparent',
                  border: 'none',
                  borderBlockEnd: '1px solid var(--color-gs-border)',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="flex flex-col gap-0.5 min-w-0 pr-2 cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/terminal?sku=${p.sku}&mlb=${p.mlb}`);
                  }}
                >
                  <span
                    className="font-mono text-[10px] font-bold truncate group-hover:text-blue-500 transition-colors"
                    style={{ color: 'var(--color-gs-text)' }}
                  >
                    {p.titulo || p.mlb}
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendingUp
                      size={8}
                      style={{
                        color:
                          tab === 'oportunidade'
                            ? 'var(--color-gs-green)'
                            : 'var(--color-gs-yellow)',
                      }}
                    />
                    <span
                      className="font-mono text-[8px] font-bold tracking-wider"
                      style={{
                        color:
                          tab === 'oportunidade'
                            ? 'var(--color-gs-green)'
                            : 'var(--color-gs-yellow)',
                      }}
                    >
                      {p.acao}
                    </span>
                  </div>
                </div>

                <span
                  className="font-mono text-[10px] font-bold"
                  style={{
                    color: p.estoque > 50 ? 'var(--color-gs-yellow)' : 'var(--color-gs-text)',
                  }}
                >
                  {p.estoque}
                </span>

                <span className="font-mono text-[10px]" style={{ color: 'var(--color-gs-text)' }}>
                  {fmt(p.preco)}
                </span>

                <span
                  className="font-mono text-[10px]"
                  style={{
                    color: p.conversao > 8 ? 'var(--color-gs-green)' : 'var(--color-gs-muted)',
                  }}
                >
                  {p.conversao.toFixed(1)}%
                </span>

                <span
                  className="font-heading font-black text-sm"
                  style={{ color: 'var(--color-gs-green)' }}
                >
                  {fmt(p.receitaPotencial)}
                </span>

                <span
                  className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm"
                  style={{ background: 'var(--color-gs-red-dim)', color: 'var(--color-gs-red)' }}
                >
                  -{fmt(p.perdaDiaria)}/d
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Drop Analysis Modal */}
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
    </div>
  );
}
