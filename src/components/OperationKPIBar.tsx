import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function GaugeSVG({
  value,
  max,
  label,
  sublabel,
  ranges,
}: {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  ranges: Array<{ from: number; to: number; color: string }>;
}) {
  const pct = Math.min(value / max, 1);
  const startAngle = -90;
  const sweep = 180;
  const r = 60;
  const cx = 75;
  const cy = 70;

  function polarToCart(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(from: number, to: number) {
    const a1 = startAngle + from * sweep;
    const a2 = startAngle + to * sweep;
    const p1 = polarToCart(a1);
    const p2 = polarToCart(a2);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }

  const needleAngle = startAngle + pct * sweep;
  const needleTip = polarToCart(needleAngle);
  const currentColor =
    ranges.find((rg) => pct * max >= rg.from && pct * max <= rg.to)?.color ??
    'var(--color-gs-green)';

  return (
    <div className="flex flex-col items-center">
      <svg width="150" height="90" viewBox="0 0 150 90">
        {/* Background arc */}
        <path
          d={arcPath(0, 1)}
          fill="none"
          stroke="var(--color-gs-border)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Colored range arcs */}
        {ranges.map((rg, i) => {
          const f = rg.from / max;
          const t = Math.min(rg.to / max, 1);
          return (
            <path
              key={i}
              d={arcPath(f, t)}
              fill="none"
              stroke={rg.color}
              strokeWidth="6"
              strokeLinecap="round"
              opacity={0.35}
            />
          );
        })}

        {/* Active arc */}
        {pct > 0 && (
          <path
            d={arcPath(0, pct)}
            fill="none"
            stroke={currentColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
        )}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={currentColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill={currentColor} />
        <circle cx={cx} cy={cy} r="2" fill="var(--color-gs-panel)" />
      </svg>

      <span className="font-heading font-black text-2xl -mt-2" style={{ color: currentColor }}>
        {typeof value === 'number'
          ? value < 1
            ? value.toFixed(2)
            : value >= 1000
              ? `${(value / 1000).toFixed(1)}K`
              : value.toFixed(1)
          : value}
        {label.includes('%') ? '%' : ''}
      </span>
      <span
        className="font-mono text-[8px] tracking-[0.22em] uppercase mt-0.5"
        style={{ color: 'var(--color-gs-muted)' }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          className="font-mono text-[8px] mt-0.5"
          style={{
            color: sublabel.startsWith('+')
              ? 'var(--color-gs-green)'
              : sublabel.startsWith('-')
                ? 'var(--color-gs-red)'
                : 'var(--color-gs-muted)',
          }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}

function RadialGauge({ pct, label }: { pct: number; label: string }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(pct, 100) / 100) * c;
  const color =
    pct >= 80
      ? 'var(--color-gs-green)'
      : pct >= 50
        ? 'var(--color-gs-yellow)'
        : 'var(--color-gs-red)';

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-gs-border)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text
          x="50"
          y="46"
          textAnchor="middle"
          className="font-heading"
          style={{ fill: color, fontSize: '18px', fontWeight: 900 }}
        >
          {Math.round(pct)}%
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          style={{
            fill: 'var(--color-gs-muted)',
            fontSize: '7px',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.15em',
          }}
        >
          ATINGIDO
        </text>
      </svg>
      <span
        className="font-mono text-[8px] tracking-[0.22em] uppercase mt-1"
        style={{ color: 'var(--color-gs-muted)' }}
      >
        {label}
      </span>
    </div>
  );
}

export function OperationKPIBar() {
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['operation-kpi-bar'],
    queryFn: async () => {
      const { data: produtos } = await supabase
        .from('live_produtos')
        .select('conversao, visits')
        .limit(500);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 37);

      const { data: vendas7d } = await supabase
        .from('live_vendas')
        .select('receita')
        .gte('data_venda', sevenDaysAgo.toISOString());

      const { data: vendas30d } = await supabase
        .from('live_vendas')
        .select('receita, data_venda')
        .gte('data_venda', thirtyDaysAgo.toISOString())
        .lt('data_venda', sevenDaysAgo.toISOString());

      const prods = produtos ?? [];
      const avgConv =
        prods.length > 0
          ? prods.reduce((s, p) => s + ((p.conversao as number) ?? 0), 0) / prods.length
          : 0;
      const totalVisits7d = prods.reduce((s, p) => s + ((p.visits as number) ?? 0), 0);

      const prev30dVisits = totalVisits7d;
      const visitsVariation = prev30dVisits > 0 ? 0 : 0;

      const receita7d = (vendas7d ?? []).reduce((s, v) => s + ((v.receita as number) ?? 0), 0);
      const receita30d = (vendas30d ?? []).reduce((s, v) => s + ((v.receita as number) ?? 0), 0);
      const meta = receita30d > 0 ? receita30d / 4 : receita7d;
      const metaPct = meta > 0 ? (receita7d / meta) * 100 : 0;

      return { avgConv, totalVisits7d, visitsVariation, receita7d, metaPct };
    },
    staleTime: 60_000,
  });

  const kpi = kpiData ?? {
    avgConv: 0,
    totalVisits7d: 0,
    visitsVariation: 0,
    receita7d: 0,
    metaPct: 0,
  };

  if (isLoading) {
    return (
      <div
        className="h-28 animate-pulse rounded-sm"
        style={{ background: 'var(--color-gs-border)' }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-around py-4 px-6 gap-4 flex-wrap"
      style={{
        background: 'var(--color-gs-panel)',
        border: '1px solid var(--color-gs-border)',
        borderRadius: '2px',
      }}
    >
      <GaugeSVG
        value={kpi.avgConv}
        max={20}
        label="CONVERSÃO MÉDIA %"
        ranges={[
          { from: 0, to: 3, color: 'var(--color-gs-red)' },
          { from: 3, to: 8, color: 'var(--color-gs-yellow)' },
          { from: 8, to: 16, color: 'var(--color-gs-green)' },
          { from: 16, to: 20, color: 'var(--color-gs-green)' },
        ]}
      />

      <div style={{ width: 1, height: 60, background: 'var(--color-gs-border)' }} />

      <GaugeSVG
        value={kpi.totalVisits7d}
        max={Math.max(kpi.totalVisits7d * 1.5, 1000)}
        label="VISITAS 7 DIAS"
        sublabel={
          kpi.visitsVariation !== 0
            ? `${kpi.visitsVariation > 0 ? '+' : ''}${kpi.visitsVariation.toFixed(1)}%`
            : undefined
        }
        ranges={[
          { from: 0, to: Math.max(kpi.totalVisits7d * 1.5, 1000), color: 'var(--color-gs-blue)' },
        ]}
      />

      <div style={{ width: 1, height: 60, background: 'var(--color-gs-border)' }} />

      <RadialGauge pct={kpi.metaPct} label="RECEITA VS META" />
    </div>
  );
}
