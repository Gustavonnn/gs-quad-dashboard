import { useLiveMetrics } from '../hooks/useSupabaseData'
import { Card, Badge, MetricDisplay, TerminalBox } from '../components/ui'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const TENDENCIA_ICON = { up: '↑', warn: '⚠', neutral: '→' }

export function VisaoGeral() {
  const { metrics, loading } = useLiveMetrics()

  const sparkData = metrics.sparkData.map((v, i) => ({ i, v }))

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          OPERAÇÃO EM <span className="text-gs-green">TEMPO REAL</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">Intel Global — ArmazenaCorp</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricDisplay
          label="RECEITA 24H"
          value={loading ? '—' : formatCurrency(metrics.totalVendas)}
          badge={<Badge variant="live">● LIVE</Badge>}
          trend={<span className="text-gs-green">{TENDENCIA_ICON.up} TENDÊNCIA DE ALTA</span>}
          barFill={0.82}
          barColor="bg-gs-green"
        />
        <MetricDisplay
          label="ALERTAS ATIVOS"
          value={loading ? '—' : String(metrics.alertasAtivos).padStart(2, '0')}
          badge={<Badge variant="warn">⚠ VERIFICAR</Badge>}
          trend={<span className="text-gs-yellow">REQUEREM AÇÃO — CURVA A</span>}
          barFill={(metrics.alertasAtivos * 10) / 100}
          barColor="bg-gs-yellow"
        />
        <MetricDisplay
          label="CATÁLOGO MLB"
          value={loading ? '—' : String(metrics.totalProdutos).padStart(3, '0')}
          badge={<Badge variant="ok">✓ SYNC</Badge>}
          trend={<span className="text-gs-muted">PRODUTOS SINCRONIZADOS</span>}
          barFill={metrics.totalProdutos / 500}
          barColor="bg-gs-blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sparkline Charts */}
        <div className="col-span-1 lg:col-span-2">
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <p className="font-mono text-[10px] text-gs-muted tracking-widest font-bold uppercase">RECEITA 7 DIAS // HISTOGRAMA</p>
              <Badge variant="ok">ACTIVE</Badge>
            </div>
            <div className="flex-1 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Tooltip 
                    formatter={(v: number) => [formatCurrency(v), "RECEITA"]}
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#1F1F1F', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', borderRadius: '4px' }}
                    itemStyle={{ color: '#00FF66' }}
                  />
                  <Line type="monotone" dataKey="v" stroke="#00FF66" strokeWidth={3} dot={false} strokeOpacity={0.8} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Terminal Feed */}
        <div className="h-[250px]">
          <TerminalBox title="TERMINAL_LIVE_FEED" onExport={() => console.log('Exporting...')}>
            <div className="space-y-2">
              <p className="opacity-70"><span className="text-gs-green">[{new Date().toISOString().substring(11,19)}]</span> SYS: Conectado ao Supabase Realtime.</p>
              <p className="opacity-70"><span className="text-gs-yellow">[{new Date().toISOString().substring(11,19)}]</span> INTEL: Carregando inferências...</p>
              <p className="opacity-70"><span className="text-gs-muted">[{new Date().toISOString().substring(11,19)}]</span> SYS: Aguardando sync...</p>
            </div>
          </TerminalBox>
        </div>
      </div>
    </div>
  )
}