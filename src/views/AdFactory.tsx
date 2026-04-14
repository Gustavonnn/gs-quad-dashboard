import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Inbox,
  Brain,
  Pen,
  Scale,
  Eye,
  Rocket,
  Plus,
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  ChevronDown,
  Sparkle,
  Package,
  Tag,
  TrendingUp,
  Copy,
  Trash2,
  GripVertical,
  Play,
  Check,
} from 'lucide-react'
import {
  useKanbanCards,
  createKanbanCard,
  updateKanbanCardStatus,
  updateKanbanCardBriefing,
  updateKanbanCardManual,
  deleteKanbanCard,
} from '../hooks/useSupabaseData'
import type { KanbanCard, KanbanStatus, BriefingData, ManualData } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<KanbanStatus, { label: string; icon: React.ReactNode; color: string; borderColor: string; bgColor: string }> = {
  backlog: {
    label: 'BACKLOG',
    icon: <Inbox size={14} strokeWidth={2} />,
    color: 'text-gs-subtle',
    borderColor: 'border-l-[#444444]',
    bgColor: 'bg-[#444444]/10',
  },
  processing: {
    label: 'NEURAL ANALYSIS',
    icon: <Brain size={14} strokeWidth={2} />,
    color: 'text-gs-blue',
    borderColor: 'border-l-[#0088FF]',
    bgColor: 'bg-[#0088FF]/10',
  },
  drafting: {
    label: 'COPY & DESIGN',
    icon: <Pen size={14} strokeWidth={2} />,
    color: 'text-[#FF6B00]',
    borderColor: 'border-l-[#FF6B00]',
    bgColor: 'bg-[#FF6B00]/10',
  },
  pricing: {
    label: 'STRATEGIC PRICING',
    icon: <Scale size={14} strokeWidth={2} />,
    color: 'text-gs-yellow',
    borderColor: 'border-l-[#FFB800]',
    bgColor: 'bg-[#FFB800]/10',
  },
  review: {
    label: 'REVIEW',
    icon: <Eye size={14} strokeWidth={2} />,
    color: 'text-[#00D4FF]',
    borderColor: 'border-l-[#00D4FF]',
    bgColor: 'bg-[#00D4FF]/10',
  },
  live: {
    label: 'LIVE',
    icon: <Rocket size={14} strokeWidth={2} />,
    color: 'text-gs-green',
    borderColor: 'border-l-[#00FF66]',
    bgColor: 'bg-[#00FF66]/10',
  },
}

const COLUMNS: KanbanStatus[] = ['backlog', 'processing', 'drafting', 'pricing', 'review', 'live']

const VALID_TRANSITIONS: Record<KanbanStatus, KanbanStatus[]> = {
  backlog: ['processing', 'drafting'],
  processing: ['drafting', 'backlog'],
  drafting: ['pricing', 'backlog'],
  pricing: ['review', 'backlog'],
  review: ['live', 'backlog'],
  live: ['backlog'],
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getBriefingStatus(card: KanbanCard): 'ready' | 'processing' | 'pending' {
  if (card.status === 'processing') return 'processing'
  if (card.briefing_data) return 'ready'
  return 'pending'
}

// ─── Toast ─────────────────────────────────────────────────────────────────

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl backdrop-blur-md border animate-slide-up
            ${toast.type === 'success' ? 'bg-gs-green/10 border-gs-green/30 text-gs-green' : ''}
            ${toast.type === 'error' ? 'bg-gs-red/10 border-gs-red/30 text-gs-red' : ''}
            ${toast.type === 'info' ? 'bg-gs-blue/10 border-gs-blue/30 text-gs-blue' : ''}
            ${toast.type === 'warning' ? 'bg-gs-yellow/10 border-gs-yellow/30 text-gs-yellow' : ''}
          `}
        >
          {toast.type === 'success' && <Check size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          {toast.type === 'info' && <Sparkles size={16} />}
          {toast.type === 'warning' && <AlertCircle size={16} />}
          <span className="font-mono text-xs">{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── NewCardModal ──────────────────────────────────────────────────────────

interface NewCardModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

function NewCardModal({ isOpen, onClose, onCreated }: NewCardModalProps) {
  const [sku, setSku] = useState('')
  const [type, setType] = useState<'hybrid' | 'manual'>('hybrid')
  const [categoria, setCategoria] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku.trim()) return

    setLoading(true)
    try {
      const { error } = await createKanbanCard({ sku: sku.trim(), type, categoria: categoria.trim() })
      if (error) throw error
      setSku('')
      setCategoria('')
      setType('hybrid')
      onCreated()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gs-panel border border-gs-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg text-gs-text">NEW CARD</h2>
          <button onClick={onClose} className="text-gs-muted hover:text-gs-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] text-gs-muted uppercase tracking-widest mb-2">
              SKU *
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="Ex: PRPCPCBPTOKT10"
              className="w-full bg-gs-bg border border-gs-border rounded-md px-4 py-2.5 font-mono text-sm text-gs-text placeholder:text-gs-subtle focus:outline-none focus:border-gs-blue transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-gs-muted uppercase tracking-widest mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('hybrid')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border font-mono text-xs uppercase tracking-wider transition-all ${
                  type === 'hybrid'
                    ? 'bg-gs-blue/10 border-gs-blue/50 text-gs-blue'
                    : 'bg-gs-bg border-gs-border text-gs-muted hover:border-gs-border/80'
                }`}
              >
                <Sparkles size={12} />
                Hybrid
              </button>
              <button
                type="button"
                onClick={() => setType('manual')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border font-mono text-xs uppercase tracking-wider transition-all ${
                  type === 'manual'
                    ? 'bg-[#FF6B00]/10 border-[#FF6B00]/50 text-[#FF6B00]'
                    : 'bg-gs-bg border-gs-border text-gs-muted hover:border-gs-border/80'
                }`}
              >
                <Pen size={12} />
                Manual
              </button>
            </div>
            <p className="mt-1.5 font-mono text-[10px] text-gs-subtle">
              {type === 'hybrid' ? 'AI Squad Briefing → Automated draft generation' : 'Manual → Full control, no AI assistance'}
            </p>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-gs-muted uppercase tracking-widest mb-2">
              Categoria
            </label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Eletrônicos > Celulares"
              className="w-full bg-gs-bg border border-gs-border rounded-md px-4 py-2.5 font-mono text-sm text-gs-text placeholder:text-gs-subtle focus:outline-none focus:border-gs-blue transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-md border border-gs-border font-mono text-xs uppercase tracking-wider text-gs-muted hover:bg-gs-border/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !sku.trim()}
              className="flex-1 px-4 py-2.5 rounded-md bg-gs-blue/10 border border-gs-blue/50 font-mono text-xs uppercase tracking-wider text-gs-blue hover:bg-gs-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin mx-auto" />
              ) : (
                'Create Card'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── DraftModal ────────────────────────────────────────────────────────────

interface DraftModalProps {
  card: KanbanCard | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (manualData: ManualData) => void
}

function DraftModal({ card, isOpen, onClose, onUpdate }: DraftModalProps) {
  const [activeTab, setActiveTab] = useState<'briefing' | 'titulo' | 'descricao' | 'preco' | 'fotos'>('briefing')
  const [manualData, setManualData] = useState<ManualData>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (card) {
      setManualData(card.manual_data || {})
    }
  }, [card])

  if (!isOpen || !card) return null

  const briefing = card.briefing_data
  const wf = briefing?.winning_formula

  const handleApplyWinningFormula = () => {
    if (!wf) return
    setManualData({
      titulo: wf.sugestao_titulo,
      descricao: wf.descricao_template,
      preco: wf.preco_recomendado,
      tags: wf.tags_usadas,
    })
    setActiveTab('titulo')
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate(manualData)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'briefing', label: 'Briefing' },
    { id: 'titulo', label: 'Título' },
    { id: 'descricao', label: 'Descrição' },
    { id: 'preco', label: 'Preço' },
    { id: 'fotos', label: 'Fotos' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gs-panel border border-gs-border rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gs-border shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-gs-muted bg-gs-bg px-2 py-1 rounded">
              {card.sku}
            </span>
            <span className={`font-mono text-[10px] px-2 py-1 rounded ${
              card.type === 'hybrid' ? 'bg-gs-blue/10 text-gs-blue' : 'bg-[#FF6B00]/10 text-[#FF6B00]'
            }`}>
              {card.type.toUpperCase()}
            </span>
            {card.status !== 'backlog' && (
              <span className={`font-mono text-[10px] px-2 py-1 rounded ${STATUS_CONFIG[card.status].bgColor} ${STATUS_CONFIG[card.status].color}`}>
                {STATUS_CONFIG[card.status].label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gs-muted hover:text-gs-text transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gs-border shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-gs-blue text-gs-text'
                  : 'border-transparent text-gs-muted hover:text-gs-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'briefing' && (
            <div className="space-y-6">
              {briefing ? (
                <>
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gs-green/10 border border-gs-green/30 font-mono text-xs text-gs-green">
                      <Sparkles size={12} />
                      Briefing Pronto
                    </span>
                    <span className="font-mono text-xs text-gs-muted">
                      {briefing.classificacao} • {wf?.metodologia}
                    </span>
                  </div>

                  {/* Winning Formula */}
                  <div className="bg-gs-bg rounded-lg p-4 border border-gs-border space-y-4">
                    <h3 className="font-display font-bold text-sm text-gs-text flex items-center gap-2">
                      <Trophy className="text-gs-yellow" size={14} />
                      Winning Formula
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-mono text-[10px] text-gs-muted uppercase mb-1">Título Original</p>
                        <p className="font-mono text-xs text-gs-text">{wf?.titulo_original || '—'}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-gs-muted uppercase mb-1">Título Sugerido</p>
                        <p className="font-mono text-xs text-gs-green">{wf?.sugestao_titulo}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-gs-muted uppercase mb-1">Preço Atual</p>
                        <p className="font-mono text-xs text-gs-text">{formatCurrency(wf?.preco_atual)}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-gs-muted uppercase mb-1">Preço Recomendado</p>
                        <p className="font-mono text-xs text-gs-green font-bold">{formatCurrency(wf?.preco_recomendado)}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-gs-muted uppercase mb-1">Elasticidade</p>
                        <p className="font-mono text-xs text-gs-text">ε = {wf?.elasticidade?.toFixed(2) || '—'}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-gs-muted uppercase mb-1">Metodologia</p>
                        <p className="font-mono text-xs text-gs-blue">{wf?.metodologia}</p>
                      </div>
                    </div>

                    {wf?.tags_usadas && wf.tags_usadas.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] text-gs-muted uppercase mb-2">Tags Sugeridas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {wf.tags_usadas.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gs-border/50 rounded font-mono text-[10px] text-gs-muted">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contexto */}
                  <div>
                    <p className="font-mono text-[10px] text-gs-muted uppercase mb-2">Contexto Mercado</p>
                    <p className="font-mono text-xs text-gs-text leading-relaxed">{briefing.contexto_mercado}</p>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={handleApplyWinningFormula}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gs-green/10 border border-gs-green/30 font-mono text-xs text-gs-green hover:bg-gs-green/20 transition-colors"
                  >
                    <Copy size={14} />
                    Aplicar Winning Formula
                  </button>
                </>
              ) : (
                <div className="text-center py-12">
                  <Brain className="mx-auto text-gs-muted mb-4" size={48} strokeWidth={1} />
                  <p className="font-mono text-sm text-gs-muted mb-2">Briefing não gerado</p>
                  <p className="font-mono text-xs text-gs-subtle">
                    {card.type === 'hybrid'
                      ? 'Cards hybrid geram briefing automaticamente ao entrar em Neural Analysis'
                      : 'Cards manual não possuem briefing AI'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'titulo' && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-gs-muted uppercase tracking-widest mb-2">
                  Título do Anúncio
                </label>
                <input
                  type="text"
                  value={manualData.titulo || ''}
                  onChange={(e) => setManualData({ ...manualData, titulo: e.target.value })}
                  placeholder="Digite o título do anúncio..."
                  className="w-full bg-gs-bg border border-gs-border rounded-md px-4 py-3 font-mono text-sm text-gs-text placeholder:text-gs-subtle focus:outline-none focus:border-gs-blue transition-colors"
                />
                <p className="mt-1.5 font-mono text-[10px] text-gs-subtle">
                  Limite: 60 caracteres (ML requirement)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'descricao' && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-gs-muted uppercase tracking-widest mb-2">
                  Descrição do Anúncio
                </label>
                <textarea
                  value={manualData.descricao || ''}
                  onChange={(e) => setManualData({ ...manualData, descricao: e.target.value })}
                  placeholder="Digite a descrição completa do anúncio..."
                  rows={12}
                  className="w-full bg-gs-bg border border-gs-border rounded-md px-4 py-3 font-mono text-sm text-gs-text placeholder:text-gs-subtle focus:outline-none focus:border-gs-blue transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'preco' && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-gs-muted uppercase tracking-widest mb-2">
                  Preço
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-gs-muted">R$</span>
                  <input
                    type="number"
                    value={manualData.preco || ''}
                    onChange={(e) => setManualData({ ...manualData, preco: parseFloat(e.target.value) || undefined })}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full bg-gs-bg border border-gs-border rounded-md pl-12 pr-4 py-3 font-mono text-sm text-gs-text placeholder:text-gs-subtle focus:outline-none focus:border-gs-blue transition-colors"
                  />
                </div>
                {wf?.preco_recomendado && (
                  <p className="mt-2 font-mono text-[10px] text-gs-green">
                    Recomendado: {formatCurrency(wf.preco_recomendado)}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'fotos' && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-gs-muted uppercase tracking-widest mb-2">
                  Fotos Sugeridas
                </label>
                {wf?.fotos_sugestoes && wf.fotos_sugestoes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {wf.fotos_sugestoes.map((foto, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-gs-bg border border-gs-border rounded-lg flex items-center justify-center"
                      >
                        <span className="font-mono text-xs text-gs-muted">{foto}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-gs-subtle">Nenhuma sugestão de foto disponível</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gs-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-md border border-gs-border font-mono text-xs uppercase tracking-wider text-gs-muted hover:bg-gs-border/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-md bg-gs-green/10 border border-gs-green/30 font-mono text-xs uppercase tracking-wider text-gs-green hover:bg-gs-green/20 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Trophy Icon ────────────────────────────────────────────────────────────

function Trophy({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

// ─── KanbanCard Component ───────────────────────────────────────────────────

interface KanbanCardComponentProps {
  card: KanbanCard
  onDragStart: (e: React.DragEvent, card: KanbanCard) => void
  onViewDraft: (card: KanbanCard) => void
  onDelete: (cardId: string) => void
  onGenerateBriefing: (cardId: string) => void
}

function KanbanCardComponent({ card, onDragStart, onViewDraft, onDelete, onGenerateBriefing }: KanbanCardComponentProps) {
  const config = STATUS_CONFIG[card.status]
  const briefingStatus = getBriefingStatus(card)
  const wf = card.briefing_data?.winning_formula

  const isProcessing = card.status === 'processing'
  const canDrag = !isProcessing

  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => canDrag && onDragStart(e, card)}
      className={`
        group relative bg-gs-panel border border-gs-border border-l-4 ${config.borderColor} rounded-lg p-4
        cursor-grab active:cursor-grabbing
        transition-all duration-200
        hover:bg-gs-panel-hover hover:shadow-lg hover:-translate-y-0.5
        ${isProcessing ? 'opacity-80 cursor-not-allowed' : ''}
        ${card.status === 'live' ? 'shadow-[0_0_20px_rgba(0,255,102,0.1)]' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
            card.type === 'hybrid' ? 'bg-gs-blue/10 text-gs-blue' : 'bg-[#FF6B00]/10 text-[#FF6B00]'
          }`}>
            {card.type.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* AI Status Badge */}
          {card.type === 'hybrid' && card.status !== 'backlog' && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] ${
              briefingStatus === 'ready' ? 'bg-gs-green/10 text-gs-green' :
              briefingStatus === 'processing' ? 'bg-gs-blue/10 text-gs-blue animate-pulse' :
              'bg-gs-border/50 text-gs-muted'
            }`}>
              {briefingStatus === 'ready' && <Sparkles size={8} />}
              {briefingStatus === 'processing' && <Loader2 size={8} className="animate-spin" />}
              {briefingStatus === 'pending' && <Brain size={8} />}
            </span>
          )}
        </div>
      </div>

      {/* SKU */}
      <div className="flex items-center gap-2 mb-2">
        <Package size={12} className="text-gs-muted" />
        <span className="font-mono text-sm font-bold text-gs-text tracking-wide">
          {card.sku}
        </span>
      </div>

      {/* Title */}
      {(wf?.sugestao_titulo || card.manual_data?.titulo) ? (
        <p className="font-mono text-xs text-gs-muted mb-3 line-clamp-2 leading-relaxed">
          {card.manual_data?.titulo || wf?.sugestao_titulo}
        </p>
      ) : (
        <p className="font-mono text-xs text-gs-subtle mb-3 italic">
          Sem título definido
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-gs-border/50 my-3" />

      {/* Metrics */}
      <div className="space-y-1.5 mb-3">
        {wf?.preco_recomendado && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-[10px] text-gs-muted">
              <TrendingUp size={10} />
              Preço Ideal
            </span>
            <span className="font-mono text-xs font-bold text-gs-green">
              {formatCurrency(wf.preco_recomendado)}
            </span>
          </div>
        )}

        {card.categoria && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-[10px] text-gs-muted">
              <Tag size={10} />
              Categoria
            </span>
            <span className="font-mono text-[10px] text-gs-subtle truncate max-w-[120px]">
              {card.categoria}
            </span>
          </div>
        )}

        {wf?.metodologia && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-[10px] text-gs-muted">
              <Sparkles size={10} />
              Winning
            </span>
            <span className="font-mono text-[10px] text-gs-blue">
              {wf.metodologia}
            </span>
          </div>
        )}
      </div>

      {/* Processing Animation */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gs-panel/90 rounded-lg">
          <div className="text-center">
            <Loader2 size={24} className="animate-spin text-gs-blue mx-auto mb-2" />
            <p className="font-mono text-[10px] text-gs-blue animate-pulse">
              Consultando Squad...
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-gs-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onViewDraft(card)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-mono text-gs-muted hover:text-gs-text hover:bg-gs-border/30 transition-colors"
        >
          <Eye size={10} />
          {card.briefing_data || card.manual_data?.titulo ? 'View' : 'Draft'}
        </button>

        {card.type === 'hybrid' && !card.briefing_data && card.status === 'backlog' && (
          <button
            onClick={() => onGenerateBriefing(card.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-mono text-gs-blue hover:bg-gs-blue/10 transition-colors"
          >
            <Sparkles size={10} />
            Briefing
          </button>
        )}

        <button
          onClick={() => onDelete(card.id)}
          className="p-1.5 rounded text-[10px] text-gs-red/50 hover:text-gs-red hover:bg-gs-red/10 transition-colors"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  )
}

// ─── KanbanColumn Component ─────────────────────────────────────────────────

interface KanbanColumnProps {
  status: KanbanStatus
  cards: KanbanCard[]
  onDragStart: (e: React.DragEvent, card: KanbanCard) => void
  onDragOver: (e: React.DragEvent, status: KanbanStatus) => void
  onDrop: (e: React.DragEvent, status: KanbanStatus) => void
  onViewDraft: (card: KanbanCard) => void
  onDelete: (cardId: string) => void
  onGenerateBriefing: (cardId: string) => void
  dragOverStatus: KanbanStatus | null
  draggingCard: KanbanCard | null
}

function KanbanColumn({
  status,
  cards,
  onDragStart,
  onDragOver,
  onDrop,
  onViewDraft,
  onDelete,
  onGenerateBriefing,
  dragOverStatus,
  draggingCard,
}: KanbanColumnProps) {
  const config = STATUS_CONFIG[status]
  const isDragOver = dragOverStatus === status
  const isValidDrop = draggingCard && VALID_TRANSITIONS[draggingCard.status].includes(status)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(e, status)
      }}
      onDrop={(e) => onDrop(e, status)}
      className={`
        flex-shrink-0 w-[320px] min-w-[320px] max-w-[360px] flex flex-col
        bg-gs-panel/30 rounded-xl border
        transition-all duration-200
        ${isDragOver
          ? isValidDrop
            ? `border-dashed ${config.borderColor.replace('border-l-', 'border-')} ${config.bgColor}`
            : 'border-gs-red/50 bg-gs-red/5'
          : 'border-gs-border/50'
        }
      `}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-gs-border/50 ${config.bgColor} rounded-t-xl`}>
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${config.color}`}>
            {config.label}
          </span>
        </div>
        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)]">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Inbox size={24} className="text-gs-border mb-2" />
            <p className="font-mono text-[10px] text-gs-subtle">No cards</p>
          </div>
        ) : (
          cards.map((card, index) => (
            <div
              key={card.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-slide-up"
            >
              <KanbanCardComponent
                card={card}
                onDragStart={onDragStart}
                onViewDraft={onViewDraft}
                onDelete={onDelete}
                onGenerateBriefing={onGenerateBriefing}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main AdFactory Component ───────────────────────────────────────────────

export function AdFactory() {
  const { data: cards, loading, refetch } = useKanbanCards()
  const [showNewCardModal, setShowNewCardModal] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [draggingCard, setDraggingCard] = useState<KanbanCard | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<KanbanStatus | null>(null)

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Filter cards by search term
  const filteredCards = cards.filter((card: KanbanCard) =>
    card.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group cards by status
  const cardsByStatus = COLUMNS.reduce((acc, status) => {
    acc[status] = filteredCards.filter((c: KanbanCard) => c.status === status)
    return acc
  }, {} as Record<KanbanStatus, KanbanCard[]>)

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    setDraggingCard(card)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', card.id)
  }

  const handleDragOver = (e: React.DragEvent, status: KanbanStatus) => {
    e.preventDefault()
    setDragOverStatus(status)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: KanbanStatus) => {
    e.preventDefault()
    setDragOverStatus(null)

    if (!draggingCard) return
    if (!VALID_TRANSITIONS[draggingCard.status].includes(newStatus)) {
      addToast(`Transição inválida: ${STATUS_CONFIG[draggingCard.status].label} → ${STATUS_CONFIG[newStatus].label}`, 'error')
      setDraggingCard(null)
      return
    }

    try {
      const { error } = await updateKanbanCardStatus(draggingCard.id, newStatus)
      if (error) throw error

      // If moving to processing, trigger briefing generation
      if (newStatus === 'processing' && draggingCard.type === 'hybrid') {
        addToast(`Briefing iniciado para ${draggingCard.sku}`, 'info')
        // Simulate AI processing delay
        setTimeout(async () => {
          await updateKanbanCardStatus(draggingCard.id, 'drafting')
          addToast(`Briefing completo! Card movido para Drafting`, 'success')
          refetch()
        }, 3000)
      } else {
        addToast(`Card movido para ${STATUS_CONFIG[newStatus].label}`, 'success')
      }

      refetch()
    } catch (err) {
      console.error(err)
      addToast('Erro ao mover card', 'error')
    }

    setDraggingCard(null)
  }

  const handleDragEnd = () => {
    setDraggingCard(null)
    setDragOverStatus(null)
  }

  // Card actions
  const handleViewDraft = (card: KanbanCard) => {
    setSelectedCard(card)
    setShowDraftModal(true)
  }

  const handleDelete = async (cardId: string) => {
    if (!confirm('Excluir este card?')) return
    try {
      const { error } = await deleteKanbanCard(cardId)
      if (error) throw error
      addToast('Card excluído', 'success')
      refetch()
    } catch (err) {
      console.error(err)
      addToast('Erro ao excluir card', 'error')
    }
  }

  const handleGenerateBriefing = async (cardId: string) => {
    try {
      // Update status to processing
      await updateKanbanCardStatus(cardId, 'processing')
      refetch()

      // Simulate Squad Briefing call
      // In production, this would call the Python squad_briefing.py script
      addToast('Squad Briefing iniciado...', 'info')

      setTimeout(async () => {
        // Generate mock briefing data
        const mockBriefing: BriefingData = {
          winning_formula: {
            titulo_original: 'Fone Bluetooth Pro Max',
            sugestao_titulo: 'Fone Bluetooth Pro Max | Cancelamento de Ruído | 30h Bateria',
            descricao_template: 'Fone Bluetooth premium com cancelamento de ruído ativo...',
            preco_recomendado: 299.90,
            preco_atual: 279.90,
            elasticidade: -1.2,
            elasticidade_class: 'ELASTICO',
            metodologia: 'BUNDLE_PLUS',
            tags_usadas: ['Kit', 'Promoção', 'Frete Grátis', 'Original'],
            fotos_sugestoes: ['foto_principal.jpg', 'foto_detalhe.jpg'],
            resultado_esperado: {
              meta_receita: 45000,
              meta_unidades: '+20%',
              prazo_avaliacao: '14 dias',
            },
          },
          classificacao: 'CAMPEAO_ASCENDENTE',
          contexto_mercado: 'Produto Curva A em alta. 3 SKUs similares classificados Curva A na mesma categoria.',
          fontes_consultadas: {
            playbook_matches: 2,
            similar_skus: 3,
            tem_elasticidade: true,
          },
          metadata: {
            sku: selectedCard?.sku || '',
            categoria: selectedCard?.categoria || null,
            generated_at: new Date().toISOString(),
            pipeline_version: '1.0.0',
          },
        }

        await updateKanbanCardBriefing(cardId, mockBriefing)
        await updateKanbanCardStatus(cardId, 'drafting')
        addToast('Briefing completo!', 'success')
        refetch()
      }, 4000)
    } catch (err) {
      console.error(err)
      addToast('Erro ao gerar briefing', 'error')
    }
  }

  const handleUpdateManual = async (manualData: ManualData) => {
    if (!selectedCard) return
    try {
      const { error } = await updateKanbanCardManual(selectedCard.id, manualData)
      if (error) throw error
      addToast('Dados salvos!', 'success')
      refetch()
    } catch (err) {
      console.error(err)
      addToast('Erro ao salvar', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-gs-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6" onDragEnd={handleDragEnd}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-gs-text tracking-wide">
            AdFactory<span className="text-gs-red">.</span>
          </h2>
          <p className="font-mono text-[10px] text-gs-muted mt-1 uppercase tracking-widest">
            Hybrid Kanban • AI-Powered Listing Creation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gs-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search SKU..."
              className="w-48 bg-gs-panel border border-gs-border rounded-md pl-9 pr-4 py-2 font-mono text-xs text-gs-text placeholder:text-gs-subtle focus:outline-none focus:border-gs-blue transition-colors"
            />
          </div>

          {/* New Card Button */}
          <button
            onClick={() => setShowNewCardModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-gs-green/10 border border-gs-green/30 font-mono text-xs text-gs-green hover:bg-gs-green/20 transition-colors"
          >
            <Plus size={14} />
            New Card
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-6 gap-3">
        {COLUMNS.map((status) => {
          const config = STATUS_CONFIG[status]
          const count = cardsByStatus[status].length
          return (
            <div
              key={status}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} border-gs-border/50`}
            >
              <span className={config.color}>{config.icon}</span>
              <span className="font-mono text-[10px] text-gs-muted uppercase">{config.label}</span>
              <span className={`ml-auto font-mono text-xs font-bold ${config.color}`}>{count}</span>
            </div>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            cards={cardsByStatus[status]}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onViewDraft={handleViewDraft}
            onDelete={handleDelete}
            onGenerateBriefing={handleGenerateBriefing}
            dragOverStatus={dragOverStatus}
            draggingCard={draggingCard}
          />
        ))}
      </div>

      {/* Modals */}
      <NewCardModal
        isOpen={showNewCardModal}
        onClose={() => setShowNewCardModal(false)}
        onCreated={() => {
          addToast('Card criado!', 'success')
          refetch()
        }}
      />

      <DraftModal
        card={selectedCard}
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false)
          setSelectedCard(null)
        }}
        onUpdate={handleUpdateManual}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
