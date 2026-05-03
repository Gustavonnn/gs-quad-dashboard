import { useState } from 'react';
import { X, BookMarked, AlertCircle, TrendingDown, PauseCircle, Package, MoreHorizontal, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SKUUserNote, NotaTipoAcao } from '../types/terminal';

const TIPO_OPTIONS: { value: NotaTipoAcao; label: string; color: string; Icon: React.ElementType }[] = [
  { value: 'OBSERVACAO',      label: 'Observação',      color: 'var(--color-gs-blue)',  Icon: AlertCircle },
  { value: 'ALTERACAO_PRECO', label: 'Alteração Preço', color: 'var(--color-gs-yellow)', Icon: TrendingDown },
  { value: 'PAUSA_ADS',       label: 'Pausa Ads',      color: 'var(--color-gs-red)',    Icon: PauseCircle },
  { value: 'REPOSICAO',       label: 'Reposição',       color: 'var(--color-gs-green)',  Icon: Package },
  { value: 'OUTRO',           label: 'Outro',           color: 'var(--color-gs-muted)', Icon: MoreHorizontal },
];

function getTipoOption(tipo: string) {
  return TIPO_OPTIONS.find(o => o.value === tipo) ?? TIPO_OPTIONS[4];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

interface SKUNotesPanelProps {
  sku: string;
  notes: SKUUserNote[];
  open: boolean;
  onClose: () => void;
}

export function SKUNotesPanel({ sku, notes, open, onClose }: SKUNotesPanelProps) {
  const qc = useQueryClient();
  const [nota, setNota] = useState('');
  const [tipoAcao, setTipoAcao] = useState<NotaTipoAcao>('OBSERVACAO');

  const addNote = useMutation({
    mutationFn: async (vals: { nota: string; tipo_acao: NotaTipoAcao }) => {
      const { data, error } = await supabase
        .from('sku_user_notes')
        .insert({ sku, nota: vals.nota, tipo_acao: vals.tipo_acao, resolvido: false, created_by: 'USER' })
        .select()
        .single();
      if (error) throw error;
      return data as SKUUserNote;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terminal-data-v2'] });
      setNota('');
      setTipoAcao('OBSERVACAO');
    },
  });

  const toggleResolved = useMutation({
    mutationFn: async ({ id, resolvido }: { id: number; resolvido: boolean }) => {
      const { error } = await supabase
        .from('sku_user_notes')
        .update({ resolvido })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['terminal-data-v2'] }),
  });

  const handleSubmit = () => {
    if (!nota.trim()) return;
    addNote.mutate({ nota: nota.trim(), tipo_acao: tipoAcao });
  };

  const unresolved = notes.filter(n => !n.resolvido);
  const resolved = notes.filter(n => n.resolvido);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 z-50 flex flex-col h-full"
        style={{
          width: '420px', maxWidth: '90vw',
          background: 'var(--color-gs-panel)',
          borderLeft: '1px solid var(--color-gs-border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{ height: '56px', borderBottom: '1px solid var(--color-gs-border)' }}
        >
          <div className="flex items-center gap-2">
            <BookMarked size={14} style={{ color: 'var(--color-gs-green)' }} />
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-gs-text)' }}>
              ANOTAÇÕES — {sku}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gs-surface transition-colors"
          >
            <X size={14} style={{ color: 'var(--color-gs-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Input form */}
          <div className="p-4" style={{ borderBottom: '1px solid var(--color-gs-border)' }}>
            <div className="font-mono text-[9px] tracking-widest uppercase mb-2" style={{ color: 'var(--color-gs-muted)' }}>
              NOVA ANOTAÇÃO
            </div>
            {/* Tipo selector */}
            <div className="flex flex-wrap gap-1 mb-3">
              {TIPO_OPTIONS.map(opt => {
                const active = tipoAcao === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTipoAcao(opt.value)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono font-bold tracking-wide uppercase transition-all"
                    style={{
                      background: active ? opt.color + '22' : 'transparent',
                      border: `1px solid ${active ? opt.color : 'var(--color-gs-border)'}`,
                      color: active ? opt.color : 'var(--color-gs-muted)',
                    }}
                  >
                    <opt.Icon size={10} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {/* Textarea */}
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Ex: Baixei preço em 5%, espero recuperar vendas..."
              rows={3}
              className="w-full rounded px-3 py-2 text-xs font-mono resize-none outline-none transition-colors"
              style={{
                background: 'var(--color-gs-bg)',
                border: '1px solid var(--color-gs-border)',
                color: 'var(--color-gs-text)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-gs-green)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-gs-border)'}
            />
            <button
              onClick={handleSubmit}
              disabled={!nota.trim() || addNote.isPending}
              className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40"
              style={{
                background: 'var(--color-gs-green)',
                color: '#000',
              }}
            >
              <Send size={10} />
              {addNote.isPending ? 'Salvando...' : 'Registrar'}
            </button>
          </div>

          {/* Unresolved notes */}
          {unresolved.length > 0 && (
            <div className="p-4">
              <div className="font-mono text-[9px] tracking-widest uppercase mb-3" style={{ color: 'var(--color-gs-muted)' }}>
                AÇÕES PENDENTES ({unresolved.length})
              </div>
              <div className="flex flex-col gap-3">
                {unresolved.map(note => {
                  const opt = getTipoOption(note.tipo_acao);
                  return (
                    <div
                      key={note.id}
                      className="rounded p-3 relative"
                      style={{ background: 'var(--color-gs-bg)', border: `1px solid ${opt.color}40` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <opt.Icon size={10} style={{ color: opt.color }} />
                        <span className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: opt.color }}>
                          {opt.label}
                        </span>
                        <span className="font-mono text-[9px] ml-auto" style={{ color: 'var(--color-gs-muted)' }}>
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <p className="font-mono text-[11px]" style={{ color: 'var(--color-gs-text)' }}>
                        {note.nota}
                      </p>
                      <button
                        onClick={() => toggleResolved.mutate({ id: note.id, resolvido: true })}
                        className="mt-2 font-mono text-[9px] uppercase tracking-widest hover:underline"
                        style={{ color: 'var(--color-gs-muted)' }}
                      >
                        Marcar como feito
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resolved notes */}
          {resolved.length > 0 && (
            <div className="p-4" style={{ borderTop: '1px solid var(--color-gs-border)' }}>
              <div className="font-mono text-[9px] tracking-widest uppercase mb-3" style={{ color: 'var(--color-gs-muted)' }}>
                JÁ RESOLVIDAS ({resolved.length})
              </div>
              <div className="flex flex-col gap-2">
                {resolved.slice(0, 5).map(note => {
                  const opt = getTipoOption(note.tipo_acao);
                  return (
                    <div
                      key={note.id}
                      className="flex items-start gap-2 p-2 rounded opacity-50"
                      style={{ background: 'var(--color-gs-bg)' }}
                    >
                      <opt.Icon size={10} style={{ color: opt.color, marginTop: 2 }} />
                      <div>
                        <p className="font-mono text-[10px] line-through" style={{ color: 'var(--color-gs-muted)' }}>
                          {note.nota}
                        </p>
                        <span className="font-mono text-[9px]" style={{ color: 'var(--color-gs-muted)' }}>
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleResolved.mutate({ id: note.id, resolvido: false })}
                        className="ml-auto font-mono text-[9px] uppercase hover:underline"
                        style={{ color: 'var(--color-gs-muted)' }}
                      >
                        Desfazer
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BookMarked size={32} style={{ color: 'var(--color-gs-border)' }} />
              <p className="font-mono text-xs text-center" style={{ color: 'var(--color-gs-muted)' }}>
                Nenhuma anotação para este SKU.<br />Registre ações tomadas para manter contexto.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
