import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis } from 'recharts';

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);
}

interface SparklineProps {
  data: number[];
  color: string;
  gradientId?: string;
  tooltipLabel?: string;
  showGrid?: boolean;
}

export function Sparkline({
  data,
  color,
  gradientId = 'spark-fill',
  tooltipLabel = 'Receita',
  showGrid = true,
}: SparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            stroke="var(--color-gs-chart-grid)"
            strokeDasharray="3 6"
            vertical={false}
          />
        )}
        <XAxis dataKey="i" hide />
        <Tooltip
          formatter={(v: number) => [fmt(v), tooltipLabel]}
          contentStyle={{
            background: 'var(--color-gs-panel)',
            border: '1px solid var(--color-gs-border)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            borderRadius: '2px',
          }}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={3}
          fill={`url(#${gradientId})`}
          dot={false}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
