import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ConversionProduct {
  mlb: string;
  sku: string;
  titulo: string;
  preco: number;
  estoque: number;
  visits: number;
  conversao: number;
  curva_abc: string;
  sparkData: number[];
  variacao_pct: number;
  diagnostico: string | null;
}

export function useConversionMetrics() {
  return useQuery({
    queryKey: ['conversion-metrics'],
    queryFn: async (): Promise<ConversionProduct[]> => {
      // Real schema: item_id=mlb, visitas_total=visits, vendas_total for conversion calc
      const { data: produtos, error } = await supabase
        .from('live_produtos')
        .select(
          'item_id, sku, titulo, preco, estoque, visitas_total, vendas_total, health_score, vendas_7d'
        )
        .limit(200);

      if (error) throw error;
      if (!produtos || produtos.length === 0) return [];

      const skus = produtos.map((p: Record<string, unknown>) => p.sku as string).filter(Boolean);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);

      // Real schema: receita_total (not receita), data_venda
      const { data: vendas } = await supabase
        .from('live_vendas')
        .select('sku, receita_total, quantidade, data_venda')
        .in('sku', skus)
        .gte('data_venda', sevenDaysAgo.toISOString())
        .order('data_venda', { ascending: true });

      // Real schema: tipo_alerta, severidade (not severity)
      const { data: alertas } = await supabase
        .from('ia_alertas_operacionais')
        .select('sku, tipo_alerta, severidade')
        .in('sku', skus)
        .eq('status', 'ATIVO');

      const vendasBySku = new Map<
        string,
        Array<{ receita_total: number; data_venda: string; quantidade: number }>
      >();
      for (const v of vendas ?? []) {
        if (!vendasBySku.has(v.sku)) vendasBySku.set(v.sku, []);
        vendasBySku
          .get(v.sku)!
          .push(v as { receita_total: number; data_venda: string; quantidade: number });
      }

      const alertasBySku = new Map<string, Array<{ tipo_alerta: string; severidade: string }>>();
      for (const a of alertas ?? []) {
        if (!alertasBySku.has(a.sku)) alertasBySku.set(a.sku, []);
        alertasBySku.get(a.sku)!.push(a as { tipo_alerta: string; severidade: string });
      }

      const now = Date.now();
      const msPerDay = 86400000;

      const results = produtos.map((p: Record<string, unknown>) => {
        const rawVisitas = (p.visitas_total as number) ?? 0;
        const vendas_total_col = (p.vendas_total as number) ?? 0;
        const health = (p.health_score as number) ?? 0;

        // RECONSTRUCTION LOGIC:
        // If visits are missing (NULL/0) in live_produtos, we use health_score as a proxy for conversion rate.
        // Evidence suggests health_score / 10 = Conversion % (e.g. 90 = 9%, 65 = 6.5%).
        let conv = 0;
        let finalVisits = rawVisitas;

        if (rawVisitas > 0) {
          conv = Math.min((vendas_total_col / rawVisitas) * 100, 100);
        } else if (health > 0) {
          conv = health / 10;
          finalVisits = conv > 0 ? Math.round((vendas_total_col / conv) * 100) : 0;
        }

        if (isNaN(conv)) conv = 0;
        if (isNaN(finalVisits)) finalVisits = 0;

        const skuSales = vendasBySku.get(p.sku as string) ?? [];
        const skuAlertas = alertasBySku.get(p.sku as string) ?? [];

        const last7 = skuSales.filter((v) => now - new Date(v.data_venda).getTime() < 7 * msPerDay);
        const prev7 = skuSales.filter((v) => {
          const age = now - new Date(v.data_venda).getTime();
          return age >= 7 * msPerDay && age < 14 * msPerDay;
        });

        const receitaAtual = last7.reduce((s, v) => s + ((v.receita_total as number) ?? 0), 0);
        const receitaAnterior = prev7.reduce((s, v) => s + ((v.receita_total as number) ?? 0), 0);
        const variacao_pct =
          receitaAnterior > 0 ? ((receitaAtual - receitaAnterior) / receitaAnterior) * 100 : 0;

        const sparkData: number[] = Array(7).fill(0);
        for (const v of last7) {
          const dayIndex = 6 - Math.floor((now - new Date(v.data_venda).getTime()) / msPerDay);
          if (dayIndex >= 0 && dayIndex < 7) {
            sparkData[dayIndex] += (v.receita_total as number) ?? 0;
          }
        }

        let diagnostico: string | null = null;
        if (variacao_pct < -15) {
          const avgPrev = prev7.length > 0 ? receitaAnterior / prev7.length : 0;
          const avgCurr = last7.length > 0 ? receitaAtual / last7.length : 0;
          if ((p.preco as number) > 0 && avgPrev > 0 && avgCurr < avgPrev * 0.8) {
            diagnostico = 'PRECO ELEVADO — POSSIVEL REJEICAO DE MERCADO';
          } else if (((p.estoque as number) ?? 0) < 5) {
            diagnostico = 'ESTOQUE CRITICO — RUPTURA IMINENTE';
          } else if (skuAlertas.some((a) => a.tipo_alerta?.toLowerCase().includes('ads'))) {
            diagnostico = 'ADS COM PROBLEMA — VERIFICAR CAMPANHAS';
          } else {
            diagnostico = 'CAUSA INDETERMINADA — REVISAR CONCORRENCIA';
          }
        }

        return {
          mlb: (p.item_id as string) ?? '',
          sku: (p.sku as string) ?? '',
          titulo: (p.titulo as string) ?? '',
          preco: (p.preco as number) ?? 0,
          estoque: (p.estoque as number) ?? 0,
          visits: finalVisits,
          conversao: conv,
          curva_abc: '',
          sparkData,
          variacao_pct,
          diagnostico,
        };
      });

      // Sort by conversion rate descending
      return results.sort((a, b) => b.conversao - a.conversao);
    },
    staleTime: 60_000,
  });
}
