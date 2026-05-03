import { useQuery } from '@tanstack/react-query';
import type { TerminalSkuItem, MlbItem, ChartDataPoint, CausaEfeito, SKUUserNote } from '../types/terminal';
import { supabase } from '../lib/supabase';

/**
 * GS-QUAD Terminal Data Hook v2.0
 * React Query powered data hydration for the Terminal DB.
 * Joins curva_abc, live_produtos, live_vendas, ml_insights, and ml_daily_forecast.
 * Builds N-Tree (SKU -> MLBs) with comparative overlay and forecast projections.
 */
export function useTerminalData() {
  return useQuery<TerminalSkuItem[]>({
    queryKey: ['terminal-data-v2'],
    queryFn: async () => {
      // 1. Fetch entire data graph + ML data
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 62); // Extended to 62d for comparison period
      const cutoffIso = cutoff.toISOString();

      const [curvaRes, produtosRes, vendasRes, mlInsightsRes, notesRes] = await Promise.all([
        supabase.from('curva_abc').select('*').order('receita_30d', { ascending: false }).limit(200),
        supabase.from('live_produtos').select('*').limit(2000),
        supabase.from('live_vendas')
          .select('*')
          .gte('data_venda', cutoffIso)
          .limit(50000),
        supabase.from('ml_insights').select('*').limit(500),
        supabase.from('sku_user_notes').select('*').order('created_at', { ascending: false }).limit(2000),
      ]);

      if (curvaRes.error) throw curvaRes.error;
      if (produtosRes.error) throw produtosRes.error;
      if (vendasRes.error) throw vendasRes.error;
      // ml_insights is optional — don't throw if it fails
      const mlInsights = mlInsightsRes.data || [];

      const skus = curvaRes.data || [];
      const produtos = produtosRes.data || [];
      const vendas = vendasRes.data || [];

      if (skus.length === 0) {
        return [];
      }

      // Build ML insights lookup
      const mlMap: Record<string, any> = {};
      mlInsights.forEach((m: any) => {
        if (m.sku) mlMap[m.sku] = m;
      });

      // Build user notes lookup by SKU
      const allNotes: SKUUserNote[] = notesRes.data || [];
      const notesMap: Record<string, SKUUserNote[]> = {};
      allNotes.forEach((n: SKUUserNote) => {
        const key = String(n.sku || '').trim().toUpperCase();
        if (!key) return;
        if (!notesMap[key]) notesMap[key] = [];
        notesMap[key].push(n);
      });

      // 2. Map sales by SKU and MLB for charts (current + previous period)
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

      // 3. Generate 30-day date keys + 30-day previous keys for comparison
      const dateKeys: string[] = [];
      const prevDateKeys: string[] = [];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayIso = yesterdayDate.toISOString().split('T')[0];

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateKeys.push(d.toISOString().split('T')[0]);
        
        const pd = new Date();
        pd.setDate(pd.getDate() - i - 30); // Previous period: shifted back 30 days
        prevDateKeys.push(pd.toISOString().split('T')[0]);
      }

      // 3b. Compute stockout dates per SKU: days with zero units after a period of activity
      const stockoutMap: Record<string, string[]> = {};
      skus.forEach((s: any) => {
        const skuKey = String(s.id || '').trim().toUpperCase();
        const myVendas = vendasMap[skuKey] || {};
        const skuDates = Object.keys(myVendas).sort();
        const stockouts: string[] = [];

        // Flag current day if rupture_risk > 0.8
        const ml = mlMap[skuKey] || {};
        if ((ml.rupture_risk || 0) > 0.8) {
          const today = new Date().toISOString().split('T')[0];
          stockouts.push(today);
        }

        // Detect zero-sales days after active days
        for (let i = 0; i < dateKeys.length; i++) {
          const d = dateKeys[i];
          const qty = myVendas[d]?.sales || 0;
          if (qty === 0 && i > 0) {
            // Check if SKU was active in previous days
            let wasActive = false;
            for (let j = i - 1; j >= Math.max(0, i - 14); j--) {
              if ((myVendas[dateKeys[j]]?.sales || 0) > 0) {
                wasActive = true;
                break;
              }
            }
            if (wasActive) stockouts.push(d);
          }
        }

        if (stockouts.length > 0) stockoutMap[skuKey] = stockouts;
      });


      // 4. Generate forecast date keys (next 7 days)
      const forecastDateKeys: string[] = [];
      for (let i = 1; i <= 7; i++) {
        const fd = new Date();
        fd.setDate(fd.getDate() + i);
        forecastDateKeys.push(fd.toISOString().split('T')[0]);
      }

      // 5. Map Products (MLBs) to SKUs
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
          chartData: dateKeys.map((k, idx) => {
            const vd = myMlbVendas[k] || { revenue: 0, sales: 0 };
            const prevKey = prevDateKeys[idx];
            const prevVd = myMlbVendas[prevKey] || { revenue: 0, sales: 0 };
            return {
               date: k.substring(8, 10) + '/' + k.substring(5, 7),
               revenue: vd.revenue,
               sales: vd.sales,
               prev_sales: prevVd.sales,
               prev_revenue: prevVd.revenue,
            };
          }),
        });
      });

      // 6. Build Master populatedData with ML enrichment
      return skus.map(s => {
        const skuKey = String(s.id || '').trim().toUpperCase();
        const myVendas = vendasMap[skuKey] || {};
        const myMlbs = mlbMap[skuKey] || [];
        const ml = mlMap[skuKey] || {};

        // Build chart with comparison overlay + forecast extension
        const chartData: ChartDataPoint[] = dateKeys.map((k, idx) => {
          const vd = myVendas[k] || { revenue: 0, sales: 0 };
          const prevKey = prevDateKeys[idx];
          const prevVd = myVendas[prevKey] || { revenue: 0, sales: 0 };
          return {
             date: k.substring(8, 10) + '/' + k.substring(5, 7),
             revenue: typeof vd.revenue === 'number' ? vd.revenue : 0,
             sales: typeof vd.sales === 'number' ? vd.sales : 0,
             prev_sales: prevVd.sales || 0,
             prev_revenue: prevVd.revenue || 0,
          };
        });

        // Append forecast points (next 7 days)
        const forecast7d = ml.forecast_7d || 0;
        const dailyAvg = forecast7d / 7;
        forecastDateKeys.forEach(fk => {
          const dayOfWeek = new Date(fk).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const factor = isWeekend ? 0.7 : 1.0;
          chartData.push({
            date: fk.substring(8, 10) + '/' + fk.substring(5, 7),
            revenue: 0,
            sales: 0,
            forecast_sales: Math.round(dailyAvg * factor * 10) / 10,
            forecast_revenue: 0,
            seasonality_factor: factor,
            confidence: ml.forecast_confidence || 0,
          });
        });

        const totalSalesUnits = myMlbs.reduce((acc, m) => acc + m.sales_30d, 0) || Math.floor((s.receita_30d || 0) / 100);
        const s7 = myMlbs.reduce((acc, m) => acc + m.sales_7d, 0);
        const s15 = myMlbs.reduce((acc, m) => acc + m.sales_15d, 0);
        const s30 = totalSalesUnits;
        const sYest = myMlbs.reduce((acc, m) => acc + m.sales_yesterday, 0);

        // PoP calculation from chart data
        const curr7Sales = dateKeys.slice(-7).reduce((acc, k) => acc + (myVendas[k]?.sales || 0), 0);
        const prev7Sales = dateKeys.slice(0, 7).map((_, i) => prevDateKeys[prevDateKeys.length - 7 + i])
          .reduce((acc, k) => acc + (myVendas[k]?.sales || 0), 0) || 1;
        const curr7Rev = dateKeys.slice(-7).reduce((acc, k) => acc + (myVendas[k]?.revenue || 0), 0);
        const prev7Rev = dateKeys.slice(0, 7).map((_, i) => prevDateKeys[prevDateKeys.length - 7 + i])
          .reduce((acc, k) => acc + (myVendas[k]?.revenue || 0), 0) || 1;

        // Build causa_efeito from ML data  
        let causaEfeito: CausaEfeito | undefined;
        if (ml.anomaly_type && ml.anomaly_severity) {
          const delta = curr7Sales > 0 && prev7Sales > 0
            ? ((curr7Sales - prev7Sales) / prev7Sales) * 100
            : 0;
          causaEfeito = {
            causa_primaria: ml.anomaly_type === 'queda_brusca' ? 'PRECO_ALTO'
              : ml.anomaly_type === 'inatividade' ? 'RUPTURA'
              : ml.anomaly_type === 'spike_vendas' ? 'SAZONALIDADE'
              : 'CONCORRENCIA',
            severidade: ml.anomaly_severity as 'CRITICO' | 'ALTO' | 'MEDIO',
            vendas_curr_7d: curr7Sales,
            vendas_prev_7d: prev7Sales,
            delta_vendas_pct: Math.round(delta * 10) / 10,
            evidencia: ml.price_recommendation || `Anomalia detectada: ${ml.anomaly_type}`,
            recomendacao: ml.price_recommendation || 'Monitorar evolução nos próximos 7 dias.',
          };
        }

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
          chartData,
          // PoP Deltas
          sales_delta_7d_pct: prev7Sales > 0 ? Math.round(((curr7Sales - prev7Sales) / prev7Sales) * 1000) / 10 : 0,
          rev_delta_7d_pct: prev7Rev > 0 ? Math.round(((curr7Rev - prev7Rev) / prev7Rev) * 1000) / 10 : 0,
          // ML enrichment
          forecast_7d: ml.forecast_7d || undefined,
          forecast_confidence: ml.forecast_confidence || undefined,
          rupture_risk: ml.rupture_risk || undefined,
          causa_efeito: causaEfeito,
          // User annotations & stockout tracking
          notes: notesMap[skuKey] || [],
          stockoutDates: stockoutMap[skuKey] || [],
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

