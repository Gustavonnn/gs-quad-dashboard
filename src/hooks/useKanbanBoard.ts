import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRealtimeTable } from './useRealtimeTable'
import { kanbanCardSchema, type KanbanCard, type KanbanStatus } from '@/lib/schemas'

export type { KanbanCard, KanbanStatus }

export const KANBAN_COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'var(--color-gs-muted)' },
  { id: 'processing', label: 'Processing', color: 'var(--color-gs-yellow)' },
  { id: 'drafting', label: 'Drafting', color: 'var(--color-gs-blue)' },
  { id: 'pricing', label: 'Pricing', color: 'var(--color-gs-cyan)' },
  { id: 'review', label: 'Review', color: 'var(--color-gs-orange)' },
  { id: 'live', label: 'Live', color: 'var(--color-gs-green)' },
]

// ─── Fetch all cards ───────────────────────────────────────
export function useKanbanCards() {
  // Realtime disabled — data updated once per day via Excel
  useRealtimeTable({ table: 'ia_kanban_cards', event: '*', enabled: false })

  return useQuery<KanbanCard[]>({
    queryKey: ['kanban-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ia_kanban_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map((row) => kanbanCardSchema.parse(row))
    },
    staleTime: 30 * 1000,
  })
}

// ─── Create card ────────────────────────────────────────────
export function useCreateKanbanCard() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: { sku: string; type: 'hybrid' | 'manual'; categoria?: string }) => {
      const { data, error } = await supabase
        .from('ia_kanban_cards')
        .insert({
          sku: input.sku,
          type: input.type,
          categoria: input.categoria || null,
          status: 'backlog',
          created_by: 'Admin',
        })
        .select()
        .single()

      if (error) throw error
      return kanbanCardSchema.parse(data)
    },
    onSuccess: () => {
      toast.success('Card criado!')
      qc.invalidateQueries({ queryKey: ['kanban-cards'] })
    },
    onError: (err: any) => {
      toast.error(`Erro: ${err.message}`)
    },
  })
}

// ─── Update card status (drag-drop) ────────────────────────
export function useUpdateKanbanCardStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, status }: { cardId: string; status: KanbanStatus }) => {
      const updates: Record<string, any> = { status, updated_at: new Date().toISOString() }
      if (status === 'processing') {
        updates.processed_at = new Date().toISOString()
      }
      if (status !== 'processing') {
        updates.trigger_analysis = false
      }

      const { error } = await supabase
        .from('ia_kanban_cards')
        .update(updates)
        .eq('id', cardId)

      if (error) throw error
    },
    onMutate: async ({ cardId, status }) => {
      await qc.cancelQueries({ queryKey: ['kanban-cards'] })
      const previous = qc.getQueryData<KanbanCard[]>(['kanban-cards'])

      qc.setQueryData<KanbanCard[]>(['kanban-cards'], (old) =>
        old?.map((c) => (c.id === cardId ? { ...c, status } : c))
      )

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['kanban-cards'], ctx.previous)
      }
      toast.error('Erro ao mover card')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['kanban-cards'] })
    },
  })
}

// ─── Trigger AI analysis ────────────────────────────────────
export function useTriggerKanbanAnalysis() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('ia_kanban_cards')
        .update({
          trigger_analysis: true,
          analysis_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', cardId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Análise acionada!')
      qc.invalidateQueries({ queryKey: ['kanban-cards'] })
    },
    onError: (err: any) => {
      toast.error(`Erro: ${err.message}`)
    },
  })
}

// ─── Update briefing_data ───────────────────────────────────
export function useUpdateKanbanBriefing() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, briefingData }: { cardId: string; briefingData: any }) => {
      const { error } = await supabase
        .from('ia_kanban_cards')
        .update({
          briefing_data: briefingData,
          updated_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        })
        .eq('id', cardId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Briefing atualizado!')
      qc.invalidateQueries({ queryKey: ['kanban-cards'] })
    },
    onError: (err: any) => {
      toast.error(`Erro: ${err.message}`)
    },
  })
}

// ─── Update manual_data ────────────────────────────────────
export function useUpdateKanbanManual() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, manualData }: { cardId: string; manualData: any }) => {
      const { error } = await supabase
        .from('ia_kanban_cards')
        .update({ manual_data: manualData, updated_at: new Date().toISOString() })
        .eq('id', cardId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Dados manuais salvos!')
      qc.invalidateQueries({ queryKey: ['kanban-cards'] })
    },
    onError: (err: any) => {
      toast.error(`Erro: ${err.message}`)
    },
  })
}

// ─── Delete card ───────────────────────────────────────────
export function useDeleteKanbanCard() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.from('ia_kanban_cards').delete().eq('id', cardId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Card removido')
      qc.invalidateQueries({ queryKey: ['kanban-cards'] })
    },
    onError: (err: any) => {
      toast.error(`Erro: ${err.message}`)
    },
  })
}

// ─── Reset card to backlog ─────────────────────────────────
export function useResetKanbanCard() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('ia_kanban_cards')
        .update({
          status: 'backlog',
          trigger_analysis: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cardId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Card resetado para backlog')
      qc.invalidateQueries({ queryKey: ['kanban-cards'] })
    },
    onError: (err: any) => {
      toast.error(`Erro: ${err.message}`)
    },
  })
}
