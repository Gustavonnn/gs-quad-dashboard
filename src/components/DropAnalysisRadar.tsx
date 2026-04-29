import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AlertTriangle } from 'lucide-react';

interface DropAnalysisProps {
  mlb: string;
}

interface AxisData {
  axis: string;
  value: number;
  fullMark: 100;
}

export function DropAnalysisRadar({ mlb }: DropAnalysisProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['drop-analysis', mlb],
    queryFn: async () => {
      // Real schema: item_id=mlb, visitas_total, vendas_total
      const { data: produto } = await supabase
        .from('live_produtos')
        .select('item_id, sku, titulo, preco, estoque, visitas_total, vendas_total, health_score')
        .eq('item_id', mlb)
        .maybeSingle();

      if (!produto) return null;

      // Real schema: severidade (not severity)
      const { data: alertas } = await supabase
        .from('ia_alertas_operacionais')
        .select('tipo_alerta, severidade')
        .eq('sku', (produto as Record<string, unknown>).sku ?? '')
        .eq('status', 'ATIVO');

      return { produto, alertas: alertas ?? [] };
    },
    enabled: !!mlb,
    staleTime: 60_000,
  });

  const axes = useMemo<AxisData[]>(() => {
    if (!data?.produto) {
      return [
        { axis: 'Conversao', value: 0, fullMark: 100 },
        { axis: 'Visitas', value: 0, fullMark: 100 },
        { axis: 'Preco', value: 0, fullMark: 100 },
        { axis: 'Estoque', value: 0, fullMark: 100 },
        { axis: 'Ads Score', value: 0, fullMark: 100 },
      ];
    }

    const p = data.produto as Record<string, unknown>;
    // Compute conversion from real fields
    const visitas = (p.visitas_total as number) ?? 0;
    const vendas_t = (p.vendas_total as number) ?? 0;
    const convRate = visitas > 0 ? Math.min((vendas_t / visitas) * 100, 100) : 0;

    const conv = Math.min((convRate / 16) * 100, 100);
    const visits = Math.min((visitas / 1000) * 100, 100);
    const preco = Math.max(100 - Math.min((((p.preco as number) ?? 0) / 500) * 100, 100), 0);
    const estoque = Math.min((((p.estoque as number) ?? 0) / 50) * 100, 100);

    const alertCount = data.alertas.length;
    const adsScore = alertCount === 0 ? 80 : Math.max(80 - alertCount * 20, 0);

    return [
      { axis: 'Conversao', value: Math.round(conv), fullMark: 100 },
      { axis: 'Visitas', value: Math.round(visits), fullMark: 100 },
      { axis: 'Preco', value: Math.round(preco), fullMark: 100 },
      { axis: 'Estoque', value: Math.round(estoque), fullMark: 100 },
      { axis: 'Ads Score', value: Math.round(adsScore), fullMark: 100 },
    ];
  }, [data]);

  const worstAxis = useMemo(() => {
    if (axes.every((a) => a.value === 0)) return null;
    return axes.reduce((min, curr) => (curr.value < min.value ? curr : min), axes[0]);
  }, [axes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div
          className="h-32 w-32 animate-pulse rounded-full"
          style={{ background: 'var(--color-gs-border)' }}
        />
      </div>
    );
  }

  if (!data?.produto) {
    return (
      <div className="text-center py-6">
        <span className="font-mono text-[10px]" style={{ color: 'var(--color-gs-muted)' }}>
          Produto não encontrado
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div style={{ width: '100%', maxWidth: 320, height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={axes} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="var(--color-gs-border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{
                fill: 'var(--color-gs-muted)',
                fontSize: 9,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-gs-panel)',
                border: '1px solid var(--color-gs-border)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                borderRadius: '2px',
              }}
              formatter={(v: number) => [`${v}%`, 'Score']}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="var(--color-gs-green)"
              fill="var(--color-gs-green)"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={(props: Record<string, unknown>) => {
                const val = (props as { payload?: { value?: number } }).payload?.value ?? 50;
                const cx = props.cx as number;
                const cy = props.cy as number;
                return (
                  <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={val < 40 ? 'var(--color-gs-red)' : 'var(--color-gs-green)'}
                    stroke="var(--color-gs-panel)"
                    strokeWidth={2}
                  />
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {worstAxis && worstAxis.value < 40 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-sm w-full max-w-xs"
          style={{
            background: 'var(--color-gs-yellow-dim)',
            border: '1px solid var(--color-gs-yellow)',
          }}
        >
          <AlertTriangle size={12} style={{ color: 'var(--color-gs-yellow)' }} />
          <span
            className="font-mono text-[9px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--color-gs-yellow)' }}
          >
            VETOR PRINCIPAL DE QUEDA: {worstAxis.axis.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
