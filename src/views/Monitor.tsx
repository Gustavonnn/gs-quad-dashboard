import { useIAAlertas, resolveAlerta, useStockAlerts } from '../hooks/useSupabaseData'
import { Card } from '../components/ui'
import { AlertCircle, Package, Activity } from 'lucide-react'

const SEV_COLOR: Record<string, string> = {
  'CRÍTICO': 'border-l-gs-red',
  'ALTO': 'border-l-gs-yellow',
  'MÉDIO': 'border-l-gs-blue',
  'BAIXO': 'border-l-gs-muted',
}

const SEV_TEXT_COLOR: Record<string, string> = {
  'CRÍTICO': 'text-gs-red',
  'ALTO': 'text-gs-yellow',
  'MÉDIO': 'text-gs-blue',
  'BAIXO': 'text-gs-muted',
}

export function Monitor() {
  const { data, loading, refetch } = useIAAlertas()
  const { data: stockData, loading: stockLoading } = useStockAlerts()

  const handleResolve = async (id: string) => {
    await resolveAlerta(id)
    refetch()
  }

  const isAnyLoading = loading || stockLoading
  const hasNoAlerts = !isAnyLoading && data.length === 0 && stockData.length === 0

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          CENTRAL DE <span className="text-gs-red">ALERTAS</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">ALERTAS OPERACIONAIS PENDENTES — CURVA A E C</p>
      </div>

      {isAnyLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gs-red opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-gs-red"></span>
            </span>
            <span className="text-gs-red text-[10px] font-mono tracking-widest uppercase font-bold animate-pulse">Varrendo malha operacional...</span>
          </div>
        </div>
      )}

      {hasNoAlerts && (
        <div className="bg-gs-panel border border-gs-border rounded-sm shadow-xl flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-gs-green opacity-80 mb-2">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p className="text-gs-text font-display text-lg tracking-wide uppercase font-bold">Nenhum alerta pendente</p>
          <p className="text-gs-muted text-[10px] uppercase font-mono tracking-widest">Portfólio operando dentro dos parâmetros ótimos.</p>
        </div>
      )}

      {/* RUPTURA DE ESTOQUE (AUTOMÁTICO) */}
      {!stockLoading && stockData.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-gs-red/30 pb-2 mb-2">
            <AlertCircle className="text-gs-red" size={20} />
            <h3 className="font-display font-bold text-sm tracking-widest text-gs-red uppercase">Ruptura de Estoque (Zero Stock)</h3>
            <span className="font-mono text-[10px] bg-gs-red/10 text-gs-red px-2 py-0.5 rounded-sm">
              {stockData.length} SKUs CRÍTICOS
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stockData.map((item) => (
              <Card key={item.sku} className="border-l-4 border-l-gs-red p-4 bg-gs-red/5 border-y border-r border-gs-red/20 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Package size={48} />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-bold text-gs-red tracking-wider">
                    [RUPTURA] {item.sku}
                  </span>
                  <span className="font-display font-black text-[10px] px-1.5 py-0.5 border border-gs-red/30 text-gs-red rounded-sm">
                    CURVA {item.curva_abc}
                  </span>
                </div>
                <p className="text-[11px] text-gs-text uppercase font-mono tracking-widest mb-1 opacity-90 truncate">{item.titulo}</p>
                <div className="mt-2 text-xs font-mono text-gs-red animate-pulse flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gs-red rounded-full"></span>
                  SKU SEM DISPONIBILIDADE NO FULL/DEPÓSITO
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ALERTAS DA IA E OPERACIONAIS */}
      {!loading && data.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-3 border-b border-gs-border pb-2 mb-2">
            <Activity className="text-gs-blue" size={20} />
            <h3 className="font-display font-bold text-sm tracking-widest text-gs-text uppercase">Alertas Operacionais & IA</h3>
          </div>
          <div className="flex flex-col gap-4">
            {data.map((alerta) => (
              <Card key={alerta.id} className={`border-l-4 ${SEV_COLOR[alerta.severity] ?? 'border-l-gs-muted'} p-5 flex flex-col border-y border-r border-gs-border shadow-lg hover:border-r-gs-muted/50 transition-colors`}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`font-mono text-sm font-bold tracking-wider uppercase ${SEV_TEXT_COLOR[alerta.severity] ?? 'text-gs-muted'}`}>
                    [{alerta.severity}] {alerta.sku}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gs-muted font-mono tracking-widest">
                      {new Date(alerta.data_registro).toLocaleDateString('pt-BR')}
                    </span>
                    <button
                      onClick={() => handleResolve(alerta.id)}
                      className="group relative px-3 py-1 bg-transparent border border-gs-green text-gs-green rounded-sm overflow-hidden transition-all hover:shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                    >
                      <span className="relative z-10 font-mono text-[10px] font-bold tracking-widest uppercase group-hover:text-black transition-colors">✓ RESOLVER</span>
                      <div className="absolute inset-0 bg-gs-green scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gs-text uppercase font-mono tracking-widest mb-2 opacity-90">{alerta.tipo_alerta}</p>
                <p className="text-sm text-gs-text/70 leading-relaxed">{(alerta.descricao ?? '').slice(0, 160)}...</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}