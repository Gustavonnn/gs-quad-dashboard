import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type KanbanCard } from '@/hooks'
import { GripVertical, Zap, Brain, Trash2 } from 'lucide-react'

interface KanbanCardProps {
  card: KanbanCard
  onOpen: (card: KanbanCard) => void
  onDelete: (cardId: string) => void
  onTrigger: (cardId: string) => void
}

export function KanbanCard({ card, onOpen, onDelete, onTrigger }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  }

  const typeColor = card.type === 'hybrid' ? 'var(--color-gs-cyan)' : 'var(--color-gs-yellow)'
  const typeIcon = card.type === 'hybrid' ? <Brain size={10} /> : <Zap size={10} />

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
    >
      <div
        className="bg-[var(--color-gs-surface)] border border-[var(--color-gs-border)] rounded-md p-3 cursor-pointer hover:border-[var(--color-gs-muted)]/50 transition-all shadow-sm hover:shadow-md"
        onClick={() => onOpen(card)}
      >
        {/* Drag handle + type */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 text-[var(--color-gs-muted)] hover:text-[var(--color-gs-text)] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={12} />
            </button>
            <span className="font-mono text-[10px] font-bold text-[var(--color-gs-green)] tracking-wider">
              {card.sku}
            </span>
          </div>
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-mono font-bold"
            style={{ color: typeColor, background: `${typeColor}20` }}
            title={card.type}
          >
            {typeIcon}
            {card.type}
          </div>
        </div>

        {/* Categoria */}
        {card.categoria && (
          <div className="font-mono text-[9px] text-[var(--color-gs-muted)] truncate mb-1.5">
            {card.categoria}
          </div>
        )}

        {/* Briefing preview */}
        {card.briefing_data && (
          <div className="mt-2 p-2 bg-[var(--color-gs-bg)] rounded-sm border border-[var(--color-gs-border)]">
            <div className="text-[9px] font-mono text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
              Brief
            </div>
            <div className="text-[10px] font-mono text-[var(--color-gs-text)] leading-relaxed line-clamp-2">
              {card.briefing_data.winning_formula?.sugestao_titulo || '—'}
            </div>
            {card.briefing_data.winning_formula?.preco_recomendado && (
              <div className="mt-1 font-mono text-[9px] font-bold text-[var(--color-gs-green)]">
                R$ {card.briefing_data.winning_formula.preco_recomendado.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* AI trigger badge */}
        {card.trigger_analysis && (
          <div className="mt-2 flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--color-gs-yellow)] animate-pulse">
            <Zap size={10} />
            ANÁLISE ATIVA
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-gs-border)]/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTrigger(card.id)
            }}
            className="flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--color-gs-blue)] hover:text-[var(--color-gs-cyan)] transition-colors"
          >
            <Zap size={9} />
            {card.trigger_analysis ? 'AGUARDANDO...' : '-trigger'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(card.id)
            }}
            className="flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--color-gs-red)] hover:text-[var(--color-gs-red)]/80 transition-colors"
          >
            <Trash2 size={9} />
          </button>
        </div>
      </div>
    </div>
  )
}
