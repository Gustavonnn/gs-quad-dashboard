import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Zap,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
  BarChart2,
} from 'lucide-react';
import { useAdsRadar } from '../hooks/useAdsRadar';
import type { AdsMLBEntry, RadarStatus, RadarAction } from '../types/terminal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function fmtPct(n: number) {
  return n.toFixed(2) + '%';
}

const STATUS_CONFIG: Record<
  RadarStatus,
  {
    label: string;
    color: string;
    border: string;
    bg: string;
    icon: React.ReactNode;
    glow: string;
  }
> = {
  WINNER: {
    label: 'VENCEDOR',
    color: 'text-gs-green',
    border: 'border-gs-green',
    bg: 'bg-gs-green/8',
    icon: <Zap size={12} />,
    glow: 'shadow-[0_0_12px_rgba(52,131,250,0.15)]',
  },
  MONITOR: {
    label: 'ATENÇÃO',
    color: 'text-gs-yellow',
    border: 'border-gs-yellow',
    bg: 'bg-gs-yellow/8',
    icon: <AlertTriangle size={12} />,
    glow: 'shadow-[0_0_12px_rgba(255,149,0,0.15)]',
  },
  KILL: {
    label: 'DESLIGAR',
    color: 'text-gs-text',
    border: 'border-gs-border',
    bg: 'bg-black/5',
    icon: <XCircle size={12} />,
    glow: 'shadow-[0_0_12px_rgba(0,0,0,0.05)]',
  },
};

const ACTION_LABELS: Record<RadarAction, string> = {
  ESCALAR: '⬆ ESCALAR',
  MANTER: '✓ MANTER',
  AJUSTAR_PRECO: '₊ AJUSTAR PREÇO',
  REABASTECER: '📦 REABASTECER',
  PAUSAR: '⏸ PAUSAR',
  DESLIGAR: '✕ DESLIGAR',
};

const ACTION_COLORS: Record<RadarAction, string> = {
  ESCALAR: 'text-gs-green border-gs-green/40 bg-gs-green/10',
  MANTER: 'text-gs-blue border-gs-blue/40 bg-gs-blue/10',
  AJUSTAR_PRECO: 'text-gs-yellow border-gs-yellow/40 bg-gs-yellow/10',
  REABASTECER: 'text-orange-400 border-orange-400/40 bg-orange-400/10',
  PAUSAR: 'text-gs-yellow border-gs-yellow/40 bg-gs-yellow/10',
  DESLIGAR: 'text-gs-text border-gs-border/40 bg-black/10',
};

// ─── Portfolio Score Gauge ────────────────────────────────────────────────────

function PortfolioGauge({
  score,
  total,
  winners,
  monitors,
  kills,
}: {
  score: number;
  total: number;
  winners: number;
  monitors: number;
  kills: number;
}) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dashLen = (score / 100) * circ * 0.75; // 270° arc

  const color = score >= 65 ? '#3483FA' : score >= 40 ? '#FF9500' : '#333333';

  return (
    <div className="flex items-center gap-8">
      {/* SVG gauge */}
      <div className="relative w-[140px] h-[140px] shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-[90deg]">
          {/* Track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--color-gs-border)"
            strokeWidth="8"
            strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
            strokeLinecap="round"
          />
          {/* Fill */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dashLen} ${circ - dashLen}`}
            strokeDashoffset={`-${circ * 0.125}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-black text-3xl" style={{ color }}>
            {score}
          </span>
          <span className="text-[8px] font-mono text-gs-muted tracking-widest uppercase">
            PORTFOLIO
          </span>
        </div>
      </div>

      {/* Counters */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono tracking-widest uppercase text-gs-muted w-14">
            Total MLBs
          </span>
          <span className="font-mono font-bold text-gs-text text-sm">{total}</span>
        </div>
        <div className="w-full h-[1px] bg-gs-border/30" />
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-gs-green shrink-0" />
          <span className="text-[9px] font-mono uppercase text-gs-muted w-14">Vencedores</span>
          <span className="font-mono font-bold text-gs-green text-sm">{winners}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-gs-yellow shrink-0" />
          <span className="text-[9px] font-mono uppercase text-gs-muted w-14">Atenção</span>
          <span className="font-mono font-bold text-gs-yellow text-sm">{monitors}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-gs-text shrink-0" />
          <span className="text-[9px] font-mono uppercase text-gs-muted w-14">Desligar</span>
          <span className="font-mono font-bold text-gs-text text-sm">{kills}</span>
        </div>
      </div>
    </div>
  );
}

// (ScoreBar removed — score rendered inline in rows via progress bar)

// ─── Velocity Badge ───────────────────────────────────────────────────────────

function VelocityBadge({ trend }: { trend: AdsMLBEntry['velocity_trend'] }) {
  if (trend === 'ACELERANDO')
    return (
      <span className="flex items-center gap-0.5 text-[9px] font-mono text-gs-green">
        <TrendingUp size={10} /> ACELERANDO
      </span>
    );
  if (trend === 'CAINDO')
    return (
      <span className="flex items-center gap-0.5 text-[9px] font-mono text-gs-muted">
        <TrendingDown size={10} /> CAINDO
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-[9px] font-mono text-gs-muted">
      <Minus size={10} /> ESTÁVEL
    </span>
  );
}

// ─── MLB Diagnosis Panel ──────────────────────────────────────────────────────

function DiagnosisPanel({ entry }: { entry: AdsMLBEntry }) {
  const cfg = STATUS_CONFIG[entry.radar_status];
  const strokeColor =
    entry.radar_status === 'WINNER'
      ? '#3483FA'
      : entry.radar_status === 'MONITOR'
        ? '#FF9500'
        : '#333333';
  const roasColor = entry.roas_est >= 3 ? '#3483FA' : entry.roas_est >= 1.5 ? '#FF9500' : '#666666';
  const acosColor = entry.acos_est <= 33 ? '#3483FA' : entry.acos_est <= 60 ? '#FF9500' : '#666666';
  const cvColor =
    entry.conversion_rate >= 2 ? '#3483FA' : entry.conversion_rate >= 0.5 ? '#FF9500' : '#999999';
  const v100Color = entry.sales_per_100_visits >= 2 ? '#3483FA' : '#999999';

  const adMetrics = [
    {
      lbl: 'ROAS',
      sub: 'est. retorno/gasto',
      val: entry.roas_est > 0 ? entry.roas_est.toFixed(1) + 'x' : '—',
      color: roasColor,
      big: true,
    },
    {
      lbl: 'ACOS',
      sub: 'est. custo/receita',
      val: entry.acos_est > 0 ? entry.acos_est.toFixed(0) + '%' : '—',
      color: acosColor,
      big: true,
    },
    {
      lbl: 'V/100 clicks',
      sub: 'vendas por ads',
      val: entry.sales_per_100_visits.toFixed(1),
      color: v100Color,
      big: true,
    },
    {
      lbl: 'Custo/Venda',
      sub: 'spend/conversão',
      val: entry.cost_per_sale_est > 0 ? fmt(entry.cost_per_sale_est) : '—',
      color: 'var(--color-gs-muted)',
      big: false,
    },
    {
      lbl: 'Rev./Visita',
      sub: 'receita/click',
      val: entry.revenue_per_visit > 0 ? fmt(entry.revenue_per_visit) : '—',
      color: 'var(--color-gs-muted)',
      big: false,
    },
    {
      lbl: 'CVR',
      sub: 'taxa de conversão',
      val: fmtPct(entry.conversion_rate),
      color: cvColor,
      big: true,
    },
  ];

  return (
    <div className={`border-t-0 border ${cfg.border}/30 ${cfg.bg} flex flex-col`}>
      {/* ── ADS PERFORMANCE BANNER ── */}
      <div
        className="grid border-b border-white/5"
        style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
      >
        {adMetrics.map((c, i) => (
          <div
            key={c.lbl}
            className="flex flex-col items-center justify-center py-3 px-2 gap-0.5"
            style={{ borderRight: i < 5 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
          >
            <span className="font-mono text-[7px] uppercase tracking-widest mb-1 text-gs-muted">
              {c.lbl}
            </span>
            <span
              className="font-heading font-black"
              style={{ color: c.color, fontSize: c.big ? '20px' : '13px', lineHeight: 1 }}
            >
              {c.val}
            </span>
            <span className="font-mono text-[7px] text-gs-muted opacity-40 text-center">
              {c.sub}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] font-mono uppercase text-gs-green tracking-widest mb-0.5">
              ✓ Sinais Positivos
            </span>
            {entry.win_signals.length > 0 ? (
              entry.win_signals.map((s, i) => (
                <span key={i} className="text-[9px] font-mono text-gs-green/80">
                  • {s}
                </span>
              ))
            ) : (
              <span className="text-[9px] font-mono text-gs-muted/50">Nenhum sinal</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] font-mono uppercase text-gs-yellow tracking-widest mb-0.5">
              ⚠ Alertas
            </span>
            {entry.monitor_reasons.length > 0 ? (
              entry.monitor_reasons.map((s, i) => (
                <span key={i} className="text-[9px] font-mono text-gs-yellow/80">
                  • {s}
                </span>
              ))
            ) : (
              <span className="text-[9px] font-mono text-gs-muted/50">Sem alertas</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] font-mono uppercase text-gs-red tracking-widest mb-0.5">
              ✕ Motivos Kill
            </span>
            {entry.kill_reasons.length > 0 ? (
              entry.kill_reasons.map((s, i) => (
                <span key={i} className="text-[9px] font-mono text-gs-text/80">
                  • {s}
                </span>
              ))
            ) : (
              <span className="text-[9px] font-mono text-gs-muted/50">Nenhum</span>
            )}
          </div>
        </div>

        {/* Mini chart */}
        {entry.chartData.length > 0 && (
          <div className="h-[80px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={entry.chartData} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${entry.mlb_id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor={strokeColor} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="var(--color-gs-chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-gs-chart-label)"
                  fontSize={7}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={18}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="var(--color-gs-chart-label)"
                  fontSize={7}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-gs-panel)',
                    border: '1px solid var(--color-gs-border)',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                  cursor={{ stroke: 'var(--color-gs-chart-label)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Vendas"
                  stroke={strokeColor}
                  fill={`url(#grad-${entry.mlb_id})`}
                  strokeWidth={2.5}
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Base metrics strip */}
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/5">
          {[
            { label: 'Visitas', value: entry.visits.toString() },
            { label: 'Rev. 30d', value: fmt(entry.revenue_30d) },
            { label: 'Avg/dia 7d', value: entry.avg_daily_7d.toFixed(1) },
            { label: 'Ticket', value: fmt(entry.price) },
            { label: 'Estoque', value: entry.stock.toString() },
          ].map((m) => (
            <div key={m.label} className="flex flex-col">
              <span className="text-[7px] text-gs-muted font-mono uppercase tracking-widest">
                {m.label}
              </span>
              <span className="text-[11px] font-mono font-bold text-gs-text">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MLB Row ──────────────────────────────────────────────────────────────────

function MlbRow({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: AdsMLBEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const cfg = STATUS_CONFIG[entry.radar_status];

  return (
    <div
      className={`border-b border-gs-border/20 transition-colors ${isExpanded ? cfg.bg + ' ' + cfg.glow : 'hover:bg-white/[0.02]'}`}
    >
      {/* Main row */}
      <div
        onClick={onToggle}
        className="grid items-center gap-2 px-3 py-2.5 cursor-pointer"
        style={{ gridTemplateColumns: '24px 130px 1fr 72px 40px 40px 40px 40px 90px 72px 26px' }}
      >
        {/* Status dot */}
        <div className="flex justify-center">
          <span
            className={`w-1.5 h-1.5 rounded-full ${entry.radar_status === 'WINNER' ? 'bg-gs-green animate-pulse' : entry.radar_status === 'MONITOR' ? 'bg-gs-yellow' : 'bg-gs-text'}`}
          />
        </div>

        {/* MLB ID */}
        <a
          href={`https://www.mercadolivre.com.br/anuncios/${entry.mlb_id.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-gs-blue hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors"
        >
          {entry.mlb_id}
          <ExternalLink size={9} className="opacity-40" />
        </a>

        {/* Title */}
        <span className="font-mono text-[10px] text-gs-muted truncate">{entry.title}</span>

        {/* SKU */}
        <span className="font-mono text-[9px] text-gs-muted/60 truncate">{entry.sku}</span>

        {/* 7d */}
        <span
          className={`font-mono text-[11px] font-bold text-right ${entry.sales_7d > 0 ? 'text-gs-text' : 'text-gs-muted/30'}`}
        >
          {entry.sales_7d}
        </span>
        {/* 15d */}
        <span className="font-mono text-[11px] text-gs-muted/70 text-right">{entry.sales_15d}</span>
        {/* 30d */}
        <span className="font-mono text-[11px] text-gs-muted/70 text-right">{entry.sales_30d}</span>
        {/* Ontem */}
        <span
          className={`font-mono text-[11px] font-bold text-right ${entry.sales_yesterday >= 2 ? 'text-gs-green' : entry.sales_yesterday === 1 ? 'text-gs-text' : 'text-gs-muted/30'}`}
        >
          {entry.sales_yesterday}
        </span>

        {/* Velocity */}
        <VelocityBadge trend={entry.velocity_trend} />

        {/* Action badge */}
        <span
          className={`text-[8px] font-mono tracking-tight border px-1.5 py-0.5 ${ACTION_COLORS[entry.recommended_action]} truncate`}
        >
          {ACTION_LABELS[entry.recommended_action]}
        </span>

        {/* Expand */}
        <span className="text-gs-muted/40 flex justify-center">
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </div>

      {/* Diagnosis panel */}
      {isExpanded && <DiagnosisPanel entry={entry} />}
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabKey = 'WINNER' | 'MONITOR' | 'KILL';

// ─── Main View ────────────────────────────────────────────────────────────────

export function AdsRadar() {
  const { winners, monitors, kills, summary, loading } = useAdsRadar();
  const [activeTab, setActiveTab] = useState<TabKey>('WINNER');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const tabData: Record<TabKey, AdsMLBEntry[]> = useMemo(
    () => ({
      WINNER: winners,
      MONITOR: monitors,
      KILL: kills,
    }),
    [winners, monitors, kills]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tabData[activeTab].filter(
      (e) =>
        !q ||
        e.mlb_id.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.sku.toLowerCase().includes(q)
    );
  }, [tabData, activeTab, search]);

  const tabs: {
    key: TabKey;
    label: string;
    count: number;
    color: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'WINNER',
      label: 'VENCEDORES',
      count: summary.winners,
      color: 'text-gs-green border-gs-green',
      icon: <Zap size={12} />,
    },
    {
      key: 'MONITOR',
      label: 'ATENÇÃO',
      count: summary.monitors,
      color: 'text-gs-yellow border-gs-yellow',
      icon: <AlertTriangle size={12} />,
    },
    {
      key: 'KILL',
      label: 'DESLIGAR',
      count: summary.kills,
      color: 'text-gs-red border-gs-red',
      icon: <XCircle size={12} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Target className="w-8 h-8 text-gs-green animate-pulse" />
          <p className="font-mono text-xs text-gs-green animate-pulse uppercase tracking-widest">
            Scanning ads portfolio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4 animate-fade-in relative z-10">
      {/* ── COCKPIT HEADER ── */}
      <div className="flex flex-col xl:flex-row items-stretch gap-4 shrink-0">
        {/* Left: Title */}
        <div className="flex flex-col justify-center min-w-[220px]">
          <h2 className="font-display font-black text-2xl tracking-wide uppercase text-gs-text flex items-center gap-2">
            <span className="text-gs-green">▸</span> ADS_RADAR
            <span className="text-[9px] font-mono text-gs-muted/40 border border-gs-muted/20 px-1.5 py-0.5">
              v1.0
            </span>
          </h2>
          <p className="font-mono text-[10px] text-gs-muted tracking-widest uppercase mt-1">
            INTELIGÊNCIA TÁTICA • PORTFÓLIO DE ANÚNCIOS ML
          </p>
        </div>

        {/* Center: Gauge */}
        <div className="flex-1 border border-gs-border bg-gs-panel px-6 py-3 flex items-center">
          <PortfolioGauge
            score={summary.portfolioScore}
            total={summary.total}
            winners={summary.winners}
            monitors={summary.monitors}
            kills={summary.kills}
          />
        </div>

        {/* Right: KPI Strip */}
        <div className="flex flex-col gap-0 border border-gs-border bg-gs-panel shrink-0">
          <div className="px-5 py-2 border-b border-gs-border/40 flex flex-col">
            <span className="text-[8px] font-mono text-gs-muted uppercase tracking-widest">
              Rev. potencial KILL
            </span>
            <span className="text-lg font-black font-mono text-gs-text">
              {fmt(summary.potentialRevenueLost)}
            </span>
            <span className="text-[8px] font-mono text-gs-muted/50 mt-0.5">
              verba em risco (30d)
            </span>
          </div>
          <div className="px-5 py-2 flex flex-col">
            <span className="text-[8px] font-mono text-gs-muted uppercase tracking-widest">
              MLBs analisados
            </span>
            <span className="text-lg font-black font-mono text-gs-text">{summary.total}</span>
            <span className="text-[8px] font-mono text-gs-muted/50 mt-0.5">
              todos os anúncios ativos
            </span>
          </div>
        </div>
      </div>

      {/* ── TACTICAL TABLE ── */}
      <div className="flex-1 flex flex-col border border-gs-border bg-gs-panel overflow-hidden">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-stretch border-b border-gs-border shrink-0">
          <div className="flex overflow-x-auto custom-scrollbar border-b sm:border-b-0 border-gs-border/30">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setExpandedId(null);
                }}
                className={`flex items-center whitespace-nowrap gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase border-r border-gs-border/50 transition-all ${
                  activeTab === tab.key
                    ? `bg-black/30 ${tab.color} border-b-2 -mb-[1px]`
                    : 'text-gs-muted hover:text-gs-text hover:bg-white/[0.02]'
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`font-black text-xs ${activeTab === tab.key ? '' : 'opacity-50'}`}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center px-4 py-2 sm:py-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por MLB / SKU / título..."
              className="w-full sm:max-w-xs bg-transparent border-0 border-b border-gs-border/30 text-gs-text font-mono text-xs py-1 placeholder-gs-muted/40 focus:outline-none focus:border-gs-green transition-colors"
            />
          </div>

          {/* Entry count */}
          <div className="hidden sm:flex items-center px-4 gap-1 text-gs-muted font-mono text-[9px]">
            <BarChart2 size={10} />
            {filtered.length} de {tabData[activeTab].length}
          </div>
        </div>

        {/* Horizontal scroll container for table */}
        <div className="flex-1 flex flex-col overflow-x-auto custom-scrollbar">
          <div className="min-w-[900px] flex-1 flex flex-col">
            {/* Table header */}
            <div
              className="grid items-center gap-2 px-3 py-1.5 border-b border-gs-border/30 bg-black/20 shrink-0"
              style={{
                gridTemplateColumns: '24px 130px 1fr 72px 40px 40px 40px 40px 90px 72px 26px',
              }}
            >
              {[
                '',
                'MLB ID',
                'TÍTULO',
                'SKU',
                '7D',
                '15D',
                '30D',
                'ONTEM',
                'VELOCIDADE',
                'AÇÃO',
                '',
              ].map((h, i) => (
                <span
                  key={i}
                  className="text-[8px] font-mono uppercase tracking-widest text-gs-muted/50 text-right first:text-left last:text-left"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Activity size={28} className="text-gs-muted/30" />
                  <span className="font-mono text-xs text-gs-muted/40 uppercase tracking-widest">
                    {search ? 'Nenhum resultado para a busca' : 'Nenhum MLB nesta categoria'}
                  </span>
                </div>
              ) : (
                filtered.map((entry) => (
                  <MlbRow
                    key={entry.mlb_id}
                    entry={entry}
                    isExpanded={expandedId === entry.mlb_id}
                    onToggle={() =>
                      setExpandedId(expandedId === entry.mlb_id ? null : entry.mlb_id)
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
