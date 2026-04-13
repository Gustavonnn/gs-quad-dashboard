import { useGrowthPlans } from '../hooks/useSupabaseData'
import { Card, Badge } from '../components/ui'

export function GrowthPlan() {
  const { data, loading } = useGrowthPlans()

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          PLAYBOOK TÁTICO: <span className="text-gs-green">GERALDO GROWTH</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">DECISÕES TÁTICAS GERADAS POR IA — SUPABASE SYNC</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gs-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-gs-green"></span>
            </span>
            <span className="text-gs-green text-[10px] font-mono tracking-widest uppercase font-bold animate-pulse">Escutando sinais de Inteligência...</span>
          </div>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="bg-gs-panel border border-gs-border rounded-sm shadow-xl flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-gs-muted opacity-50 font-mono text-4xl">{'<>'}</div>
          <p className="text-gs-text/80 font-mono text-sm tracking-wider">Sem planos táticos exportados na nuvem.</p>
          <p className="text-gs-muted text-[10px] uppercase tracking-widest">Aguardando execução de Geraldo (Python)</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {data.map((plan) => (
          <Card key={plan.id} className="p-6 flex flex-col group hover:border-gs-muted/30 transition-colors duration-300">
            <div className="flex items-start justify-between mb-4 border-b border-gs-border pb-3">
              <span className="text-sm font-mono font-bold text-gs-green uppercase tracking-wide"># {plan.sku}</span>
              <Badge variant={plan.status_intervencao === 'APROVADO' ? 'ok' : 'warn'}>
                {plan.status_intervencao}
              </Badge>
            </div>
            <p className="text-xs text-gs-yellow font-mono font-bold mb-3 uppercase tracking-wider">{">>>"} {plan.acionavel}</p>
            <p className="text-sm text-gs-text/80 font-inter leading-relaxed">{plan.descricao_plano}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}