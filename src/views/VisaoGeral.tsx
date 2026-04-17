import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLiveMetrics, useIAAlertas, useStockAlerts } from '@/hooks';
import { useAdsRadar } from '@/hooks/useAdsRadar';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Zap,
  Activity,
  BarChart2,
  Target,
  ArrowRight,
} from 'lucide-react';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtK(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

// ─── Pulse dot ───────────────────────────────────────────────────────────────

function PulseDot({ color = 'var(--color-gs-blue)' }: { color?: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 8, height: 8 }}>
      <span
        className="animate-ping absolute inline-flex w-full h-full rounded-full opacity-50"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full w-2 h-2"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string; // CSS color
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  loading?: boolean;
  barPct?: number;
}

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon,
  trend,
  trendLabel,
  loading,
  barPct,
}: KpiCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <div
      className="relative flex flex-col gap-3 p-4 sm:p-5 flex-1 overflow-hidden group"
      style={{
        background: 'var(--color-gs-panel)',
        border: '1px solid var(--color-gs-border)',
        borderRadius: '2px',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: accent, opacity: 0.6 }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[9px] tracking-[0.22em] uppercase"
          style={{ color: 'var(--color-gs-muted)' }}
        >
          {label}
        </span>
        <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>
      </div>

      {/* Value */}
      {loading ? (
        <div
          className="h-9 rounded-sm animate-pulse"
          style={{ background: 'var(--color-gs-border)', width: '60%' }}
        />
      ) : (
        <div
          className="font-heading font-black tracking-tight leading-none text-2xl sm:text-[28px]"
          style={{ color: 'var(--color-gs-text)' }}
        >
          {value}
        </div>
      )}

      {/* Progress bar */}
      {barPct !== undefined && (
        <div
          className="h-[2px] w-full"
          style={{ background: 'var(--color-gs-border)', borderRadius: 1 }}
        >
          <div
            className="h-full"
            style={{
              width: `${Math.min(barPct, 100)}%`,
              background: accent,
              borderRadius: 1,
              transition: 'width 1s ease',
            }}
          />
        </div>
      )}

      {/* Footer */}
      {(trendLabel || sub) && (
        <div className="flex items-center gap-1.5">
          {TrendIcon && (
            <TrendIcon
              size={10}
              style={{ color: trend === 'up' ? 'var(--color-gs-green)' : 'var(--color-gs-text)' }}
            />
          )}
          <span
            className="font-mono text-[9px]"
            style={{
              color:
                trend === 'up'
                  ? 'var(--color-gs-green)'
                  : trend === 'down'
                    ? 'var(--color-gs-text)'
                    : 'var(--color-gs-muted)',
            }}
          >
            {trendLabel || sub}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Terminal Live Feed ────────────────────────────────────────────────────────

interface LogLine {
  id: number;
  type: 'SYS' | 'INTEL' | 'OK' | 'WARN' | 'ADS' | 'SALE';
  msg: string;
}

const TYPE_COLOR: Record<LogLine['type'], string> = {
  SYS: '#666666',
  INTEL: '#3483FA',
  OK: '#3483FA',
  WARN: '#FF9500',
  ADS: '#00ADEF',
  SALE: '#3483FA',
};

function TerminalFeed({ lines }: { lines: LogLine[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: 'var(--color-gs-bg)',
        border: '1px solid var(--color-gs-border)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      {/* Terminal chrome */}
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{
          height: '32px',
          borderBottom: '1px solid var(--color-gs-border)',
          background: 'var(--color-gs-panel)',
        }}
      >
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#666666', opacity: 0.6 }} />
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--color-gs-yellow)', opacity: 0.6 }}
          />
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--color-gs-green)', opacity: 0.6 }}
          />
        </div>
        <span
          className="font-mono text-[9px] tracking-[0.2em] uppercase"
          style={{ color: 'var(--color-gs-muted)' }}
        >
          TERMINAL_LIVE_FEED
        </span>
        <PulseDot />
      </div>

      {/* Log lines */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 custom-scrollbar"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', lineHeight: 1.7 }}
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className="flex items-start gap-2"
            style={{ color: 'rgba(51,51,51,0.6)', animationFillMode: 'forwards' }}
          >
            <span className="font-bold shrink-0" style={{ color: TYPE_COLOR[line.type] }}>
              {line.type}:
            </span>
            <span>{line.msg}</span>
          </div>
        ))}
        {/* Blinking cursor */}
        <div className="flex items-center gap-1" style={{ color: 'var(--color-gs-green)' }}>
          <span>▸</span>
          <span
            className="animate-blink"
            style={{
              display: 'inline-block',
              width: 6,
              height: 11,
              background: 'var(--color-gs-green)',
              marginLeft: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-gs-chart-grid)" strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="i" hide />
        <Tooltip
          formatter={(v: number) => [fmt(v), 'Receita']}
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
          fill="url(#spark-fill)"
          dot={false}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

function AlertRow({ sku, tipo, severity }: { sku: string; tipo: string; severity: string }) {
  const color =
    severity === 'CRÍTICO' ? 'var(--color-gs-text)' : severity === 'ALTO' ? '#FF9500' : '#FFCC00';
  return (
    <div
      className="flex items-center gap-2 py-1.5 border-b"
      style={{ borderColor: 'var(--color-gs-border)', opacity: 0.9 }}
    >
      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
      <span className="font-mono text-[9px] font-bold shrink-0" style={{ color, minWidth: 36 }}>
        {severity.slice(0, 3)}
      </span>
      <span
        className="font-mono text-[10px] font-bold"
        style={{ color: 'var(--color-gs-text)', minWidth: 80 }}
      >
        {sku}
      </span>
      <span className="font-mono text-[9px] truncate" style={{ color: 'var(--color-gs-muted)' }}>
        {tipo}
      </span>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

const SEED_LINES: Omit<LogLine, 'id'>[] = [
  { type: 'SYS', msg: 'Conectado ao Supabase Realtime.' },
  { type: 'INTEL', msg: 'Carregando inferências de ML...' },
  { type: 'OK', msg: 'Pipeline DuckDB → Supabase: sincronizado.' },
  { type: 'SYS', msg: 'Aguardando novos eventos...' },
];

export function VisaoGeral() {
  const { data: metricsData, isLoading: metricsLoading } = useLiveMetrics();
  const { data: alertasRaw, isLoading: alertasLoading } = useIAAlertas();
  const { data: stockAlertsRaw } = useStockAlerts();
  const { summary: adsSummary } = useAdsRadar();

  const metrics = useMemo(
    () =>
      metricsData ?? {
        totalVendas: 0,
        alertasAtivos: 0,
        totalProdutos: 0,
        sparkData: [] as number[],
      },
    [metricsData]
  );

  const alertas = useMemo(() => alertasRaw ?? [], [alertasRaw]);
  const stockAlerts = useMemo(() => stockAlertsRaw ?? [], [stockAlertsRaw]);

  const logIdRef = useRef(SEED_LINES.length);

  const [logLines, setLogLines] = useState<LogLine[]>(() =>
    SEED_LINES.map((l, idx) => ({ ...l, id: idx + 1 }))
  );

  // Live feed simulator: inject events about ads/sales (no timestamps)
  const pushLine = useCallback((line: Omit<LogLine, 'id'>) => {
    setLogLines((prev) => {
      const next = [...prev, { ...line, id: ++logIdRef.current }];
      return next.length > 40 ? next.slice(-40) : next;
    });
  }, []);

  useEffect(() => {
    if (!metricsLoading && metrics.totalVendas > 0) {
      pushLine({ type: 'SALE', msg: `Receita atualizada → ${fmt(metrics.totalVendas)}` });
    }
  }, [metrics, metricsLoading, pushLine]);

  useEffect(() => {
    if (!alertasLoading && alertas.length > 0) {
      pushLine({ type: 'WARN', msg: `${alertas.length} alertas ativos detectados.` });
    }
  }, [alertas, alertasLoading, pushLine]);

  useEffect(() => {
    if (adsSummary.kills > 0) {
      pushLine({ type: 'ADS', msg: `ADS_RADAR: ${adsSummary.kills} anúncios para desligar.` });
    }
    if (adsSummary.winners > 0) {
      pushLine({ type: 'ADS', msg: `ADS_RADAR: ${adsSummary.winners} anúncios vencedores.` });
    }
  }, [adsSummary, pushLine]);

  useEffect(() => {
    if (stockAlerts.length > 0) {
      pushLine({ type: 'WARN', msg: `${stockAlerts.length} SKUs com estoque zerado.` });
    }
  }, [stockAlerts, pushLine]);

  const sparkData = metrics?.sparkData ?? [];
  const totalAlerts = alertas.length;
  const sparkTrend: 'up' | 'down' | 'neutral' =
    sparkData.length >= 2
      ? sparkData[sparkData.length - 1] > sparkData[0]
        ? 'up'
        : 'down'
      : 'neutral';

  const criticalAlerts = alertas.filter((a) => a.severity === 'CRÍTICO' || a.severity === 'ALTO');

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* ── PAGE HEADER ── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PulseDot />
            <span
              className="font-mono text-[9px] tracking-[0.25em] uppercase"
              style={{ color: 'var(--color-gs-green)' }}
            >
              OPERAÇÃO ATIVA
            </span>
          </div>
          <h2
            className="font-heading font-black tracking-wide uppercase"
            style={{ fontSize: '22px', color: 'var(--color-gs-text)', lineHeight: 1 }}
          >
            WAR_ROOM <span style={{ color: 'var(--color-gs-green)' }}>INTEL</span>
          </h2>
          <p
            className="font-mono text-[9px] tracking-[0.2em] uppercase mt-1"
            style={{ color: 'var(--color-gs-muted)' }}
          >
            GS-QUAD · INTEL OPS · ARMAZENACORP
          </p>
        </div>

        {/* Quick stats strip */}
        <div
          className="hidden lg:flex items-center gap-0 border"
          style={{
            borderColor: 'var(--color-gs-border)',
            background: 'var(--color-gs-panel)',
            borderRadius: '2px',
          }}
        >
          {[
            { v: fmtK(metrics?.totalProdutos ?? 0), l: 'produtos' },
            { v: String(adsSummary.total), l: 'anúncios' },
            { v: String(adsSummary.winners), l: 'winners' },
            { v: String(stockAlerts.length), l: 'sem estoque' },
          ].map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center px-5 py-2"
              style={{
                borderRight: i < 3 ? '1px solid var(--color-gs-border)' : 'none',
              }}
            >
              <span
                className="font-heading font-black text-base"
                style={{ color: 'var(--color-gs-text)' }}
              >
                {s.v}
              </span>
              <span
                className="font-mono text-[8px] uppercase tracking-widest"
                style={{ color: 'var(--color-gs-muted)' }}
              >
                {s.l}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Receita do Dia"
          value={fmt(metrics?.totalVendas ?? 0)}
          accent="var(--color-gs-green)"
          icon={<TrendingUp size={14} />}
          trend={sparkTrend}
          trendLabel={
            sparkTrend === 'up'
              ? 'tendência de alta'
              : sparkTrend === 'down'
                ? 'tendência de queda'
                : 'estável'
          }
          loading={metricsLoading}
          barPct={82}
        />
        <KpiCard
          label="Alertas Ativos"
          value={String(totalAlerts).padStart(2, '0')}
          accent={totalAlerts > 0 ? 'var(--color-gs-yellow)' : 'var(--color-gs-green)'}
          icon={<AlertTriangle size={14} />}
          trend={totalAlerts > 0 ? 'down' : 'up'}
          trendLabel={
            totalAlerts > 0 ? `${criticalAlerts.length} críticos / altos` : 'sem alertas críticos'
          }
          loading={alertasLoading}
          barPct={Math.min((totalAlerts / 20) * 100, 100)}
        />
        <KpiCard
          label="Portfólio Ads"
          value={String(adsSummary.portfolioScore)}
          sub="/100 score"
          accent={
            adsSummary.portfolioScore >= 65
              ? 'var(--color-gs-green)'
              : adsSummary.portfolioScore >= 40
                ? 'var(--color-gs-yellow)'
                : 'var(--color-gs-text)'
          }
          icon={<Target size={14} />}
          trendLabel={`${adsSummary.winners}W · ${adsSummary.monitors}M · ${adsSummary.kills}K`}
          barPct={adsSummary.portfolioScore}
        />
        <KpiCard
          label="Sem Estoque"
          value={String(stockAlerts.length).padStart(2, '0')}
          accent={stockAlerts.length > 0 ? 'var(--color-gs-text)' : 'var(--color-gs-green)'}
          icon={<Package size={14} />}
          trend={stockAlerts.length > 0 ? 'down' : 'neutral'}
          trendLabel={stockAlerts.length > 0 ? 'SKUs sem estoque ativo' : 'estoque OK'}
          barPct={Math.min((stockAlerts.length / 10) * 100, 100)}
        />
      </div>

      {/* ── MAIN AREA: Chart + Alerts + Terminal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" style={{ minHeight: '280px' }}>
        {/* Sparkline — 2 cols */}
        <div
          className="lg:col-span-2 flex flex-col min-h-[220px]"
          style={{
            background: 'var(--color-gs-panel)',
            border: '1px solid var(--color-gs-border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <BarChart2 size={12} style={{ color: 'var(--color-gs-green)' }} />
              <span
                className="font-mono text-[9px] tracking-[0.22em] uppercase font-bold"
                style={{ color: 'var(--color-gs-muted)' }}
              >
                RECEITA 7 DIAS
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <PulseDot />
              <span
                className="font-mono text-[8px] uppercase tracking-widest"
                style={{ color: 'var(--color-gs-green)' }}
              >
                LIVE
              </span>
            </div>
          </div>
          <div className="flex-1 px-1 pb-3">
            <Sparkline data={sparkData} color="var(--color-gs-green)" />
          </div>
        </div>

        {/* Terminal Feed — 1 col */}
        <div className="flex flex-col min-h-[260px] lg:min-h-0">
          <TerminalFeed lines={logLines} />
        </div>
      </div>

      {/* ── BOTTOM ROW: Alerts + ADS Radar summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Critical Alerts */}
        <div
          className="flex flex-col"
          style={{
            background: 'var(--color-gs-panel)',
            border: '1px solid var(--color-gs-border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--color-gs-border)' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={11} style={{ color: 'var(--color-gs-yellow)' }} />
              <span
                className="font-mono text-[9px] tracking-[0.2em] uppercase font-bold"
                style={{ color: 'var(--color-gs-muted)' }}
              >
                ALERTAS RECENTES
              </span>
            </div>
            <span
              className="font-mono text-[8px] px-2 py-0.5"
              style={{
                border: '1px solid var(--color-gs-border)',
                color: 'var(--color-gs-muted)',
                borderRadius: 1,
              }}
            >
              {alertas.length} total
            </span>
          </div>
          <div
            className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar"
            style={{ maxHeight: '200px' }}
          >
            {alertasLoading ? (
              <div className="flex flex-col gap-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-5 animate-pulse rounded-sm"
                    style={{ background: 'var(--color-gs-border)', width: `${60 + i * 15}%` }}
                  />
                ))}
              </div>
            ) : alertas.length === 0 ? (
              <div className="flex items-center gap-2 py-4">
                <Activity size={12} style={{ color: 'var(--color-gs-green)' }} />
                <span
                  className="font-mono text-[9px] tracking-widest uppercase"
                  style={{ color: 'var(--color-gs-muted)' }}
                >
                  Sem alertas ativos
                </span>
              </div>
            ) : (
              alertas
                .slice(0, 8)
                .map((a) => (
                  <AlertRow key={a.id} sku={a.sku} tipo={a.tipo_alerta} severity={a.severity} />
                ))
            )}
          </div>
        </div>

        {/* ADS Radar mini summary */}
        <div
          className="flex flex-col"
          style={{
            background: 'var(--color-gs-panel)',
            border: '1px solid var(--color-gs-border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--color-gs-border)' }}
          >
            <div className="flex items-center gap-2">
              <Zap size={11} style={{ color: 'var(--color-gs-green)' }} />
              <span
                className="font-mono text-[9px] tracking-[0.2em] uppercase font-bold"
                style={{ color: 'var(--color-gs-muted)' }}
              >
                ADS_RADAR SNAPSHOT
              </span>
            </div>
            <a
              href="/ads-radar"
              className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest transition-colors"
              style={{ color: 'var(--color-gs-green)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              VER TUDO <ArrowRight size={9} />
            </a>
          </div>

          <div
            className="flex-1 grid grid-cols-3 divide-x"
            style={{ borderColor: 'var(--color-gs-border)' }}
          >
            {[
              {
                label: 'WINNERS',
                val: adsSummary.winners,
                color: 'var(--color-gs-green)',
                sub: 'escalar',
              },
              {
                label: 'ATENÇÃO',
                val: adsSummary.monitors,
                color: 'var(--color-gs-yellow)',
                sub: 'monitorar',
              },
              {
                label: 'DESLIGAR',
                val: adsSummary.kills,
                color: 'var(--color-gs-text)',
                sub: 'pausar',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center gap-1 py-5"
                style={{ borderColor: 'var(--color-gs-border)' }}
              >
                <span className="font-heading font-black text-2xl" style={{ color: item.color }}>
                  {item.val}
                </span>
                <span
                  className="font-mono text-[8px] tracking-[0.18em] uppercase"
                  style={{ color: 'var(--color-gs-muted)' }}
                >
                  {item.label}
                </span>
                <span className="font-mono text-[7px]" style={{ color: item.color, opacity: 0.6 }}>
                  → {item.sub}
                </span>
              </div>
            ))}
          </div>

          {/* Score bar */}
          <div
            className="px-4 pb-4 pt-2 border-t"
            style={{ borderColor: 'var(--color-gs-border)' }}
          >
            <div className="flex justify-between mb-1.5">
              <span
                className="font-mono text-[8px] uppercase tracking-widest"
                style={{ color: 'var(--color-gs-muted)' }}
              >
                PORTFOLIO SCORE
              </span>
              <span
                className="font-mono text-[9px] font-bold"
                style={{
                  color:
                    adsSummary.portfolioScore >= 65
                      ? 'var(--color-gs-green)'
                      : 'var(--color-gs-yellow)',
                }}
              >
                {adsSummary.portfolioScore}/100
              </span>
            </div>
            <div
              className="h-[3px] w-full"
              style={{ background: 'var(--color-gs-border)', borderRadius: 1 }}
            >
              <div
                className="h-full"
                style={{
                  width: `${adsSummary.portfolioScore}%`,
                  background:
                    adsSummary.portfolioScore >= 65
                      ? 'var(--color-gs-green)'
                      : adsSummary.portfolioScore >= 40
                        ? 'var(--color-gs-yellow)'
                        : 'var(--color-gs-text)',
                  borderRadius: 1,
                  transition: 'width 1s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
