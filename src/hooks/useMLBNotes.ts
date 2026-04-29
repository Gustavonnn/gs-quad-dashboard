import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type TipoAcao = 'OBSERVACAO' | 'ALTERACAO_PRECO' | 'PAUSA_ADS' | 'REPOSICAO' | 'OUTRO';

export interface MLBNote {
  id: number;
  mlb: string;
  sku: string | null;
  nota: string;
  tipo_acao: TipoAcao;
  lembrete_data: string | null;
  criado_em: string;
  responsavel: string;
}

export interface AddNoteInput {
  mlb: string;
  sku?: string;
  nota: string;
  tipo_acao: TipoAcao;
  lembrete_data?: string | null;
}

export function useMLBNotes(mlb: string) {
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ['mlb-notes', mlb],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mlb_notes')
        .select('*')
        .eq('mlb', mlb)
        .order('criado_em', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as MLBNote[];
    },
    enabled: !!mlb,
    staleTime: 60_000,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (input: AddNoteInput) => {
      const { data, error } = await supabase
        .from('mlb_notes')
        .insert({
          mlb: input.mlb,
          sku: input.sku ?? null,
          nota: input.nota,
          tipo_acao: input.tipo_acao,
          lembrete_data: input.lembrete_data ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as MLBNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mlb-notes', mlb] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] });
      toast.success('Nota registrada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao registrar nota');
    },
  });

  return {
    notes: notesQuery.data ?? [],
    isLoading: notesQuery.isLoading,
    addNote: addNoteMutation.mutate,
    isAdding: addNoteMutation.isPending,
  };
}

export function useUpcomingReminders() {
  return useQuery({
    queryKey: ['upcoming-reminders'],
    queryFn: async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 86400000);
      const { data, error } = await supabase
        .from('mlb_notes')
        .select('*')
        .not('lembrete_data', 'is', null)
        .gte('lembrete_data', now.toISOString())
        .lte('lembrete_data', tomorrow.toISOString())
        .order('lembrete_data', { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as MLBNote[];
    },
    staleTime: 60_000,
  });
}
