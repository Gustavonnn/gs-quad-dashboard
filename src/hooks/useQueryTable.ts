import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

export interface UseQueryTableOptions<T> {
  table: string
  schema: z.ZodType<T>
  select?: string
  filters?: Record<string, string | number | boolean | string[]>
  orderBy?: { column: string; ascending?: boolean }
  range?: { from: number; to: number }
  count?: 'exact' | 'planned' | 'estimated'
  enabled?: boolean
}

export interface UseQueryTableResult<T> {
  data: T[]
  count: number | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useQueryTable<T>({
  table,
  schema,
  select = '*',
  filters,
  orderBy,
  range,
  count = 'exact',
  enabled = true,
}: UseQueryTableOptions<T>): UseQueryTableResult<T> {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['table', table, select, filters, orderBy, range],
    queryFn: async () => {
      let query = supabase.from(table).select(select, { count })

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'boolean') {
            query = query.eq(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false })
      }

      if (range) {
        query = query.range(range.from, range.to)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Validate with Zod if schema provided
      if (schema) {
        const results = (data || []).map((row) => schema.parse(row))
        return results
      }

      return data as T[]
    },
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  })

  return {
    data: query.data ?? [],
    count: query.data?.length ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: async () => { await query.refetch() },
  }
}

// ─── Specialized hooks ─────────────────────────────────────────

export function useLiveMetrics() {
  return useQuery({
    queryKey: ['live-metrics'],
    queryFn: async () => {
      const { data: lastDateRow } = await supabase
        .from('live_vendas')
        .select('data_venda')
        .order('data_venda', { ascending: false })
        .limit(1)

      const lastDate = lastDateRow?.[0]?.data_venda?.split('T')[0]

      const [{ data: vendas, count: vendasCount }, { count: alertasAtivos }, { count: totalProdutos }] = await Promise.all([
        lastDate
          ? supabase.from('live_vendas').select('receita_total').gte('data_venda', lastDate)
          : Promise.resolve({ data: [], count: 0 }),
        supabase.from('ia_alertas').select('*', { count: 'exact', head: true }).eq('resolvido', false),
        supabase.from('live_produtos').select('*', { count: 'exact', head: true }),
      ])

      const totalVendas = (vendas as any[])?.reduce(
        (s: number, v: any) => s + parseFloat(v.receita_total || '0'),
        0
      ) ?? 0

      return {
        totalVendas,
        alertasAtivos: alertasAtivos ?? 0,
        totalProdutos: totalProdutos ?? 0,
      }
    },
    staleTime: 30 * 1000,
    retry: 1,
  })
}
