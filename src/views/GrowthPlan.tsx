import { useGrowthPlans, useUpdateGrowthPlanStatus } from '@/hooks'
import { Card, Badge } from '@/components/ui'
import { Skeleton } from '@/components/Skeleton'
import { GROWTH_RANK } from '@/lib/schemas'

export function GrowthPlan() {
  const { data, isLoading } = useGrowthPlans()
  const updateStatus = useUpdateGrowthPlanStatus()

  const handleStatusChange = (id: string, currentStatus: string) => {
    const rank = GROWTH_RANK[currentStatus] ?? 0
    const nextRank = Math.min(rank + 1, 3)
    const statusMap: Record<number, string> = {
      0: 'EM_ANDAMENTO',
      1: 'APROVADO',
      2: 'CONCLUÍDO',
      3: 'CONCLUÍDO',
    }
    updateStatus.mutate({ id, status_intervencao: statusMap[nextRank] ?? currentStatus })
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          PLAYBOOK TÁTICO: <span className="text-gs-green">GERALDO GROWTH</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">DECISÕES TÁTICAS GERADAS POR IA — SUPABASE SYNC</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="bg-gs-panel border border-gs-border rounded-sm shadow-xl flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-gs-muted opacity-50 font-mono text-4xl">{'<>'}</div>
          <p className="text-gs-text/80 font-mono text-sm tracking-wider">Sem planos táticos exportados na nuvem.</p>
          <p className="text-gs-muted text-[10px] uppercase tracking-widest">Aguardando execução de Geraldo (Python)</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {(data ?? []).map((plan) => (
          <Card key={plan.id} className="p-6 flex flex-col group hover:border-gs-muted/30 transition-colors duration-300">
            <div className="flex items-start justify-between mb-4 border-b border-gs-border pb-3">
              <span className="text-sm font-mono font-bold text-gs-green uppercase tracking-wide"># {plan.sku}</span>
              <Badge variant={plan.status_intervencao === 'APROVADO' ? 'success' : plan.status_intervencao === 'CONCLUÍDO' ? 'secondary' : 'warning'}>
                {plan.status_intervencao}
              </Badge>
            </div>
            <p className="text-xs text-gs-yellow font-mono font-bold mb-3 uppercase tracking-wider">{">>>"} {plan.acionavel}</p>
            <p className="text-sm text-gs-text/80 leading-relaxed">{plan.descricao_plano}</p>
            <button
              onClick={() => handleStatusChange(plan.id, plan.status_intervencao)}
              disabled={updateStatus.isPending || plan.status_intervencao === 'CONCLUÍDO'}
              className="mt-4 self-start px-3 py-1.5 border border-gs-border text-gs-muted text-[10px] font-mono font-bold tracking-widest uppercase rounded-sm hover:border-gs-green hover:text-gs-green transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {updateStatus.isPending ? 'ATUALIZANDO...' : 'AVANÇAR STATUS →'}
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
