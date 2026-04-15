import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

export interface UseMutationOptions<TInput, TOutput> {
  table: string
  mutationFn?: (
    supabase: SupabaseClient,
    input: TInput
  ) => Promise<{ data: TOutput | null; error: any }>
  invalidates?: string[]
  optimisticUpdate?: {
    queryKey: string[]
    updateFn: (oldData: any, input: TInput) => any
    rollbackFn?: (oldData: any, input: TInput) => any
  }
  onSuccessMessage?: string
  onErrorMessage?: string
}

export function useSupabaseMutation<TInput, TOutput = any>({
  table,
  mutationFn,
  invalidates = [],
  optimisticUpdate,
  onSuccessMessage,
  onErrorMessage,
}: UseMutationOptions<TInput, TOutput>) {
  const queryClient = useQueryClient()

  const defaultMutationFn = async (
    supabase: SupabaseClient,
    input: TInput
  ) => {
    // Default: INSERT if input has no id, UPDATE if it has id
    const data = input as any
    if (data.id) {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', data.id)
        .select()
        .single()
      return { data: result, error }
    } else {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single()
      return { data: result, error }
    }
  }

  return useMutation({
    mutationFn: mutationFn
      ? (input: TInput) => mutationFn(supabase, input)
      : (input: TInput) => defaultMutationFn(supabase, input),

    onMutate: async (input) => {
      if (!optimisticUpdate) return

      await queryClient.cancelQueries({ queryKey: optimisticUpdate.queryKey })

      const previousData = queryClient.getQueryData(optimisticUpdate.queryKey)

      queryClient.setQueryData(optimisticUpdate.queryKey, (old: any) =>
        optimisticUpdate.updateFn(old, input)
      )

      return { previousData }
    },

    onError: (err, input, context) => {
      if (optimisticUpdate && context?.previousData !== undefined) {
        queryClient.setQueryData(optimisticUpdate.queryKey, context.previousData)
      }

      const message = onErrorMessage ?? err?.message ?? 'Erro ao salvar'
      toast.error(message)
    },

    onSuccess: (data, input) => {
      if (onSuccessMessage) {
        toast.success(onSuccessMessage)
      }

      // Invalidate queries
      const toInvalidate = [...invalidates, ...(optimisticUpdate?.queryKey ?? [])]
      toInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
      })
    },

    onSettled: () => {
      if (optimisticUpdate) {
        queryClient.invalidateQueries({ queryKey: optimisticUpdate.queryKey })
      }
    },
  })
}

// ─── Pre-built mutations ──────────────────────────────────────

export function useResolveAlerta() {
  return useSupabaseMutation({
    table: 'ia_alertas',
    mutationFn: async (supabase, alertId: string) => {
      return supabase
        .from('ia_alertas')
        .update({
          resolvido: true,
          status: 'RESOLVIDO',
          data_resolucao: new Date().toISOString(),
        })
        .eq('id', alertId)
    },
    invalidates: [['table', 'ia_alertas']],
    onSuccessMessage: 'Alerta resolvido',
    onErrorMessage: 'Erro ao resolver alerta',
  })
}

export function useUpdateAlertaStatus() {
  return useSupabaseMutation({
    table: 'ia_alertas',
    mutationFn: async (
      supabase,
      { id, status }: { id: string; status: string }
    ) => {
      const updates: Record<string, any> = { status }
      if (status === 'RESOLVIDO' || status === 'IGNORADO') {
        updates.resolvido = true
        updates.data_resolucao = new Date().toISOString()
      }
      return supabase.from('ia_alertas').update(updates).eq('id', id)
    },
    invalidates: [['table', 'ia_alertas']],
    onSuccessMessage: 'Status atualizado',
    onErrorMessage: 'Erro ao atualizar status',
  })
}

export function useUpdateGrowthPlanStatus() {
  return useSupabaseMutation({
    table: 'ia_growth_plans',
    mutationFn: async (
      supabase,
      { id, status_intervencao }: { id: string; status_intervencao: string }
    ) => {
      return supabase
        .from('ia_growth_plans')
        .update({ status_intervencao })
        .eq('id', id)
    },
    invalidates: [['table', 'ia_growth_plans']],
    onSuccessMessage: 'Plano atualizado',
    onErrorMessage: 'Erro ao atualizar plano',
  })
}
