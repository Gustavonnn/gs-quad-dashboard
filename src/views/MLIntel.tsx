import { useState } from 'react';
import { useMLInsights } from '@/hooks';
import type { MLInsight } from '@/lib/schemas';
import {
  Brain,
  AlertTriangle,
  TrendingDown,
  Target,
  Zap,
  Activity,
  Bot,
  ChevronRight,
  BarChart2,
} from 'lucide-react';

// Helper para formatar probabilidade
const formatPct = (val: number | null) => {
  if (val === null || val === undefined) return '0%';
  return `${(val * 100).toFixed(0)}%`;
};

interface MLIntelProps {
  onSelectSku?: (sku: string) => void;
}

export function MLIntel({ onSelectSku }: MLIntelProps) {
  const { data, isLoading, isError, error, refetch } = useMLInsights();
  const [activeTab, setActiveTab] = useState<'ruptura' | 'anomalias' | 'elasticidade'>('ruptura');

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Brain
            className="animate-pulse text-gs-green drop-shadow-[0_0_15px_rgba(52,131,250,0.8)]"
            size={64}
          />
          <span className="font-mono text-sm tracking-widest text-gs-green animate-pulse">
            SINCROZINANDO CÓRTEX NEURAL...
          </span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <AlertTriangle className="text-gs-yellow" size={48} />
          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg text-gs-text uppercase">
              Falha na Sincronização
            </h3>
            <p className="font-mono text-xs text-gs-muted">
              {error instanceof Error ? error.message : 'Ocorreu um erro ao carregar os insights.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-gs-yellow/10 border border-gs-yellow text-gs-yellow font-mono text-[10px] tracking-widest uppercase hover:bg-gs-yellow hover:text-black transition-all"
          >
            TENTAR NOVAMENTE
          </button>
        </div>
      </div>
    );
  }

  // Filtragem e Ordenação
  const ruptures = data
    .filter((d) => (d.rupture_risk ?? 0) > 0.6)
    .sort((a, b) => (b.rupture_risk ?? 0) - (a.rupture_risk ?? 0));

  const anomalies = data
    .filter((d) => (d.anomaly_score ?? 0) < 0)
    .sort((a, b) => (a.anomaly_score ?? 0) - (b.anomaly_score ?? 0));

  const clusters = data.filter((d) => d.abc_divergence && d.abc_divergence !== 'CONCORDANTE');

  const elasticSkus = data
    .filter((d) => d.elasticity !== null && d.elasticity < -1)
    .sort((a, b) => (a.elasticity || 0) - (b.elasticity || 0));

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="bg-gs-panel border border-gs-border p-6 rounded-sm shadow-[0_0_20px_rgba(52,131,250,0.08)] relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gs-green/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <h2 className="font-display font-bold text-2xl text-gs-text flex items-center gap-3">
              <Brain className="text-gs-green" size={28} />
              ML ENGINE INSIGHTS
            </h2>
            <p className="font-mono text-xs text-gs-muted mt-2 tracking-wide max-w-3xl leading-relaxed">
              Sistema Preditivo Operacional. Monitorando continuamente séries temporais
              (Holt-Winters), padrões aberrantes (Isolation Forest) e elasticidade de demanda
              (Regressão).
            </p>
          </div>
          <div className="flex gap-6 font-mono">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gs-muted tracking-widest">SKUS ANALISADOS</span>
              <span className="text-gs-green font-bold text-2xl drop-shadow-[0_0_5px_rgba(52,131,250,0.5)]">
                {data.length}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gs-muted tracking-widest">ALARMES ATIVOS</span>
              <span className="text-gs-yellow font-bold text-2xl drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
                {anomalies.length + ruptures.length}
              </span>
            </div>
          </div>
        </div>

        {/* TABS NAVEGAÇÃO */}
        <div className="flex gap-4 mt-8 border-b border-gs-border pb-[-1px]">
          <button
            onClick={() => setActiveTab('ruptura')}
            className={`pb-2 px-2 font-mono text-[11px] tracking-widest uppercase transition-all flex items-center gap-2 ${
              activeTab === 'ruptura'
                ? 'text-gs-green border-b-2 border-gs-green'
                : 'text-gs-muted hover:text-gs-text'
            }`}
          >
            <TrendingDown size={14} />
            Risco de Ruptura ({ruptures.length})
          </button>
          <button
            onClick={() => setActiveTab('anomalias')}
            className={`pb-2 px-2 font-mono text-[11px] tracking-widest uppercase transition-all flex items-center gap-2 ${
              activeTab === 'anomalias'
                ? 'text-gs-yellow border-b-2 border-gs-yellow'
                : 'text-gs-muted hover:text-gs-text'
            }`}
          >
            <AlertTriangle size={14} />
            Anomalias ({anomalies.length})
          </button>
          <button
            onClick={() => setActiveTab('elasticidade')}
            className={`pb-2 px-2 font-mono text-[11px] tracking-widest uppercase transition-all flex items-center gap-2 ${
              activeTab === 'elasticidade'
                ? 'text-white border-b-2 border-white'
                : 'text-gs-muted hover:text-gs-text'
            }`}
          >
            <Target size={14} />
            Clusters & Elasticidade
          </button>
        </div>
      </div>

      {/* CONTENT PANELS */}
      <div className="bg-gs-panel border border-gs-border rounded-sm h-[60vh] overflow-y-auto relative">
        {/* PANEL: RUPTURA */}
        {activeTab === 'ruptura' && (
          <div className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {ruptures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Activity size={48} className="text-gs-muted mb-4" />
                <span className="font-mono text-xs tracking-widest">
                  ESTOQUE SAUDÁVEL. SEM RISCOS IMINENTES.
                </span>
              </div>
            ) : (
              ruptures.map((item: MLInsight) => (
                <div
                  key={item.sku}
                  className="border border-gs-border bg-black/40 p-5 rounded-sm hover:border-gs-green/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => onSelectSku?.(item.sku)}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-gs-text font-bold">{item.sku}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 bg-gs-border text-gs-muted rounded-sm">
                        CURVA {item.curva_abc}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-gs-muted block truncate max-w-xl">
                      {item.titulo}
                    </span>
                  </div>

                  {/* Progress Bar Ruptura */}
                  <div className="flex-1 max-w-xs w-full">
                    <div className="flex justify-between font-mono text-[10px] mb-1">
                      <span className="text-gs-muted">Risco (Holt-Winters)</span>
                      <span className="text-gs-yellow font-bold">
                        {formatPct(item.rupture_risk)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gs-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          (item.rupture_risk ?? 0) > 0.8
                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                            : 'bg-gs-yellow'
                        }`}
                        style={{ width: `${(item.rupture_risk ?? 0) * 100}%` }}
                      />
                    </div>
                    <div className="font-mono text-[9px] text-gs-muted mt-2 text-right">
                      PREVISÃO 7D:{' '}
                      <span className="text-white font-bold">
                        {Math.round(item.forecast_7d || 0)} UN
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center">
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 bg-gs-bg border border-gs-border text-gs-muted hover:text-gs-green hover:border-gs-green transition-all font-mono text-[10px] tracking-widest uppercase group-hover:opacity-100 opacity-50"
                      title="Gerar Plano de Intervenção com GS-Claw"
                    >
                      <Bot size={14} />
                      ACÃO GS-CLAW
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PANEL: ANOMALIAS */}
        {activeTab === 'anomalias' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {anomalies.length === 0 ? (
              <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-20 opacity-50">
                <BarChart2 size={48} className="text-gs-muted mb-4" />
                <span className="font-mono text-xs tracking-widest">
                  NENHUMA ANOMALIA DETECTADA NA REDE.
                </span>
              </div>
            ) : (
              anomalies.map((item: MLInsight) => (
                <div
                  key={item.sku}
                  className="relative border border-red-500/30 bg-black/60 p-5 rounded-sm overflow-hidden group hover:border-red-500/60 transition-all"
                >
                  {/* Glow vermelho pulsante */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] animate-pulse" />

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="cursor-pointer" onClick={() => onSelectSku?.(item.sku)}>
                      <h4 className="font-mono text-lg text-white font-bold flex items-center gap-2">
                        {item.sku}
                        <AlertTriangle size={16} className="text-red-400" />
                      </h4>
                      <span className="font-mono text-[10px] text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded-sm uppercase mt-2 inline-block border border-red-500/20">
                        {item.anomaly_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block font-mono text-[10px] text-gs-muted mb-1">
                        SCORE DE DESVIO
                      </span>
                      <span className="font-mono text-xl font-bold text-red-500">
                        {item.anomaly_score?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 relative z-10 pt-4 border-t border-gs-border">
                    <button className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all">
                      <Bot size={12} />
                      AUDITORIA IA
                    </button>
                    <button
                      onClick={() => onSelectSku?.(item.sku)}
                      className="px-3 py-1.5 bg-gs-bg border border-gs-border hover:bg-gs-border text-gs-text font-mono text-[10px] transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PANEL: ELASTICIDADE & CLUSTERS */}
        {activeTab === 'elasticidade' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Secao Clusters */}
            <div>
              <h3 className="font-mono text-[11px] text-gs-muted tracking-widest border-b border-gs-border pb-2 mb-4 uppercase">
                Divergências K-Means (Sugestão vs Real)
              </h3>
              <div className="space-y-3">
                {clusters.length === 0 ? (
                  <span className="font-mono text-[10px] text-gs-muted">
                    Todas as curvas estão alinhadas.
                  </span>
                ) : (
                  clusters.slice(0, 10).map((item) => (
                    <div
                      key={item.sku}
                      className="flex items-center justify-between p-3 border border-gs-border bg-black/40 rounded-sm hover:border-gs-green/50 cursor-pointer"
                      onClick={() => onSelectSku?.(item.sku)}
                    >
                      <span className="font-mono text-xs text-gs-text font-bold">{item.sku}</span>
                      <div className="flex items-center gap-3 font-mono text-[10px]">
                        <span className="text-gs-muted line-through">C: {item.curva_abc}</span>
                        <ChevronRight size={12} className="text-gs-muted" />
                        <span className="text-gs-green font-bold bg-gs-green/10 px-2 py-0.5 rounded-sm border border-gs-green/20 shadow-[0_0_8px_rgba(52,131,250,0.2)]">
                          Sugestão ML: {item.ml_cluster}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Secao Elasticidade */}
            <div>
              <h3 className="font-mono text-[11px] text-gs-muted tracking-widest border-b border-gs-border pb-2 mb-4 uppercase">
                Radar de Elasticidade Elevada (Regressão)
              </h3>
              <div className="space-y-3">
                {elasticSkus.length === 0 ? (
                  <span className="font-mono text-[10px] text-gs-muted">
                    Nenhum SKU altamente elástico detectado.
                  </span>
                ) : (
                  elasticSkus.slice(0, 10).map((item) => (
                    <div
                      key={item.sku}
                      className="flex flex-col p-3 border border-gs-border bg-black/40 rounded-sm hover:border-gs-yellow/50 cursor-pointer group"
                      onClick={() => onSelectSku?.(item.sku)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-gs-text font-bold flex items-center gap-2">
                          <Zap size={14} className="text-gs-yellow" />
                          {item.sku}
                        </span>
                        <span className="font-mono text-xs text-gs-yellow font-bold">
                          ε = {item.elasticity?.toFixed(2)}
                        </span>
                      </div>

                      {/* Elasticity Scale Visual */}
                      <div className="relative w-full h-1 bg-gs-bg rounded-full mt-1">
                        <div
                          className="absolute h-full bg-gs-yellow rounded-full shadow-[0_0_5px_rgba(250,204,21,0.5)] transition-all"
                          style={{
                            right: '50%',
                            width: `${Math.min(50, Math.abs(item.elasticity || 0) * 10)}%`,
                          }}
                        />
                        <div className="absolute left-1/2 top-[-3px] w-0.5 h-2.5 bg-gs-muted" />
                      </div>
                      <span className="font-mono text-[9px] text-gs-muted mt-2 uppercase text-center block">
                        {item.price_sensitivity?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
