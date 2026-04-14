import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CurvaABCItem, IAAlerta, IAGrowthPlan, MLPriceTimeline, StockAlert } from '../types'

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

// ─── Stock Alerts ──────────────────────────────────────────────
export function useStockAlerts() {
  const [data, setData] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch curva (SKU identifiers and classifications)
      // 2. Fetch all products (to calculate global stock)
      const [curvaRes, produtosRes] = await Promise.all([
        supabase.from('curva_abc').select('id, titulo, curva_abc').limit(200),
        supabase.from('live_produtos').select('sku, estoque').limit(2000)
      ])

      const skus = curvaRes.data || []
      const ads = produtosRes.data || []

      // 3. Aggregate stock per SKU
      const stockMap: Record<string, number> = {}
      ads.forEach(ad => {
        const sku = String(ad.sku || '').trim()
        if (!sku) return
        stockMap[sku] = (stockMap[sku] || 0) + (ad.estoque || 0)
      })

      // 4. Map back to StockAlerts where total stock is 0
      const alerts: StockAlert[] = skus
        .filter(s => {
          const skuKey = String(s.id || '').trim()
          return stockMap[skuKey] === 0
        })
        .map(s => ({
          sku: s.id,
          titulo: s.titulo || 'Produto sem título',
          estoque: 0,
          curva_abc: s.curva_abc || 'C'
        }))

      setData(alerts)
    } catch (err) {
      console.error('[useStockAlerts] error:', err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, refetch: fetch }
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



// ─── Kanban Cards ─────────────────────────────────────────────────
export function useKanbanCards() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('ia_kanban_cards')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && rows) {
      setData(rows)
    } else {
      console.error('[useKanbanCards] error:', error)
      setData([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, refetch: fetch }
}

export async function createKanbanCard(card: {
  sku: string
  type: 'hybrid' | 'manual'
  categoria?: string
  created_by?: string
}) {
  const { data, error } = await supabase
    .from('ia_kanban_cards')
    .insert({
      sku: card.sku,
      type: card.type,
      categoria: card.categoria || null,
      status: 'backlog',
      created_by: card.created_by || 'Admin',
    })
    .select()
    .single()

  return { data, error }
}

export async function updateKanbanCardStatus(cardId: string, status: string) {
  const { error } = await supabase
    .from('ia_kanban_cards')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'processing' ? { processed_at: new Date().toISOString() } : {}),
    })
    .eq('id', cardId)

  return { error }
}

export async function updateKanbanCardBriefing(cardId: string, briefingData: any) {
  const { error } = await supabase
    .from('ia_kanban_cards')
    .update({
      briefing_data: briefingData,
      updated_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    })
    .eq('id', cardId)

  return { error }
}

export async function triggerKanbanAnalysis(cardId: string) {
  const { error } = await supabase
    .from('ia_kanban_cards')
    .update({
      trigger_analysis: true,
      analysis_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)

  return { error }
}

export async function updateKanbanCardManual(cardId: string, manualData: any) {
  const { error } = await supabase
    .from('ia_kanban_cards')
    .update({
      manual_data: manualData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)

  return { error }
}

export async function deleteKanbanCard(cardId: string) {
  const { error } = await supabase
    .from('ia_kanban_cards')
    .delete()
    .eq('id', cardId)

  return { error }
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

// ─── Realtime Kanban Cards ───────────────────────────────────────
export function useRealtimeKanbanCards(onChange: (payload: any) => void) {
  useEffect(() => {
    const channelRef = supabase
      .channel('kanban-cards-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ia_kanban_cards' },
        onChange
      )
      .subscribe()

    return () => { supabase.removeChannel(channelRef) }
  }, [onChange])
}