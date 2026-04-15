import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { KanbanCard as KanbanCardType, KanbanStatus } from '@/hooks'
import { KANBAN_COLUMNS } from '@/hooks'
import { KanbanCard as KanbanCardComponent } from './KanbanCard'
import { Plus } from 'lucide-react'

interface KanbanColumnProps {
  column: (typeof KANBAN_COLUMNS)[number]
  cards: KanbanCardType[]
  onOpenCard: (card: KanbanCardType) => void
  onDeleteCard: (cardId: string) => void
  onTriggerCard: (cardId: string) => void
  onAddCard?: (status: KanbanStatus) => void
}

export function KanbanColumn({
  column,
  cards,
  onOpenCard,
  onDeleteCard,
  onTriggerCard,
  onAddCard,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-md border-b-2 mb-2"
        style={{ borderColor: column.color }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: column.color }}
          />
          <span
            className="font-mono text-[10px] font-bold tracking-widest uppercase"
            style={{ color: column.color }}
          >
            {column.label}
          </span>
          <span className="font-mono text-[9px] text-[var(--color-gs-muted)] bg-[var(--color-gs-border)] px-1.5 py-0.5 rounded-sm">
            {cards.length}
          </span>
        </div>
        {onAddCard && (
          <button
            onClick={() => onAddCard(column.id)}
            className="p-1 rounded hover:bg-[var(--color-gs-border)] transition-colors"
            title={`Adicionar card em ${column.label}`}
          >
            <Plus size={12} className="text-[var(--color-gs-muted)]" />
          </button>
        )}
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 p-2 rounded-b-md min-h-[120px] transition-all ${
          isOver ? 'ring-1 ring-inset ring-[var(--color-gs-green)]/30 bg-[var(--color-gs-green)]/5' : 'bg-[var(--color-gs-bg)]/50'
        }`}
        style={{ background: isOver ? `${column.color}08` : undefined }}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCardComponent
              key={card.id}
              card={card}
              onOpen={onOpenCard}
              onDelete={onDeleteCard}
              onTrigger={onTriggerCard}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <span className="font-mono text-[10px] text-[var(--color-gs-muted)] opacity-50">
              {isOver ? 'Solte aqui' : 'Vazio'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
