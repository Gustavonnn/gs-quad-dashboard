/**
 * GS-QUAD Data Hooks — React Query powered
 * All hooks use React Query for caching, refetch, and background sync.
 * Realtime subscriptions auto-invalidate React Query cache.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  iaAlertaSchema,
  curvaABCSchema,
  iaGrowthPlanSchema,
  mlPriceTimelineSchema,
  mlInsightSchema,
} from '@/lib/schemas';
import type { IAAlerta, IAGrowthPlan, MLPriceTimeline, MLInsight, CurvaABC } from '@/lib/schemas';
import { useRealtimeTable } from './useRealtimeTable';

// ─── Live Metrics ─────────────────────────────────────────────

export interface LiveMetricsData {
  totalVendas: number;
  alertasAtivos: number;
  totalProdutos: number;
  sparkData: number[];
}

export function useLiveMetrics() {
  return useQuery<LiveMetricsData>({
    queryKey: ['live-metrics'],
    queryFn: async () => {
      const { data: lastDateRow } = await supabase
        .from('live_vendas')
        .select('data_venda')
        .order('data_venda', { ascending: false })
        .limit(1);

      const lastDate = lastDateRow?.[0]?.data_venda?.split('T')[0];

      const [{ data: vendas }, { count: alertasAtivos }, { count: totalProdutos }] =
        await Promise.all([
          lastDate
            ? supabase.from('live_vendas').select('receita_total').gte('data_venda', lastDate)
            : Promise.resolve({ data: [] }),
          supabase
            .from('ia_alertas')
            .select('*', { count: 'exact', head: true })
            .eq('resolvido', false),
          supabase.from('live_produtos').select('*', { count: 'exact', head: true }),
        ]);

      const totalVendas =
        (vendas as Record<string, unknown>[])?.reduce(
          (s: number, v: Record<string, unknown>) =>
            s + parseFloat((v.receita_total as string) || '0'),
          0
        ) ?? 0;

      return {
        totalVendas,
        alertasAtivos: alertasAtivos ?? 0,
        totalProdutos: totalProdutos ?? 0,
        sparkData: [
          totalVendas * 0.8,
          totalVendas * 0.9,
          totalVendas * 0.85,
          totalVendas * 0.95,
          totalVendas,
          totalVendas * 1.05,
          totalVendas * 1.1,
        ],
      };
    },
    staleTime: 30 * 1000,
    retry: 1,
  });
}

// ─── Curva ABC ────────────────────────────────────────────────

export function useCurvaABC(limit = 500) {
  return useQuery<CurvaABC[]>({
    queryKey: ['curva-abc', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curva_abc')
        .select('*')
        .order('receita_30d', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((row) => {
        const result = curvaABCSchema.safeParse(row);
        if (!result.success) {
          console.error(
            `[Schema Error] curva_abc data mismatch for ID ${row.id}:`,
            result.error.format()
          );
          return row as unknown as CurvaABC;
        }
        return result.data;
      });
    },
    staleTime: 60 * 1000,
  });
}

// ─── IA Alertas (with Realtime) ────────────────────────────────

export function useIAAlertas(limit = 50) {
  // Realtime disabled — data updated once per day via Excel
  useRealtimeTable({
    table: 'ia_alertas',
    event: '*',
    enabled: false,
  });

  return useQuery<IAAlerta[]>({
    queryKey: ['ia-alertas', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ia_alertas')
        .select('*')
        .eq('resolvido', false)
        .order('data_registro', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((row) => {
        const result = iaAlertaSchema.safeParse(row);
        if (!result.success) {
          console.error(
            `[Schema Error] ia_alertas data mismatch for ID ${row.id}:`,
            result.error.format()
          );
          return row as unknown as IAAlerta;
        }
        return result.data;
      });
    },
    staleTime: 30 * 1000,
  });
}

// ─── Update Alerta Status ──────────────────────────────────────

export function useUpdateAlertaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'RESOLVIDO' || status === 'IGNORADO') {
        updates.resolvido = true;
        updates.data_resolucao = new Date().toISOString();
      }

      const { error } = await supabase.from('ia_alertas').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado');
      queryClient.invalidateQueries({ queryKey: ['ia-alertas'] });
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar: ${err.message}`);
    },
  });
}

// ─── Stock Alerts ──────────────────────────────────────────────

export interface StockAlert {
  sku: string;
  titulo: string;
  estoque: number;
  curva_abc: string;
}

export function useStockAlerts() {
  return useQuery<StockAlert[]>({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const [curvaRes, produtosRes] = await Promise.all([
        supabase.from('curva_abc').select('id, titulo, curva_abc').limit(200),
        supabase.from('live_produtos').select('sku, estoque').limit(2000),
      ]);

      const skus = curvaRes.data || [];
      const ads = produtosRes.data || [];

      const stockMap: Record<string, number> = {};
      ads.forEach((ad) => {
        const sku = String(ad.sku || '').trim();
        if (!sku) return;
        stockMap[sku] = (stockMap[sku] || 0) + (ad.estoque || 0);
      });

      return skus
        .filter((s) => {
          const skuKey = String(s.id || '').trim();
          return stockMap[skuKey] === 0;
        })
        .map((s) => ({
          sku: s.id as string,
          titulo: (s.titulo as string) || 'Produto sem título',
          estoque: 0,
          curva_abc: (s.curva_abc as string) || 'C',
        }));
    },
    staleTime: 60 * 1000,
  });
}

// ─── Growth Plans (with Realtime) ──────────────────────────────

export function useGrowthPlans(limit = 8) {
  // Realtime disabled — data updated once per day via Excel
  useRealtimeTable({
    table: 'ia_growth_plans',
    event: '*',
    enabled: false,
  });

  return useQuery<IAGrowthPlan[]>({
    queryKey: ['growth-plans', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ia_growth_plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((row) => {
        const result = iaGrowthPlanSchema.safeParse(row);
        if (!result.success) {
          console.error(
            `[Schema Error] ia_growth_plans data mismatch for ID ${row.id}:`,
            result.error.format()
          );
          return row as unknown as IAGrowthPlan;
        }
        return result.data;
      });
    },
    staleTime: 30 * 1000,
  });
}

export function useUpdateGrowthPlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status_intervencao }: { id: string; status_intervencao: string }) => {
      const { error } = await supabase
        .from('ia_growth_plans')
        .update({ status_intervencao })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Plano atualizado');
      queryClient.invalidateQueries({ queryKey: ['growth-plans'] });
    },
    onError: (err) => {
      toast.error(`Erro: ${err.message}`);
    },
  });
}

// ─── ML Insights ────────────────────────────────────────────────

export function useMLInsights(limit = 200) {
  return useQuery<MLInsight[]>({
    queryKey: ['ml-insights', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ml_insights')
        .select('*')
        .order('rupture_risk', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((row) => {
        const result = mlInsightSchema.safeParse(row);
        if (!result.success) {
          console.error(
            `[Schema Error] ml_insights data mismatch for SKU ${row.sku}:`,
            result.error.format()
          );
          return row as unknown as MLInsight;
        }
        return result.data;
      });
    },
    staleTime: 60 * 1000,
  });
}

// ─── Price Timeline ──────────────────────────────────────────────

export function usePriceTimeline(limit = 100) {
  return useQuery<MLPriceTimeline[]>({
    queryKey: ['price-timeline', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ml_price_timeline')
        .select('*')
        .order('evento_data', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((row) => {
        const result = mlPriceTimelineSchema.safeParse(row);
        if (!result.success) {
          console.error(
            `[Schema Error] ml_price_timeline data mismatch for ID ${row.id}:`,
            result.error.format()
          );
          return row as unknown as MLPriceTimeline;
        }
        return result.data;
      });
    },
    staleTime: 60 * 1000,
  });
}

// ─── Paginated Alertas (server-side) ───────────────────────────

export interface PaginatedAlertasOptions {
  page: number;
  pageSize: number;
  severity?: string;
  status?: string;
  search?: string;
}

export function usePaginatedAlertas({
  page,
  pageSize,
  severity,
  status,
  search,
}: PaginatedAlertasOptions) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  return useQuery<IAAlerta[]>({
    queryKey: ['ia-alertas-paginated', page, pageSize, severity, status, search],
    queryFn: async () => {
      let query = supabase
        .from('ia_alertas')
        .select('*', { count: 'exact' })
        .eq('resolvido', false)
        .range(from, to);

      if (severity) query = query.eq('severity', severity);
      if (status) query = query.eq('status', status);
      if (search) query = query.ilike('sku', `%${search}%`);

      query = query.order('data_registro', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row) => iaAlertaSchema.parse(row));
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
