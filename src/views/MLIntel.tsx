import { useMLInsights } from '@/hooks';
import type { MLInsight } from '@/lib/schemas';
import { Brain, AlertTriangle, TrendingDown, Target, Zap } from 'lucide-react';

// Helper para formatar probabilidade
const formatPct = (val: number | null) => {
  if (val === null || val === undefined) return '0%';
  return `${(val * 100).toFixed(0)}%`;
};

interface MLIntelProps {
  onSelectSku: (sku: string) => void;
}

export function MLIntel({ onSelectSku }: MLIntelProps) {
  const { data, isLoading } = useMLInsights();

  if (isLoading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Brain className="animate-pulse text-gs-green" size={48} />
          <span className="font-mono text-sm tracking-widest text-gs-green animate-pulse">
            PROCESSING NEURAL DATA...
          </span>
        </div>
      </div>
    );
  }

  // Separar dados
  const ruptures = data
    .filter((d) => (d.rupture_risk || 0) > 0.6)
    .sort((a, b) => b.rupture_risk - a.rupture_risk);
  const anomalies = data
    .filter((d) => (d.anomaly_score || 0) < 0)
    .sort((a, b) => a.anomaly_score - b.anomaly_score);
  const clusters = data.filter((d) => d.abc_divergence && d.abc_divergence !== 'CONCORDANTE');

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-4 bg-gs-panel border border-gs-border p-5 rounded-sm shadow-[0_0_15px_rgba(52,131,250,0.05)] border-l-4 border-l-gs-green">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-gs-text flex items-center gap-2">
                <Brain className="text-gs-green" size={20} />
                ML ENGINE INSIGHTS
              </h2>
              <p className="font-mono text-xs text-gs-muted mt-2 tracking-wide max-w-3xl">
                Sistema avançado de Machine Learning. Modelos ativos: Holt-Winters (Séries
                Temporais), Isolation Forest (Detecção de Anomalias), K-Means (Clustering ABC) e
                Linear Regression (Elasticidade).
              </p>
            </div>
            <div className="flex gap-4 font-mono text-xs">
              <div className="flex flex-col items-end">
                <span className="text-gs-muted">TOTAL SKUs</span>
                <span className="text-gs-text font-bold text-lg">{data.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL 1: RUPTURE RISK */}
        <div className="bg-gs-panel border border-gs-border rounded-sm flex flex-col h-[65vh]">
          <div className="p-4 border-b border-gs-border bg-gs-bg flex justify-between items-center">
            <h3 className="font-display font-bold text-sm tracking-wide text-gs-yellow flex items-center gap-2">
              <TrendingDown size={16} />
              RISCO DE RUPTURA (TOP)
            </h3>
            <span className="font-mono text-[10px] bg-gs-yellow/10 text-gs-yellow px-2 py-1 rounded-sm">
              {ruptures.length} CRÍTICOS
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {ruptures.length === 0 ? (
              <div className="text-center py-10 font-mono text-xs text-gs-muted">
                SEM RISCOS DE RUPTURA DETECTADOS.
              </div>
            ) : (
              ruptures.map((item: MLInsight) => (
                <div
                  key={item.sku}
                  onClick={() => onSelectSku(item.sku)}
                  className="group relative border border-gs-border bg-gs-bg p-3 rounded-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer hover:border-gs-yellow/50"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gs-yellow rounded-l-sm" />
                  <div className="pl-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs text-gs-text font-bold block">
                          {item.sku}
                        </span>
                        <span
                          className="font-mono text-[10px] text-gs-muted block truncate max-w-[150px]"
                          title={item.titulo}
                        >
                          {item.titulo}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-xs text-gs-yellow font-bold">
                          {formatPct(item.rupture_risk)}
                        </span>
                        <span className="font-mono text-[9px] text-gs-muted">PROBABILIDADE</span>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center pt-2 border-t border-gs-border/50">
                      <div className="font-mono text-[10px] text-gs-muted">
                        FORECAST 7D:{' '}
                        <span className="text-white font-bold">
                          {Math.round(item.forecast_7d || 0)} UN
                        </span>
                      </div>
                      <div className="font-mono text-[10px] px-1.5 py-0.5 bg-gs-border rounded-sm">
                        CURVA {item.curva_abc}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL 2: ANOMALY DETECTION */}
        <div className="bg-gs-panel border border-gs-border rounded-sm flex flex-col h-[65vh]">
          <div className="p-4 border-b border-gs-border bg-gs-bg flex justify-between items-center">
            <h3 className="font-display font-bold text-sm tracking-wide text-gs-text flex items-center gap-2">
              <AlertTriangle size={16} />
              ANOMALIAS DETECTADAS
            </h3>
            <span className="font-mono text-[10px] bg-black/10 text-gs-text px-2 py-1 rounded-sm">
              {anomalies.length} ATIVAS
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {anomalies.length === 0 ? (
              <div className="text-center py-10 font-mono text-xs text-gs-muted">
                TRÁFEGO E VENDAS NORMAIS.
              </div>
            ) : (
              anomalies.map((item: MLInsight) => (
                <div
                  key={item.sku}
                  onClick={() => onSelectSku(item.sku)}
                  className="group relative border border-gs-border bg-gs-panel p-3 rounded-sm cursor-pointer hover:border-gs-text/60 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs text-gs-text font-bold block flex items-center gap-2">
                        {item.sku}
                        <span className="text-[9px] bg-black text-white px-1 rounded-sm uppercase">
                          {item.anomaly_severity}
                        </span>
                      </span>
                      <span className="font-mono text-[10px] text-gs-muted mt-1 uppercase block">
                        {item.anomaly_type?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-xs text-gs-text font-bold">
                        {item.anomaly_score?.toFixed(3)}
                      </span>
                      <span className="font-mono text-[9px] text-gs-muted">SCORE</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL 3: DYNAMIC CLUSTERING & ELASTICITY */}
        <div className="bg-gs-panel border border-gs-border rounded-sm flex flex-col h-[65vh]">
          <div className="p-4 border-b border-gs-border bg-gs-bg flex justify-between items-center">
            <h3 className="font-display font-bold text-sm tracking-wide text-gs-green flex items-center gap-2">
              <Target size={16} />
              PONTUAÇÃO ESTRATÉGICA
            </h3>
            <span className="font-mono text-[10px] bg-gs-green/10 text-gs-green px-2 py-1 rounded-sm">
              CLUSTERS & PREÇO
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            <div className="font-mono text-[10px] text-gs-muted uppercase tracking-widest mb-1">
              Divergências ABC (ML vs Pareto)
            </div>
            {clusters.length === 0 ? (
              <div className="text-center py-4 font-mono text-xs text-gs-muted">
                NENHUMA DIVERGÊNCIA.
              </div>
            ) : (
              clusters
                .map((item: MLInsight) => (
                  <div
                    key={item.sku}
                    onClick={() => onSelectSku(item.sku)}
                    className="border border-gs-border bg-gs-bg p-3 rounded-sm flex items-center justify-between cursor-pointer hover:border-gs-green/50 transition-all"
                  >
                    <div>
                      <span className="font-mono text-xs text-gs-text font-bold block">
                        {item.sku}
                      </span>
                      <span className="font-mono text-[10px] text-gs-muted">
                        ML Sugere: Curva {item.ml_cluster}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-gs-muted line-through">
                        C: {item.curva_abc}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm font-bold ${item.abc_divergence === 'PROMOVIDO' ? 'bg-gs-green/20 text-gs-green' : 'bg-gs-muted/20 text-gs-muted'}`}
                      >
                        {item.abc_divergence}
                      </span>
                    </div>
                  </div>
                ))
                .slice(0, 10)
            )}

            <div className="font-mono text-[10px] text-gs-muted uppercase tracking-widest mt-6 mb-1">
              Top SKUs Elásticos
            </div>
            {data
              .filter((d) => d.elasticity !== null && d.elasticity < -1)
              .sort((a, b) => (a.elasticity || 0) - (b.elasticity || 0))
              .slice(0, 5)
              .map((item: MLInsight) => (
                <div
                  key={item.sku}
                  onClick={() => onSelectSku(item.sku)}
                  className="border border-gs-border bg-gs-bg p-3 rounded-sm cursor-pointer hover:border-gs-yellow/50 transition-all"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs text-gs-text font-bold">{item.sku}</span>
                    <Zap size={14} className="text-gs-yellow" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-gs-muted uppercase">
                      {item.price_sensitivity?.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-xs font-bold text-gs-yellow">
                      ε = {item.elasticity?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
