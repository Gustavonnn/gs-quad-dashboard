import { useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core'
import { type KanbanCard, type KanbanStatus, KANBAN_COLUMNS, useKanbanCards, useUpdateKanbanCardStatus, useDeleteKanbanCard, useTriggerKanbanAnalysis } from '@/hooks'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCardModal } from './KanbanCardModal'
import { useCreateKanbanCard } from '@/hooks/useKanbanBoard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function KanbanBoard() {
  const { data: cards = [], isLoading } = useKanbanCards()
  const updateStatus = useUpdateKanbanCardStatus()
  const deleteCard = useDeleteKanbanCard()
  const triggerAnalysis = useTriggerKanbanAnalysis()
  const createCard = useCreateKanbanCard()

  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [addCardStatus, setAddCardStatus] = useState<KanbanStatus | null>(null)
  const [newSku, setNewSku] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Group cards by status
  const cardsByStatus = useMemo(() => {
    const map: Record<KanbanStatus, KanbanCard[]> = {
      backlog: [],
      processing: [],
      drafting: [],
      pricing: [],
      review: [],
      live: [],
    }
    cards.forEach((card) => {
      if (map[card.status]) {
        map[card.status].push(card)
      }
    })
    return map
  }, [cards])

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback handled by column isOver
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const cardId = active.id as string
    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    // Determine target status
    let targetStatus: KanbanStatus | null = null

    // Check if dropped on a column
    const column = KANBAN_COLUMNS.find((col) => col.id === over.id)
    if (column) {
      targetStatus = column.id
    } else {
      // Dropped on another card — find its column
      const overCard = cards.find((c) => c.id === over.id)
      if (overCard) {
        targetStatus = overCard.status
      }
    }

    if (targetStatus && targetStatus !== card.status) {
      updateStatus.mutate({ cardId, status: targetStatus })
    }
  }

  const handleOpenCard = (card: KanbanCard) => {
    setSelectedCard(card)
    setModalOpen(true)
  }

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Remover este card?')) {
      deleteCard.mutate(cardId)
    }
  }

  const handleTrigger = (cardId: string) => {
    triggerAnalysis.mutate(cardId)
  }

  const handleAddCard = (status: KanbanStatus) => {
    setAddCardStatus(status)
    setNewSku('')
  }

  const handleCreateCard = () => {
    if (!newSku.trim() || !addCardStatus) return
    createCard.mutate(
      { sku: newSku.trim(), type: 'hybrid' },
      {
        onSuccess: () => {
          setAddCardStatus(null)
          setNewSku('')
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-sm text-[var(--color-gs-muted)] animate-pulse">
          Carregando Kanban...
        </span>
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={cardsByStatus[column.id]}
              onOpenCard={handleOpenCard}
              onDeleteCard={handleDeleteCard}
              onTriggerCard={handleTrigger}
              onAddCard={handleAddCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="bg-[var(--color-gs-surface)] border-2 border-[var(--color-gs-green)] rounded-md p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] opacity-90 w-72">
              <div className="font-mono text-[10px] font-bold text-[var(--color-gs-green)]">
                {activeCard.sku}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add Card Dialog */}
      {addCardStatus !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setAddCardStatus(null)}
          />
          <div className="relative bg-[var(--color-gs-surface)] border border-[var(--color-gs-border)] rounded-xl p-6 w-full max-w-sm shadow-[0_16px_64px_rgba(0,0,0,0.7)]">
            <h3 className="font-mono text-sm font-bold text-[var(--color-gs-text)] mb-4">
              Novo Card — {KANBAN_COLUMNS.find((c) => c.id === addCardStatus)?.label}
            </h3>
            <div className="space-y-3">
              <Input
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="SKU do produto (ex: MLB123456789)"
                className="font-mono text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCard()}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateCard}
                  disabled={!newSku.trim() || createCard.isPending}
                  className="flex-1 gap-2"
                >
                  {createCard.isPending ? 'Criando...' : 'Criar Card'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setAddCardStatus(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Detail Modal */}
      <KanbanCardModal
        card={selectedCard}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedCard(null)
        }}
        onTrigger={handleTrigger}
        onSaveBriefing={(cardId, briefingData) => {
          // Briefing is auto-saved by the pipeline, this is for manual override
          console.log('Save briefing', cardId, briefingData)
        }}
        onSaveManual={(cardId, manualData) => {
          console.log('Save manual', cardId, manualData)
        }}
      />
    </>
  )
}
