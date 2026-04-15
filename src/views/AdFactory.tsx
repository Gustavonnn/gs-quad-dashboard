import { KanbanBoard } from '@/components/KanbanBoard'
import { Brain } from 'lucide-react'

export function AdFactory() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-[var(--color-gs-green)]" />
          <h1 className="font-mono text-lg font-bold text-[var(--color-gs-text)]">
            Ad Factory
          </h1>
        </div>
        <span className="font-mono text-[10px] text-[var(--color-gs-muted)] bg-[var(--color-gs-border)] px-2 py-0.5 rounded-sm">
          KANBAN
        </span>
      </div>

      {/* Kanban Board */}
      <KanbanBoard />
    </div>
  )
}
