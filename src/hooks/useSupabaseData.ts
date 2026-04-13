import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Venda, CurvaABCItem, IAAlerta, IAGrowthPlan, MLPriceTimeline } from '../types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ─── Live Metrics ───────────────────────────────────────────────
export function useLiveMetrics() {
  const [metrics, setMetrics] = useState({ totalVendas: 0, alertasAtivos: 0, totalProdutos: 0, sparkData: [] as number[] })
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      // Busca a última data com vendas registradas (não assume 'hoje')
      const { data: lastDateRow } = await supabase
        .from('live_vendas')
        .select('data_venda')
        .order('data_venda', { ascending: false })
        .limit(1)

      const lastDate = lastDateRow?.[0]?.data_venda?.split('T')[0]

      const [{ data: vendas }, { count: alertasAtivos }, { count: totalProdutos }] = await Promise.all([
        lastDate
          ? supabase.from('live_vendas').select('receita_total').gte('data_venda', lastDate)
          : Promise.resolve({ data: [] }),
        supabase.from('ia_alertas').select('*', { count: 'exact', head: true }).eq('resolvido', false),
        supabase.from('live_produtos').select('*', { count: 'exact', head: true }),
      ])

      const totalVendas = (vendas as any[])?.reduce((s: number, v: any) => s + parseFloat(v.receita_total || '0'), 0) ?? 0

      setMetrics({
        totalVendas,
        alertasAtivos: alertasAtivos ?? 0,
        totalProdutos: totalProdutos ?? 0,
        sparkData: [totalVendas * 0.8, totalVendas * 0.9, totalVendas * 0.85, totalVendas * 0.95, totalVendas, totalVendas * 1.05, totalVendas * 1.1],
      })
    } catch {
      setMetrics({ totalVendas: 0, alertasAtivos: 0, totalProdutos: 0, sparkData: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  return { metrics, loading, refetch: fetchMetrics }
}

// ─── Curva ABC ─────────────────────────────────────────────────
export function useCurvaABC() {
  const [data, setData] = useState<CurvaABCItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('curva_abc')
      .select('*')
      .order('receita_30d', { ascending: false })
      .limit(500)

    if (!error && rows) {
      setData(rows as CurvaABCItem[])
    } else {
      setData([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, refetch: fetch }
}

// ─── IA Alertas ────────────────────────────────────────────────
export function useIAAlertas() {
  const [data, setData] = useState<IAAlerta[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('ia_alertas')
      .select('*')
      .eq('resolvido', false)
      .order('data_registro', { ascending: false })
      .limit(50)

    if (!error && rows) {
      setData(rows as IAAlerta[])
    } else {
      setData([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, refetch: fetch }
}

export async function resolveAlerta(alertId: string) {
  const { error } = await supabase
    .from('ia_alertas')
    .update({ resolvido: true, status: 'RESOLVIDO', data_resolucao: new Date().toISOString() })
    .eq('id', alertId)
  return !error
}

// ─── Growth Plans ───────────────────────────────────────────────
export function useGrowthPlans() {
  const [data, setData] = useState<IAGrowthPlan[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('ia_growth_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8)

    if (!error && rows) {
      setData(rows as IAGrowthPlan[])
    } else {
      setData([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, refetch: fetch }
}

// ─── ML Insights ────────────────────────────────────────────────
export function useMLInsights() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('ml_insights')
      .select('*')
      .order('rupture_risk', { ascending: false })
      .limit(200)

    if (!error && rows) {
      setData(rows)
    } else {
      setData([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, refetch: fetch }
}

// ─── Price Timeline ─────────────────────────────────────────────
export function usePriceTimeline() {
  const [data, setData] = useState<MLPriceTimeline[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('ml_price_timeline')
      .select('*')
      .order('evento_data', { ascending: false })
      .limit(100)

    if (!error && rows) {
      setData(rows as MLPriceTimeline[])
    } else {
      setData([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, refetch: fetch }
}



// ─── Realtime Subscription ───────────────────────────────────────
export function useRealtime(channel: string, onInsert: (payload: any) => void) {
  useEffect(() => {
    const channelRef = supabase.channel(channel)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_vendas' }, onInsert)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ia_growth_plans' }, onInsert)
      .subscribe()

    return () => { supabase.removeChannel(channelRef) }
  }, [channel, onInsert])
}