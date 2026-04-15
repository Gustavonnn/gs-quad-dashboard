import { useMemo } from 'react';
import { useTerminalData } from './useTerminalData';
import type {
  AdsMLBEntry,
  RadarStatus,
  RadarAction,
  VelocityTrend,
} from '../types/terminal';

// ─── Rules Engine ─────────────────────────────────────────────────────────────

function computeVelocityTrend(s7d: number, s30d: number): VelocityTrend {
  const avg7 = s7d / 7;
  const avg30 = s30d / 30;
  if (avg30 === 0) return 'CAINDO';
  const ratio = avg7 / avg30;
  if (ratio >= 1.15) return 'ACELERANDO';
  if (ratio <= 0.75) return 'CAINDO';
  return 'ESTAVEL';
}

function computeScore(entry: Omit<AdsMLBEntry, 'score' | 'radar_status' | 'recommended_action'>): number {
  let score = 50;

  // Conversion rate bonus (0–20 pts)
  const cr = entry.conversion_rate;
  if (cr >= 5) score += 20;
  else if (cr >= 2) score += 12;
  else if (cr >= 0.5) score += 5;
  else score -= 10;

  // Velocity trend (0–20 pts)
  if (entry.velocity_trend === 'ACELERANDO') score += 20;
  else if (entry.velocity_trend === 'ESTAVEL') score += 5;
  else score -= 15;

  // Sales yesterday activity (0–15 pts)
  if (entry.sales_yesterday >= 3) score += 15;
  else if (entry.sales_yesterday >= 1) score += 7;
  else score -= 5;

  // Stock health (0–10 pts)
  if (entry.stock === 0) score -= 20;
  else if (entry.stock <= 5) score -= 8;
  else score += 10;

  // Revenue proxy (0–10 pts)
  const rev30 = entry.revenue_30d;
  if (rev30 >= 5000) score += 10;
  else if (rev30 >= 1000) score += 5;
  else if (rev30 === 0) score -= 15;

  // Active status check
  if (entry.status !== 'active') score -= 20;

  return Math.min(100, Math.max(0, score));
}

function classifyEntry(
  score: number,
  entry: Omit<AdsMLBEntry, 'score' | 'radar_status' | 'recommended_action'>
): { status: RadarStatus; action: RadarAction; killReasons: string[]; winSignals: string[]; monitorReasons: string[] } {
  const killReasons: string[] = [];
  const winSignals: string[] = [];
  const monitorReasons: string[] = [];

  // ─── KILL hard triggers ───────────────────────────────────────────────
  if (entry.stock === 0 && entry.status === 'active') {
    killReasons.push('Estoque ZERADO com anúncio ativo');
  }
  if (entry.sales_30d === 0 && entry.status === 'active') {
    killReasons.push('Zero vendas em 30 dias');
  }
  if (entry.visits >= 150 && entry.sales_7d === 0) {
    killReasons.push(`${entry.visits} visitas sem nenhuma conversão`);
  }
  if (entry.conversion_rate < 0.2 && entry.visits > 80) {
    killReasons.push(`Taxa de conversão crítica: ${entry.conversion_rate.toFixed(2)}%`);
  }

  // ─── WINNER signals ──────────────────────────────────────────────────
  if (entry.velocity_trend === 'ACELERANDO') {
    winSignals.push('Velocidade de vendas acelerando');
  }
  if (entry.sales_yesterday >= 3) {
    winSignals.push(`${entry.sales_yesterday} vendas ontem`);
  }
  if (entry.conversion_rate >= 3) {
    winSignals.push(`Conversão sólida: ${entry.conversion_rate.toFixed(1)}%`);
  }
  if (entry.avg_daily_7d > entry.avg_daily_30d * 1.2) {
    winSignals.push('7d avg acima da média 30d em +20%');
  }

  // ─── MONITOR signals ─────────────────────────────────────────────────
  if (entry.velocity_trend === 'CAINDO' && entry.sales_30d > 0) {
    monitorReasons.push('Velocidade caindo vs. média histórica');
  }
  if (entry.stock > 0 && entry.stock <= 5) {
    monitorReasons.push(`Estoque crítico: apenas ${entry.stock} unidades`);
  }
  if (entry.conversion_rate >= 0.2 && entry.conversion_rate < 1) {
    monitorReasons.push(`Conversão fraca: ${entry.conversion_rate.toFixed(2)}%`);
  }
  if (entry.sales_7d === 0 && entry.sales_30d > 0) {
    monitorReasons.push('Sem vendas nos últimos 7 dias');
  }

  // ─── Final classification ─────────────────────────────────────────────
  let status: RadarStatus;
  let action: RadarAction;

  if (killReasons.length >= 1 || score < 25) {
    status = 'KILL';
    action = entry.stock === 0 ? 'REABASTECER' : 'DESLIGAR';
  } else if (score >= 65 && winSignals.length >= 1) {
    status = 'WINNER';
    action = score >= 80 ? 'ESCALAR' : 'MANTER';
  } else {
    status = 'MONITOR';
    if (entry.stock <= 5) action = 'REABASTECER';
    else if (entry.conversion_rate < 1) action = 'AJUSTAR_PRECO';
    else action = 'PAUSAR';
  }

  return { status, action, killReasons, winSignals, monitorReasons };
}

// ─── Main computation ─────────────────────────────────────────────────────────

function buildEntry(mlb: {
  mlb_id: string;
  title: string;
  stock: number;
  price: number;
  status: string;
  visits: number;
  sales_7d: number;
  sales_15d: number;
  sales_30d: number;
  sales_yesterday: number;
  chartData: { date: string; revenue: number; sales: number }[];
}, sku: string, abc_class: string): AdsMLBEntry {
  const revenue_30d = mlb.price * mlb.sales_30d;
  const avg_daily_7d = mlb.sales_7d / 7;
  const avg_daily_30d = mlb.sales_30d / 30;
  const conversion_rate = mlb.visits > 0 ? (mlb.sales_7d / mlb.visits) * 100 : 0;
  const velocity_trend = computeVelocityTrend(mlb.sales_7d, mlb.sales_30d);

  // ── Ad performance estimates (CPC proxy = R$0.85/visit on ML Ads) ──
  const CPC_AVG = 0.85; // conservative avg CPC in BRL for ML Ads
  const estimated_spend = mlb.visits * CPC_AVG;
  const roas_est = estimated_spend > 0 ? revenue_30d / estimated_spend : 0;
  const acos_est = revenue_30d > 0 ? (estimated_spend / revenue_30d) * 100 : 0;
  const cost_per_sale_est = mlb.sales_30d > 0 ? estimated_spend / mlb.sales_30d : 0;
  const revenue_per_visit = mlb.visits > 0 ? revenue_30d / mlb.visits : 0;
  const sales_per_100_visits = mlb.visits > 0 ? (mlb.sales_30d / mlb.visits) * 100 : 0;

  const partial: Omit<AdsMLBEntry, 'score' | 'radar_status' | 'recommended_action'> = {
    mlb_id: mlb.mlb_id,
    sku,
    abc_class,
    title: mlb.title,
    price: mlb.price,
    stock: mlb.stock,
    status: mlb.status,
    visits: mlb.visits,
    sales_yesterday: mlb.sales_yesterday,
    sales_7d: mlb.sales_7d,
    sales_15d: mlb.sales_15d,
    sales_30d: mlb.sales_30d,
    chartData: mlb.chartData,
    revenue_30d,
    avg_daily_7d,
    avg_daily_30d,
    conversion_rate,
    velocity_trend,
    kill_reasons: [],
    win_signals: [],
    monitor_reasons: [],
    roas_est,
    acos_est,
    cost_per_sale_est,
    revenue_per_visit,
    sales_per_100_visits,
  };

  const score = computeScore(partial);
  const { status, action, killReasons, winSignals, monitorReasons } = classifyEntry(score, partial);

  return {
    ...partial,
    score,
    radar_status: status,
    recommended_action: action,
    kill_reasons: killReasons,
    win_signals: winSignals,
    monitor_reasons: monitorReasons,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface AdsRadarSummary {
  total: number;
  winners: number;
  monitors: number;
  kills: number;
  portfolioScore: number;       // 0–100 composite health
  potentialRevenueLost: number; // revenue_30d of KILL entries
}

export function useAdsRadar() {
  const { data, loading, error } = useTerminalData();

  const entries = useMemo<AdsMLBEntry[]>(() => {
    if (!data || data.length === 0) return [];

    const all: AdsMLBEntry[] = [];
    for (const sku of data) {
      for (const mlb of sku.mlbs) {
        // Only include active or paused (not closed/unknown with zero data)
        if (mlb.status === 'inactive' && mlb.sales_30d === 0) continue;
        all.push(buildEntry(mlb, sku.sku, sku.abc_class));
      }
    }
    // Sort by score desc
    return all.sort((a, b) => b.score - a.score);
  }, [data]);

  const winners = useMemo(() => entries.filter(e => e.radar_status === 'WINNER'), [entries]);
  const monitors = useMemo(() => entries.filter(e => e.radar_status === 'MONITOR'), [entries]);
  const kills = useMemo(() => entries.filter(e => e.radar_status === 'KILL'), [entries]);

  const summary = useMemo<AdsRadarSummary>(() => {
    const total = entries.length;
    const portfolioScore = total > 0
      ? Math.round(entries.reduce((acc, e) => acc + e.score, 0) / total)
      : 0;
    const potentialRevenueLost = kills.reduce((acc, e) => acc + e.revenue_30d, 0);
    return {
      total,
      winners: winners.length,
      monitors: monitors.length,
      kills: kills.length,
      portfolioScore,
      potentialRevenueLost,
    };
  }, [entries, winners, monitors, kills]);

  return { entries, winners, monitors, kills, summary, loading, error };
}
