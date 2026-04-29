import { useState } from 'react';
import { X, MessageSquare, Clock, Tag, Send } from 'lucide-react';
import { useMLBNotes, type TipoAcao } from '@/hooks/useMLBNotes';

const TIPO_OPTIONS: { value: TipoAcao; label: string; color: string }[] = [
  { value: 'OBSERVACAO', label: 'Observação', color: 'var(--color-gs-blue)' },
  { value: 'ALTERACAO_PRECO', label: 'Alteração de Preço', color: 'var(--color-gs-yellow)' },
  { value: 'PAUSA_ADS', label: 'Pausa de Ads', color: 'var(--color-gs-red)' },
  { value: 'REPOSICAO', label: 'Reposição', color: 'var(--color-gs-green)' },
  { value: 'OUTRO', label: 'Outro', color: 'var(--color-gs-muted)' },
];

function getTipoColor(tipo: string) {
  return TIPO_OPTIONS.find((o) => o.value === tipo)?.color ?? 'var(--color-gs-muted)';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

interface MLBNotesDrawerProps {
  mlb: string;
  sku?: string;
  open: boolean;
  onClose: () => void;
}

export function MLBNotesDrawer({ mlb, sku, open, onClose }: MLBNotesDrawerProps) {
  const { notes, isLoading, addNote, isAdding } = useMLBNotes(mlb);
  const [nota, setNota] = useState('');
  const [tipoAcao, setTipoAcao] = useState<TipoAcao>('OBSERVACAO');
  const [lembreteData, setLembreteData] = useState('');

  const handleSubmit = () => {
    if (!nota.trim()) return;
    addNote({
      mlb,
      sku,
      nota: nota.trim(),
      tipo_acao: tipoAcao,
      lembrete_data: lembreteData || null,
    });
    setNota('');
    setLembreteData('');
    setTipoAcao('OBSERVACAO');
  };

  const upcomingReminders = notes.filter(
    (n) => n.lembrete_data && new Date(n.lembrete_data) >= new Date()
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 z-50 h-full flex flex-col"
        style={{
          width: '400px',
          maxWidth: '90vw',
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
            <MessageSquare size={14} style={{ color: 'var(--color-gs-green)' }} />
            <div>
              <span
                className="font-mono text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--color-gs-text)' }}
              >
                {mlb}
              </span>
              {sku && (
                <span
                  className="font-mono text-[8px] tracking-wide ml-2"
                  style={{ color: 'var(--color-gs-muted)' }}
                >
                  SKU: {sku}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded transition-colors hover:bg-[var(--color-gs-hover-overlay)]"
            style={{ color: 'var(--color-gs-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-0">
          {/* Add Note Section */}
          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--color-gs-border)' }}>
            <span
              className="font-mono text-[8px] tracking-[0.25em] uppercase font-bold"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              ADICIONAR NOTA
            </span>

            <div className="mt-3 flex flex-col gap-2.5">
              <select
                value={tipoAcao}
                onChange={(e) => setTipoAcao(e.target.value as TipoAcao)}
                className="font-mono text-[10px] px-2 py-1.5 rounded-sm"
                style={{
                  background: 'var(--color-gs-bg)',
                  border: '1px solid var(--color-gs-border)',
                  color: 'var(--color-gs-text)',
                  outline: 'none',
                }}
              >
                {TIPO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Escreva sua anotação..."
                rows={3}
                className="font-mono text-[11px] px-2 py-1.5 rounded-sm resize-none"
                style={{
                  background: 'var(--color-gs-bg)',
                  border: '1px solid var(--color-gs-border)',
                  color: 'var(--color-gs-text)',
                  outline: 'none',
                }}
              />

              <div className="flex items-center gap-2">
                <Clock size={11} style={{ color: 'var(--color-gs-muted)' }} />
                <input
                  type="datetime-local"
                  value={lembreteData}
                  onChange={(e) => setLembreteData(e.target.value)}
                  className="font-mono text-[10px] px-2 py-1 rounded-sm flex-1"
                  style={{
                    background: 'var(--color-gs-bg)',
                    border: '1px solid var(--color-gs-border)',
                    color: 'var(--color-gs-text)',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!nota.trim() || isAdding}
                className="flex items-center justify-center gap-2 font-mono text-[10px] font-bold tracking-widest uppercase py-2 rounded-sm transition-all"
                style={{
                  background: nota.trim() ? 'var(--color-gs-green)' : 'var(--color-gs-border)',
                  color: nota.trim() ? '#000' : 'var(--color-gs-muted)',
                  cursor: nota.trim() ? 'pointer' : 'not-allowed',
                  border: 'none',
                }}
              >
                <Send size={11} />
                {isAdding ? 'REGISTRANDO...' : 'REGISTRAR'}
              </button>
            </div>
          </div>

          {/* Upcoming Reminders */}
          {upcomingReminders.length > 0 && (
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-gs-border)' }}>
              <span
                className="font-mono text-[8px] tracking-[0.25em] uppercase font-bold"
                style={{ color: 'var(--color-gs-yellow)' }}
              >
                LEMBRETES ATIVOS
              </span>
              <div className="mt-2 flex flex-col gap-1.5">
                {upcomingReminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm"
                    style={{
                      background: 'var(--color-gs-yellow-dim)',
                      border: '1px solid var(--color-gs-border)',
                    }}
                  >
                    <Clock size={10} style={{ color: 'var(--color-gs-yellow)' }} />
                    <span
                      className="font-mono text-[9px] flex-1 truncate"
                      style={{ color: 'var(--color-gs-text)' }}
                    >
                      {r.nota.slice(0, 60)}
                      {r.nota.length > 60 ? '...' : ''}
                    </span>
                    {r.lembrete_data && isToday(r.lembrete_data) && (
                      <span
                        className="font-mono text-[7px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-sm animate-pulse"
                        style={{ background: 'var(--color-gs-yellow)', color: '#000' }}
                      >
                        HOJE
                      </span>
                    )}
                    {r.lembrete_data && (
                      <span
                        className="font-mono text-[8px]"
                        style={{ color: 'var(--color-gs-muted)' }}
                      >
                        {formatDate(r.lembrete_data)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div className="px-4 py-3">
            <span
              className="font-mono text-[8px] tracking-[0.25em] uppercase font-bold"
              style={{ color: 'var(--color-gs-muted)' }}
            >
              HISTÓRICO
            </span>

            {isLoading ? (
              <div className="mt-3 flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-sm"
                    style={{ background: 'var(--color-gs-border)' }}
                  />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="mt-3 py-6 text-center">
                <span className="font-mono text-[10px]" style={{ color: 'var(--color-gs-muted)' }}>
                  Nenhuma nota registrada para este MLB
                </span>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-0">
                {notes.map((note, idx) => (
                  <div
                    key={note.id}
                    className="relative pl-4 pb-4"
                    style={{
                      borderLeft:
                        idx < notes.length - 1 ? '1px solid var(--color-gs-border)' : 'none',
                    }}
                  >
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-[4px] top-0.5 w-[7px] h-[7px] rounded-full"
                      style={{
                        background: getTipoColor(note.tipo_acao),
                        border: '2px solid var(--color-gs-panel)',
                      }}
                    />

                    <div className="flex items-center gap-2 mb-1">
                      <Tag size={8} style={{ color: getTipoColor(note.tipo_acao) }} />
                      <span
                        className="font-mono text-[8px] font-bold tracking-wider uppercase"
                        style={{ color: getTipoColor(note.tipo_acao) }}
                      >
                        {note.tipo_acao.replace('_', ' ')}
                      </span>
                      <span
                        className="font-mono text-[8px]"
                        style={{ color: 'var(--color-gs-muted)' }}
                      >
                        {formatDate(note.criado_em)}
                      </span>
                    </div>

                    <p
                      className="font-mono text-[10px] leading-relaxed"
                      style={{ color: 'var(--color-gs-text)' }}
                    >
                      {note.nota}
                    </p>

                    <span
                      className="font-mono text-[7px] tracking-wider uppercase mt-1 block"
                      style={{ color: 'var(--color-gs-muted)' }}
                    >
                      por {note.responsavel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
