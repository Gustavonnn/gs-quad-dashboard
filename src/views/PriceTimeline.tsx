import { useState, useMemo } from 'react'
import { usePriceTimeline } from '@/hooks'
import type { MLPriceTimeline } from '@/lib/schemas'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function fmtVol(n: number) {
  return new Intl.NumberFormat('pt-BR').format(n)
}

function fmtPct(n: number) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_CONFIG = {
  ABSORVIDO: { color: '#1ce904', bg: 'rgba(28,233,4,0.08)', border: 'rgba(28,233,4,0.25)', label: 'ABSORVIDO' },
  REJEITADO: { color: '#ff003b', bg: 'rgba(255,0,59,0.08)', border: 'rgba(255,0,59,0.25)', label: 'REJEITADO' },
  INEFICAZ:  { color: '#888888', bg: 'rgba(136,136,136,0.08)', border: 'rgba(136,136,136,0.25)', label: 'INEFICAZ' },
}

function StatusBadge({ status }: { status: MLPriceTimeline['absorcao_status'] }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="font-mono text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm uppercase"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

function DeltaTag({ value, isPrice = false }: { value: number; isPrice?: boolean }) {
  const color = isPrice
    ? (value > 0 ? '#ff003b' : '#1ce904')   // preço subiu = ruim (vermelho), caiu = bom (verde)
    : (value > 0 ? '#1ce904' : '#ff003b')   // volume subiu = bom (verde), caiu = ruim (vermelho)

  return (
    <span className="font-mono text-[11px] font-bold" style={{ color }}>
      {fmtPct(value)}
    </span>
  )
}

function TimelineCard({ event }: { event: MLPriceTimeline }) {
  const cfg = STATUS_CONFIG[event.absorcao_status]

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div
          className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
          style={{ background: cfg.color, color: cfg.color }}
        />
        <div className="w-px flex-1 mt-2" style={{ background: cfg.border }} />
      </div>

      <div
        className="flex-1 mb-6 rounded-md p-4 transition-all duration-200 hover:brightness-110"
        style={{ background: '#1a1a1a', border: `1px solid ${cfg.border}` }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
              {event.sku}
            </span>
            <StatusBadge status={event.absorcao_status} />
          </div>
          <span className="font-mono text-[10px] text-[#555] tracking-widest shrink-0">
            {fmtDate(event.evento_data)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-sm p-3"
            style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}
          >
            <div className="font-mono text-[9px] text-[#555] tracking-widest uppercase mb-2">
              Reajuste de Preço
            </div>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-[#666]">{fmt(event.preco_anterior)}</span>
              <span className="text-[#444]">→</span>
              <span className="text-white font-bold">{fmt(event.preco_novo)}</span>
            </div>
            <div className="mt-1">
              <DeltaTag value={event.delta_preco_pct} isPrice />
            </div>
          </div>

          <div
            className="rounded-sm p-3"
            style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}
          >
            <div className="font-mono text-[9px] text-[#555] tracking-widest uppercase mb-2">
              Reação de Volume (7d)
            </div>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-[#666]">{fmtVol(event.volume_7d_antes)}</span>
              <span className="text-[#444]">→</span>
              <span className="text-white font-bold">{fmtVol(event.volume_7d_depois)}</span>
            </div>
            <div className="mt-1">
              <DeltaTag value={event.delta_volume_pct} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PriceTimeline() {
  const { data, isLoading, refetch } = usePriceTimeline()
  const [activeFilter, setActiveFilter] = useState<string>('TOTAL')

  const counts = useMemo(() => ({
    TOTAL: data?.length ?? 0,
    ABSORVIDO: data?.filter(e => e.absorcao_status === 'ABSORVIDO').length ?? 0,
    REJEITADO: data?.filter(e => e.absorcao_status === 'REJEITADO').length ?? 0,
    INEFICAZ:  data?.filter(e => e.absorcao_status === 'INEFICAZ').length ?? 0,
  }), [data])

  const filteredData = useMemo(() => {
    if (!data) return []
    if (activeFilter === 'TOTAL') return data
    return data.filter(e => e.absorcao_status === activeFilter)
  }, [data, activeFilter])

  const handleFilterClick = (status: string) => {
    setActiveFilter(prev => prev === status ? 'TOTAL' : status)
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-5xl mx-auto w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-[#ff003b] pl-6 py-2">
        <div>
          <h2 className="font-mono text-[10px] text-[#555] tracking-[0.3em] uppercase mb-2">
            Neural Pricing Engine // Log v3.0
          </h2>
          <div className="font-display font-black text-3xl text-white tracking-tighter flex items-center gap-2">
            PRICE_REACTION<span className="text-[#ff003b] animate-pulse">_</span>
          </div>
          <p className="font-mono text-[11px] text-[#888] mt-3 max-w-xl leading-relaxed uppercase tracking-wider">
            Monitoramento de absorção tática. Análise de volume (7 dias pré vs 7 dias pós) para validação de elasticidade real em ambiente de produção.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={refetch}
            className="group flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm transition-all bg-[#111] border border-[#222] hover:border-[#ff003b] hover:text-white"
          >
            <span className="group-hover:rotate-180 transition-transform duration-500">↻</span> 
            Re-Sync Engine
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'TOTAL', label: 'TOTAL_EVENTS', value: counts.TOTAL, color: '#fff', border: '#222' },
          { id: 'ABSORVIDO', label: 'MARKET_ABSORBED', value: counts.ABSORVIDO, color: '#1ce904', border: 'rgba(28,233,4,0.2)' },
          { id: 'REJEITADO', label: 'PRICE_REJECTED', value: counts.REJEITADO, color: '#ff003b', border: 'rgba(255,0,59,0.2)' },
          { id: 'INEFICAZ', label: 'INEFFECTIVE', value: counts.INEFICAZ, color: '#888', border: 'rgba(136,136,136,0.2)' },
        ].map((item) => {
          const isActive = activeFilter === item.id
          return (
            <div
              key={item.label}
              onClick={() => handleFilterClick(item.id)}
              className={`bg-[#0c0c0c] border p-5 rounded-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ${isActive ? 'ring-1 ring-inset brightness-125' : 'hover:border-gs-muted'}`}
              style={{ 
                borderColor: isActive ? item.color : item.border,
                boxShadow: isActive ? `0 0 20px -12px ${item.color}` : 'none'
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-current opacity-[0.02] rotate-45 pointer-events-none" style={{ color: item.color }} />
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase mb-3 opacity-50 flex justify-between items-center" style={{ color: item.color }}>
                {item.label}
                {isActive && <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: item.color }} />}
              </div>
              <div className="font-mono text-3xl font-black" style={{ color: item.color }}>
                {isLoading ? '---' : String(item.value).padStart(2, '0')}
              </div>
              <div className="mt-4 h-1 w-full bg-[#111] rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000" 
                  style={{ 
                    backgroundColor: item.color,
                    width: isLoading ? '0%' : `${(item.value / (counts.TOTAL || 1)) * 100}%` 
                  }} 
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-[#0c0c0c] border border-[#111] rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#111] bg-[#080808] flex justify-between items-center">
          <span className="font-mono text-[10px] text-[#444] tracking-[0.2em] uppercase">
            Live Feed // Events Log {activeFilter !== 'TOTAL' && `// Filtering: ${activeFilter}`}
          </span>
          {isLoading && <span className="font-mono text-[10px] text-[#ff003b] animate-pulse">SCANNING DATABASE...</span>}
        </div>

        <div className="p-6">
          {!isLoading && filteredData.length === 0 && (
            <div className="py-20 text-center border border-dashed border-[#222]">
              <div className="font-mono text-[11px] text-[#444] tracking-[0.2em] uppercase">
                Zero reajustes {activeFilter !== 'TOTAL' ? `com status ${activeFilter}` : ''} detectados no período.
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filteredData.map((event, i) => (
              <TimelineCard key={`${event.sku}-${event.evento_data}-${i}`} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
