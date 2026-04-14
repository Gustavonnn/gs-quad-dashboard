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
      sales_7d: Math.floor(rev / 50 * 7 / 30),
      sales_15d: Math.floor(rev / 50 * 15 / 30),
      sales_30d: Math.floor(rev / 50),
      sales_yesterday: Math.floor(Math.random() * 10),
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
          sales_yesterday: Math.floor(Math.random() * 5),
          status: Math.random() > 0.8 ? 'paused' : 'active',
          stock: Math.floor(Math.random() * 50),
          visits: Math.floor(Math.random() * 500),
          chartData: dateKeys.map(k => ({
            date: k.substring(8, 10) + '/' + k.substring(5, 7),
            revenue: Math.floor(Math.random() * 100),
            sales: Math.floor(Math.random() * 3)
          }))
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
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 32); 
        const cutoffIso = cutoff.toISOString();

        const [curvaRes, produtosRes, vendasRes] = await Promise.all([
          supabase.from('curva_abc').select('*').order('receita_30d', { ascending: false }).limit(200),
          supabase.from('live_produtos').select('*').limit(2000),
          supabase.from('live_vendas')
            .select('*')
            .gte('data_venda', cutoffIso)
            .limit(50000)
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

      // 2. Mapeamento de Vendas por SKUs e MLBs para montar o Gráfico Temporal
      // Agrupa SKU -> Data e também SKU -> MLB -> Data
      const vendasMap: Record<string, Record<string, { revenue: number, sales: number }>> = {};
      const mlbVendasMap: Record<string, Record<string, Record<string, { revenue: number, sales: number }>>> = {};
      
      vendas.forEach(v => {
        // Normalização garantida: UpperCase + Trim
        const s = String(v.sku || '').trim().toUpperCase();
        const m = v.item_id ? 'MLB' + String(v.item_id).replace(/\D/g, '') : null;
        if (!s || !v.data_venda) return;
        
        const d = new Date(v.data_venda).toISOString().split('T')[0];
        if (!d) return;

        // Agrupamento por SKU (Geral)
        if (!vendasMap[s]) vendasMap[s] = {};
        if (!vendasMap[s][d]) vendasMap[s][d] = { revenue: 0, sales: 0 };
        vendasMap[s][d].revenue += parseFloat(v.receita_total || '0');
        vendasMap[s][d].sales += parseInt(v.quantidade || '0', 10);

        // Agrupamento por MLB (Granular)
        if (m) {
          if (!mlbVendasMap[s]) mlbVendasMap[s] = {};
          if (!mlbVendasMap[s][m]) mlbVendasMap[s][m] = {};
          if (!mlbVendasMap[s][m][d]) mlbVendasMap[s][m][d] = { revenue: 0, sales: 0 };
          mlbVendasMap[s][m][d].revenue += parseFloat(v.receita_total || '0');
          mlbVendasMap[s][m][d].sales += parseInt(v.quantidade || '0', 10);
        }
      });

      console.log('[TerminalDB] mlbVendasMap keys:', Object.keys(mlbVendasMap).slice(0, 5));
      if (vendas.length > 0) console.log('[TerminalDB] Sample venda keys:', Object.keys(vendas[0]));

      // 3. Montar calendário dinâmico dos últimos 30 dias para normalizar e preencher buracos "zeros" no gráfico (Recharts ama array sequencial).
      const dateKeys: string[] = [];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayIso = yesterdayDate.toISOString().split('T')[0];

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Usar data local para o keying para bater com o split('T')[0] do loop anterior
        const dateKey = d.toISOString().split('T')[0];
        dateKeys.push(dateKey);
      }

      console.log('[TerminalDB] DateKeys Range:', dateKeys[0], 'to', dateKeys[dateKeys.length - 1]);

      // 4. Mapeamento de Produtos (MLBs) Atrelados aos SKUs
      const mlbMap: Record<string, MlbItem[]> = {};
      produtos.forEach(p => {
        const s = String(p.sku || '').trim().toUpperCase();
        if (!s) return;

        const mlbId = p.item_id ? 'MLB' + String(p.item_id).replace(/\D/g, '') : 'MLB_UNKNOWN';
        const myMlbVendas = (mlbVendasMap[s] || {})[mlbId] || {};
        
        // DATA_ENGINE: 1.08-STRICT
        const m7 = dateKeys.slice(-7).reduce((acc, k) => acc + (myMlbVendas[k]?.sales || 0), 0);
        const m15 = dateKeys.slice(-15).reduce((acc, k) => acc + (myMlbVendas[k]?.sales || 0), 0);
        const m30 = dateKeys.reduce((acc, k) => acc + (myMlbVendas[k]?.sales || 0), 0);

        if (myMlbVendas[yesterdayIso]) {
           console.log(`[TerminalDB] Match found for MLB ${mlbId} on sku ${s}`);
        }

        if (myMlbVendas[yesterdayIso]) {
           console.log(`[TerminalDB] Match found for MLB ${mlbId} on sku ${s}`);
        }

        if (!mlbMap[s]) mlbMap[s] = [];
        mlbMap[s].push({
          mlb_id: mlbId,
          title: p.titulo || 'Produto não catalogado',
          price: typeof p.preco === 'number' ? p.preco : parseFloat(p.preco || '0'),
          sales_7d: m7,
          sales_15d: m15,
          sales_30d: m30,
          sales_yesterday: myMlbVendas[yesterdayIso]?.sales || 0,
          status: (() => {
            const raw = (p.status || '').toLowerCase().trim();
            if (raw === 'ativo' || raw === 'active') return 'active';
            if (raw === 'pausado' || raw === 'paused') return 'paused';
            if (raw === 'inativo' || raw === 'inactive' || raw === 'fechado' || raw === 'closed') return 'inactive';
            return 'unknown';
          })(),
          stock: typeof p.estoque === 'number' ? p.estoque : parseInt(p.estoque || '0', 10),
          visits: typeof p.visitas_total === 'number' ? p.visitas_total : parseInt(p.visitas_total || '0', 10),
          chartData: dateKeys.map(k => {
            const vd = myMlbVendas[k] || { revenue: 0, sales: 0 };
            return {
               date: k.substring(8, 10) + '/' + k.substring(5, 7),
               revenue: vd.revenue,
               sales: vd.sales,
            };
          }),
        });
      });

      // 5. Hidratação da Tabela Master Detail
      console.log('[TerminalDB] mlbMap keys sample:', Object.keys(mlbMap).slice(0, 5));
      console.log('[TerminalDB] vendasMap keys sample:', Object.keys(vendasMap).slice(0, 5));
      console.log('[TerminalDB] First SKU from curva_abc:', skus[0]?.id);

      const populatedData: TerminalSkuItem[] = skus.map(s => {
        // Sanitização: usar SKU com trim + Upper para lookup
        const skuKey = String(s.id || '').trim().toUpperCase();
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
        const s7 = myMlbs.reduce((acc, m) => acc + m.sales_7d, 0);
        const s15 = myMlbs.reduce((acc, m) => acc + m.sales_15d, 0);
        const s30 = totalSalesUnits;
        const sYest = myMlbs.reduce((acc, m) => acc + m.sales_yesterday, 0);

        return {
          sku: s.id,
          sku_master: (s as any).sku_master || null,
          is_master: (s as any).is_master || false,
          title: s.titulo,
          abc_class: s.curva_abc,
          total_revenue_30d: s.receita_30d,
          total_sales_units: totalSalesUnits,
          sales_7d: s7,
          sales_15d: s15,
          sales_30d: s30,
          sales_yesterday: sYest,
          global_stock: myMlbs.length > 0 ? Math.max(...myMlbs.map(m => m.stock || 0)) : 0,
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
