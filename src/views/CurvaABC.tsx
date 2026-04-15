import { useState } from 'react'
import { useCurvaABC } from '../hooks/useSupabaseData'
import { Card, Badge, MetricDisplay } from '../components/ui'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

type CurvaFilter = 'all' | 'A' | 'B' | 'C'

const CURVA_COLOR: Record<string, string> = { A: 'text-gs-green', B: 'text-gs-blue', C: 'text-gs-red' }
const TENDENCIA_ICON: Record<string, string> = { crescendo: '↑', caindo: '↓', estavel: '→', declínio: '↓↓' }

export function CurvaABC() {
  const { data, loading } = useCurvaABC()
  const [filter, setFilter] = useState<CurvaFilter>('all')
  const [search, setSearch] = useState('')

  const safeData = data ?? []
  const filtered = safeData.filter((item) => {
    const matchFilter = filter === 'all' || item.curva_abc === filter
    const q = search.toLowerCase()
    const matchSearch = !q || item.id.toLowerCase().includes(q) || item.titulo.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const grupos = { A: safeData.filter((r) => r.curva_abc === 'A'), B: safeData.filter((r) => r.curva_abc === 'B'), C: safeData.filter((r) => r.curva_abc === 'C') }
  const receitaA = grupos.A.reduce((s, r) => s + r.receita_30d, 0)
  const receitaB = grupos.B.reduce((s, r) => s + r.receita_30d, 0)
  const receitaC = grupos.C.reduce((s, r) => s + r.receita_30d, 0)

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          MATRIZ ESTATÍSTICA <span className="text-gs-green">PARETO</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">DISTRIBUIÇÃO 80/15/5 — PORTFÓLIO</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricDisplay
          label="CURVA A"
          value={grupos.A.length}
          badge={<Badge variant="ok">TOP 80%</Badge>}
          trend={<span className="text-gs-green">{formatCurrency(receitaA)}</span>}
        />
        <MetricDisplay
          label="CURVA B"
          value={grupos.B.length}
          badge={<Badge variant="ok">80–95%</Badge>}
          trend={<span className="text-gs-blue">{formatCurrency(receitaB)}</span>}
        />
        <MetricDisplay
          label="CURVA C"
          value={grupos.C.length}
          badge={<Badge variant="warn">INTERVENÇÃO</Badge>}
          trend={<span className="text-gs-red">{formatCurrency(receitaC)}</span>}
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-y border-gs-border py-4">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {(['all', 'A', 'B', 'C'] as CurvaFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-[10px] uppercase font-bold font-mono tracking-widest rounded-sm border transition-all duration-200 whitespace-nowrap ${
                filter === f
                  ? 'bg-gs-text text-gs-bg border-gs-text'
                  : 'bg-transparent text-gs-muted border-gs-border hover:border-gs-muted hover:text-gs-text'
              }`}
            >
              {f === 'all' ? 'VISÃO GLOBAL' : `CURVA ${f}`}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="BUSCAR SKU OU TÍTULO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gs-panel border border-gs-border text-gs-text font-mono text-xs px-4 py-2.5 rounded-sm placeholder-gs-border focus:outline-none focus:border-gs-muted focus:ring-1 focus:ring-gs-muted transition-all uppercase"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-gs-green animate-pulse" />
        </div>
      </div>

      {/* Table Component */}
      <div className="bg-gs-panel border border-gs-border rounded-sm shadow-xl flex flex-col overflow-hidden w-full">
        <div className="px-5 py-3 border-b border-gs-border flex items-center justify-between bg-gs-bg/50">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gs-muted font-mono font-bold tracking-widest uppercase">PORTFOLIO_MATRIX_DB</span>
          </div>
          <span className="text-[10px] text-gs-muted font-mono font-bold">{filtered.length} SKUS FOUND</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gs-bg border-b border-gs-border">
                <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-gs-muted">RANK</th>
                <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-gs-muted">SKU</th>
                <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-gs-muted">DESCRIÇÃO</th>
                <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-gs-muted text-right">RECEITA 30D</th>
                <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-gs-muted">CICLO</th>
                <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-gs-muted">TENDÊNCIA</th>
                <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-gs-muted">STATUS TÁTICO</th>
              </tr>
            </thead>
            <tbody className="bg-gs-panel divide-y divide-gs-border">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gs-green font-mono text-xs uppercase tracking-widest animate-pulse">
                       CARREGANDO VETORES DO BANC0...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center font-mono text-xs text-gs-muted tracking-widest uppercase">
                    Nenhum SKU correspondente aos filtros.
                  </td>
                </tr>
              )}
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gs-bg/50 transition-colors group">
                  <td className={`px-5 py-3 font-bold font-display text-sm ${CURVA_COLOR[item.curva_abc] ?? 'text-gs-muted'}`}>
                    {item.curva_abc}
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-gs-text group-hover:text-white transition-colors">{item.id}</td>
                  <td className="px-5 py-3 text-sm text-gs-text/80 max-w-[280px] truncate">{item.titulo}</td>
                  <td className="px-5 py-3 text-right font-mono text-[11px] text-gs-green font-bold">{formatCurrency(item.receita_30d)}</td>
                  <td className="px-5 py-3 font-mono text-[11px] text-gs-muted">{item.ciclo ?? '—'}</td>
                  <td className={`px-5 py-3 font-mono text-[11px] uppercase tracking-wide ${
                    item.tendencia === 'caindo' || item.tendencia === 'declínio'
                      ? 'text-gs-red'
                      : item.tendencia === 'crescendo'
                      ? 'text-gs-green'
                      : 'text-gs-muted'
                  }`}>
                    {TENDENCIA_ICON[item.tendencia] ?? '—'} <span className="ml-1 opacity-70">{item.tendencia ?? '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    {item.alerta ? (
                       <Badge variant="critical">ALERTA NOVO</Badge>
                    ) : (
                       <Badge variant="ok">CONFORME</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}