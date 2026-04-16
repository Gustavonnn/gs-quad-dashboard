import { useIAAlertas, useStockAlerts, useUpdateAlertaStatus } from '@/hooks';
import { Card } from '@/components/ui';
import { AlertCircle, Activity } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import { ALERTA_RANK } from '@/lib/schemas';

const SEV_BORDER: Record<string, string> = {
  CRÍTICO: 'border-l-gs-text',
  ALTO: 'border-l-gs-yellow',
  MÉDIO: 'border-l-gs-blue',
  BAIXO: 'border-l-gs-muted',
};

const SEV_TEXT: Record<string, string> = {
  CRÍTICO: 'text-gs-text',
  ALTO: 'text-gs-yellow',
  MÉDIO: 'text-gs-blue',
  BAIXO: 'text-gs-muted',
};

interface MonitorProps {
  onSelectSku?: (sku: string) => void;
}

export function Monitor({ onSelectSku }: MonitorProps) {
  const { data: alertas, isLoading: alertasLoading } = useIAAlertas();
  const { data: stockData, isLoading: stockLoading } = useStockAlerts();
  const updateStatus = useUpdateAlertaStatus();

  const isAnyLoading = alertasLoading || stockLoading;
  const hasNoAlerts =
    !isAnyLoading && (alertas?.length ?? 0) === 0 && (stockData?.length ?? 0) === 0;

  const handleAdvanceStatus = (id: string, currentStatus: string) => {
    const rank = ALERTA_RANK[currentStatus] ?? 0;
    const nextRank = Math.min(rank + 1, 2);
    const statusMap: Record<number, string> = {
      0: 'EM_ANALISE',
      1: 'RESOLVIDO',
      2: 'RESOLVIDO',
    };
    updateStatus.mutate({ id, status: statusMap[nextRank] ?? currentStatus });
  };

  const statusLabel: Record<number, string> = {
    0: 'VERIFICAR →',
    1: 'RESOLVER →',
    2: 'RESOLVIDO',
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          CENTRAL DE ALERTAS
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">
          ALERTAS OPERACIONAIS PENDENTES — CURVA A E C
        </p>
      </div>

      {isAnyLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      )}

      {hasNoAlerts && (
        <div className="bg-gs-panel border border-gs-border rounded-sm shadow-xl flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-gs-green opacity-80 mb-2">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="text-gs-text font-display text-lg tracking-wide uppercase font-bold">
            Nenhum alerta pendente
          </p>
          <p className="text-gs-muted text-[10px] uppercase font-mono tracking-widest">
            Portfólio operando dentro dos parâmetros ótimos.
          </p>
        </div>
      )}

      {/* RUPTURA DE ESTOQUE */}
      {!stockLoading && (stockData?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-gs-border pb-2 mb-2">
            <AlertCircle className="text-gs-text" size={20} />
            <h3 className="font-display font-bold text-sm tracking-widest text-gs-text uppercase">
              Ruptura de Estoque (Zero Stock)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(stockData ?? []).map((item) => (
              <Card
                key={item.sku}
                onClick={() => onSelectSku?.(item.sku)}
                className="border-l-4 border-l-gs-text p-4 bg-gs-surface border-y border-r border-gs-border flex flex-col relative overflow-hidden group cursor-pointer hover:border-gs-text/50 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-bold text-gs-text tracking-wider">
                    [RUPTURA] {item.sku}
                  </span>
                </div>
                <p className="text-[11px] text-gs-text uppercase font-mono tracking-widest mb-1 opacity-90 truncate">
                  {item.titulo}
                </p>
                <div className="mt-2 text-xs font-mono text-gs-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gs-text rounded-full" />
                  SKU SEM DISPONIBILIDADE NO FULL/DEPÓSITO
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ALERTAS IA */}
      {!alertasLoading && (alertas?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-3 border-b border-gs-border pb-2 mb-2">
            <Activity className="text-gs-blue" size={20} />
            <h3 className="font-display font-bold text-sm tracking-widest text-gs-text uppercase">
              Alertas Operacionais & IA
            </h3>
          </div>
          <div className="flex flex-col gap-4">
            {(alertas ?? []).map((alerta) => {
              const rank = ALERTA_RANK[alerta.status] ?? 0;
              const isResolved = rank >= 2;

              return (
                <Card
                  key={alerta.id}
                  onClick={() => onSelectSku?.(alerta.sku)}
                  className={`border-l-4 ${SEV_BORDER[alerta.severity] ?? 'border-l-gs-muted'} p-5 flex flex-col border-y border-r border-gs-border shadow-lg hover:border-r-gs-muted/50 transition-colors cursor-pointer group`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`font-mono text-sm font-bold tracking-wider uppercase ${SEV_TEXT[alerta.severity] ?? 'text-gs-muted'}`}
                    >
                      [{alerta.severity}] {alerta.sku}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-gs-muted font-mono tracking-widest">
                        {new Date(alerta.data_registro).toLocaleDateString('pt-BR')}
                      </span>
                      {!isResolved && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdvanceStatus(alerta.id, alerta.status);
                          }}
                          disabled={updateStatus.isPending}
                          className="group relative px-3 py-1 bg-transparent border border-gs-green text-gs-green rounded-sm overflow-hidden transition-all hover:shadow-[0_0_15px_rgba(52,131,250,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="relative z-10 font-mono text-[10px] font-bold tracking-widest uppercase group-hover:text-black transition-colors">
                            {statusLabel[rank] ?? 'AVANÇAR'}
                          </span>
                          <div className="absolute inset-0 bg-gs-green scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gs-text uppercase font-mono tracking-widest mb-2 opacity-90">
                    {alerta.tipo_alerta}
                  </p>
                  <p className="text-sm text-gs-text/70 leading-relaxed">
                    {(alerta.descricao ?? '').slice(0, 160)}...
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
