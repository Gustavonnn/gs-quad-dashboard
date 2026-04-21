import { useQuery } from '@tanstack/react-query';
import type { TerminalSkuItem, MlbItem } from '../types/terminal';
import { supabase } from '../lib/supabase';

/**
 * GS-QUAD Terminal Data Hook
 * React Query powered data hydration for the Terminal DB.
 * Joins curva_abc, live_produtos, and live_vendas to build the N-Tree structure (SKU -> MLBs).
 */
export function useTerminalData() {
  return useQuery<TerminalSkuItem[]>({
    queryKey: ['terminal-data'],
    queryFn: async () => {
      // 1. Fetch entire data graph
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

      if (curvaRes.error) throw curvaRes.error;
      if (produtosRes.error) throw produtosRes.error;
      if (vendasRes.error) throw vendasRes.error;

      const skus = curvaRes.data || [];
      const produtos = produtosRes.data || [];
      const vendas = vendasRes.data || [];

      if (skus.length === 0) {
        return [];
      }

      // 2. Map sales by SKU and MLB for charts
      const vendasMap: Record<string, Record<string, { revenue: number, sales: number }>> = {};
      const mlbVendasMap: Record<string, Record<string, Record<string, { revenue: number, sales: number }>>> = {};
      
      vendas.forEach(v => {
        const s = String(v.sku || '').trim().toUpperCase();
        const m = v.item_id ? 'MLB' + String(v.item_id).replace(/\D/g, '') : null;
        if (!s || !v.data_venda) return;
        
        const d = new Date(v.data_venda).toISOString().split('T')[0];
        if (!d) return;

        if (!vendasMap[s]) vendasMap[s] = {};
        if (!vendasMap[s][d]) vendasMap[s][d] = { revenue: 0, sales: 0 };
        vendasMap[s][d].revenue += parseFloat(v.receita_total || '0');
        vendasMap[s][d].sales += parseInt(v.quantidade || '0', 10);

        if (m) {
          if (!mlbVendasMap[s]) mlbVendasMap[s] = {};
          if (!mlbVendasMap[s][m]) mlbVendasMap[s][m] = {};
          if (!mlbVendasMap[s][m][d]) mlbVendasMap[s][m][d] = { revenue: 0, sales: 0 };
          mlbVendasMap[s][m][d].revenue += parseFloat(v.receita_total || '0');
          mlbVendasMap[s][m][d].sales += parseInt(v.quantidade || '0', 10);
        }
      });

      // 3. Generate 30-day date keys for chart normalization
      const dateKeys: string[] = [];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayIso = yesterdayDate.toISOString().split('T')[0];

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateKeys.push(d.toISOString().split('T')[0]);
      }

      // 4. Map Products (MLBs) to SKUs
      const mlbMap: Record<string, MlbItem[]> = {};
      produtos.forEach(p => {
        const s = String(p.sku || '').trim().toUpperCase();
        if (!s) return;

        const mlbId = p.item_id ? 'MLB' + String(p.item_id).replace(/\D/g, '') : 'MLB_UNKNOWN';
        const myMlbVendas = (mlbVendasMap[s] || {})[mlbId] || {};
        
        const m7 = dateKeys.slice(-7).reduce((acc, k) => acc + (myMlbVendas[k]?.sales || 0), 0);
        const m15 = dateKeys.slice(-15).reduce((acc, k) => acc + (myMlbVendas[k]?.sales || 0), 0);
        const m30 = dateKeys.reduce((acc, k) => acc + (myMlbVendas[k]?.sales || 0), 0);

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

      // 5. Build Master populatedData
      return skus.map(s => {
        const skuKey = String(s.id || '').trim().toUpperCase();
        const myVendas = vendasMap[skuKey] || {};
        const myMlbs = mlbMap[skuKey] || [];

        const chartData = dateKeys.map(k => {
          const vd = myVendas[k] || { revenue: 0, sales: 0 };
          return {
             date: k.substring(8, 10) + '/' + k.substring(5, 7),
             revenue: typeof vd.revenue === 'number' ? vd.revenue : 0,
             sales: typeof vd.sales === 'number' ? vd.sales : 0,
          };
        });

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
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
