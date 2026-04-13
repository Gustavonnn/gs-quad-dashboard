import { useState, useEffect } from 'react';
import type { TerminalSkuItem, MlbItem } from '../types/terminal';
import { supabase } from '../lib/supabase';

// Mock fallback generator
function generateMockFallback(): TerminalSkuItem[] {
  return Array.from({ length: 20 }).map((_, i) => {
    const sku = `SKU-DEMO-${i + 1000}`;
    const isA = i < 5;
    const isB = i >= 5 && i < 12;
    const rev = isA ? 15000 + Math.random() * 20000 : isB ? 3000 + Math.random() * 5000 : Math.random() * 2000;
    
    const dateKeys: string[] = [];
    for (let d = 29; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      dateKeys.push(date.toISOString().split('T')[0]);
    }
    
    const chartData = dateKeys.map(k => ({
      date: k.substring(8, 10) + '/' + k.substring(5, 7),
      revenue: Math.floor(Math.random() * rev / 30),
      sales: Math.floor(Math.random() * 20)
    }));

    return {
      sku,
      title: `Produto Demo ${i + 1}`,
      abc_class: isA ? 'A' : isB ? 'B' : 'C',
      total_revenue_30d: rev,
      total_sales_units: Math.floor(rev / 50),
      global_stock: Math.floor(Math.random() * 200),
      trend: Math.random() > 0.5 ? 'UP' : 'DOWN',
      mlbs: Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, j) => {
        const totalSales = Math.floor(Math.random() * 50);
        return {
          mlb_id: `MLB${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          title: `Anúncio Demo ${j + 1}`,
          price: Math.floor(Math.random() * 300) + 50,
          sales_7d: Math.floor(totalSales * 7 / 30),
          sales_15d: Math.floor(totalSales * 15 / 30),
          sales_30d: totalSales,
          status: Math.random() > 0.8 ? 'paused' : 'active',
          stock: Math.floor(Math.random() * 50),
          visits: Math.floor(Math.random() * 500)
        };
      }),
      chartData
    };
  });
}

// Lógica de hidratação dos dados cruzados via Banco
export function useTerminalData() {
  const [data, setData] = useState<TerminalSkuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRealData() {
      setLoading(true);
      setError(null);

      try {
        // 1. Array Paralelo de Promessas consumindo toda a malha no DB.
        const [curvaRes, produtosRes, vendasRes] = await Promise.all([
          supabase.from('curva_abc').select('*').order('receita_30d', { ascending: false }).limit(200),
          supabase.from('live_produtos').select('*').limit(2000),
          supabase.from('live_vendas').select('*').limit(5000)
        ]);

      const skus = curvaRes.data || [];
      const produtos = produtosRes.data || [];
      const vendas = vendasRes.data || [];

      // Debug logging
      console.log('[TerminalDB] curva_abc rows:', skus.length, curvaRes.error);
      console.log('[TerminalDB] live_produtos rows:', produtos.length, produtosRes.error);
      console.log('[TerminalDB] live_vendas rows:', vendas.length, vendasRes.error);

      // If no real data, show message but don't crash - use mock fallback
      if (skus.length === 0) {
        console.warn('[TerminalDB] No real data found. Using mock fallback for demo.');
        const mockFallback = generateMockFallback();
        setData(mockFallback);
        setLoading(false);
        return;
      }

      // 2. Mapeamento de Vendas por SKUs para montar o Gráfico Temporal
      // Agrupa { "SKU_X": { "2026-04-01": { revenue: 100, sales: 2 } } }
      const vendasMap: Record<string, Record<string, { revenue: number, sales: number }>> = {};
      
      vendas.forEach(v => {
        // Sanitização: trim() para remover espaços invisíveis do BD
        const s = String(v.sku || '').trim();
        // Guard: new Date(undefined).toISOString() throws RangeError
        if (!s || !v.data_venda) return;
        // Normalização ISO para evitar problemas de fuso horário
        const d = new Date(v.data_venda).toISOString().split('T')[0];
        if (!d) return;

        if (!vendasMap[s]) vendasMap[s] = {};
        if (!vendasMap[s][d]) vendasMap[s][d] = { revenue: 0, sales: 0 };
        
        vendasMap[s][d].revenue += parseFloat(v.receita_total || '0');
        vendasMap[s][d].sales += parseInt(v.quantidade || '0', 10);
      });

      // 3. Montar calendário dinâmico dos últimos 30 dias para normalizar e preencher buracos "zeros" no gráfico (Recharts ama array sequencial).
      const dateKeys: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateKeys.push(d.toISOString().split('T')[0]);
      }

      // 4. Mapeamento de Produtos (MLBs) Atrelados aos SKUs
      const mlbMap: Record<string, MlbItem[]> = {};
      produtos.forEach(p => {
        // Sanitização: trim() para remover espaços invisíveis do BD
        const s = String(p.sku || '').trim();
        if (!s) return;

        if (!mlbMap[s]) mlbMap[s] = [];
        mlbMap[s].push({
          mlb_id: p.item_id || 'MLB_UNKNOWN',
          title: p.titulo || 'Produto não catalogado',
          price: typeof p.preco === 'number' ? p.preco : parseFloat(p.preco || '0'),
          sales_7d: typeof p.vendas_7d === 'number' ? p.vendas_7d : 0,
          sales_15d: typeof p.vendas_15d === 'number' ? p.vendas_15d : 0,
          sales_30d: typeof p.vendas_total === 'number' ? p.vendas_total : parseInt(p.vendas_total || '0', 10),
          status: (() => {
            const raw = (p.status || '').toLowerCase().trim();
            if (raw === 'ativo' || raw === 'active') return 'active';
            if (raw === 'pausado' || raw === 'paused') return 'paused';
            if (raw === 'inativo' || raw === 'inactive' || raw === 'fechado' || raw === 'closed') return 'inactive';
            return 'unknown';
          })(),
          stock: typeof p.estoque === 'number' ? p.estoque : parseInt(p.estoque || '0', 10),
          visits: typeof p.visitas_total === 'number' ? p.visitas_total : parseInt(p.visitas_total || '0', 10),
        });
      });

      // 5. Hidratação da Tabela Master Detail
      console.log('[TerminalDB] mlbMap keys sample:', Object.keys(mlbMap).slice(0, 5));
      console.log('[TerminalDB] vendasMap keys sample:', Object.keys(vendasMap).slice(0, 5));
      console.log('[TerminalDB] First SKU from curva_abc:', skus[0]?.id);

      const populatedData: TerminalSkuItem[] = skus.map(s => {
        // Sanitização: usar SKU com trim para lookup
        const skuKey = String(s.id || '').trim();
        const myVendas = vendasMap[skuKey] || {};
        const myMlbs = mlbMap[skuKey] || [];
        
        // Prepara chartData (30 dias base)
        const chartData = dateKeys.map(k => {
          const vd = myVendas[k] || { revenue: 0, sales: 0 };
          return {
             date: k.substring(8, 10) + '/' + k.substring(5, 7), 
             revenue: typeof vd.revenue === 'number' ? vd.revenue : 0,
             sales: typeof vd.sales === 'number' ? vd.sales : 0,
          };
        });
        if (s.id === skus[0]?.id) {
          console.log(`[TerminalDB] TOP SKU ${s.id}: mlbs=${myMlbs.length}, chartDays with revenue=${chartData.filter(d => d.revenue > 0).length}`);
        }
        const totalSalesUnits = myMlbs.reduce((acc, m) => acc + m.sales_30d, 0) || Math.floor((s.receita_30d || 0) / 100);

        return {
          sku: s.id,
          title: s.titulo,
          abc_class: s.curva_abc,
          total_revenue_30d: s.receita_30d,
          total_sales_units: totalSalesUnits,
          global_stock: myMlbs.reduce((acc, m) => acc + (m.stock || 0), 0),
          trend: (() => {
            const t = (s.tendencia || '').toLowerCase();
            if (t.includes('acelerando') || t.includes('crescendo') || t.includes('subindo')) return 'UP';
            if (t.includes('desacelerando') || t.includes('caindo') || t.includes('decl')) return 'DOWN';
            return 'STABLE';
          })(),
          mlbs: myMlbs,
          chartData: chartData
        };
      });

      // Diagnostic: ver os últimos 5 dias do primeiro SKU
      if (populatedData.length > 0) {
        console.log('[TerminalDB] === CHART DATA DIAGNOSTIC ===');
        console.table(populatedData[0].chartData.slice(-5));
        console.log('[TerminalDB] Total days:', populatedData[0].chartData.length);
        console.log('[TerminalDB] Days with revenue > 0:', populatedData[0].chartData.filter(d => d.revenue > 0).length);
      }

      setData(populatedData);
      } catch (err) {
        console.error('[TerminalDB] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        const mockFallback = generateMockFallback();
        setData(mockFallback);
      }
      setLoading(false);
    }

    fetchRealData();
  }, []);

  return { data, loading, error };
}
