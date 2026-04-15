export interface MlbItem {
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
}

export interface TerminalSkuItem {
  sku: string;
  sku_master?: string;      // SKU mestre deste MLB (maior receita)
  is_master?: boolean;       // TRUE se este SKU é o mestre do MLB
  title: string;
  abc_class: 'A' | 'B' | 'C' | string;
  total_revenue_30d: number;
  total_sales_units: number;
  sales_7d: number;
  sales_15d: number;
  sales_30d: number;
  sales_yesterday: number;
  global_stock: number;
  trend: 'UP' | 'DOWN' | 'STABLE' | string;
  mlbs: MlbItem[];
  chartData: { date: string; revenue: number; sales: number }[];
}

// ─── ADS_RADAR Types ──────────────────────────────────────────────────────────

export type RadarStatus = 'WINNER' | 'MONITOR' | 'KILL';

export type VelocityTrend = 'ACELERANDO' | 'ESTAVEL' | 'CAINDO';

export type RadarAction =
  | 'ESCALAR'
  | 'MANTER'
  | 'AJUSTAR_PRECO'
  | 'REABASTECER'
  | 'PAUSAR'
  | 'DESLIGAR';

export interface AdsMLBEntry {
  // --- raw fields ---
  mlb_id: string;
  sku: string;
  abc_class: string;
  title: string;
  price: number;
  stock: number;
  status: string;
  visits: number;
  sales_yesterday: number;
  sales_7d: number;
  sales_15d: number;
  sales_30d: number;
  chartData: { date: string; revenue: number; sales: number }[];

  // --- computed ---
  revenue_30d: number;           // price * sales_30d proxy
  avg_daily_7d: number;          // sales_7d / 7
  avg_daily_30d: number;         // sales_30d / 30
  conversion_rate: number;       // (sales_7d / Math.max(visits, 1)) * 100
  velocity_trend: VelocityTrend;
  score: number;                 // 0–100 composite
  radar_status: RadarStatus;
  recommended_action: RadarAction;
  kill_reasons: string[];
  win_signals: string[];
  monitor_reasons: string[];

  // --- ad performance estimates (no spend data — proxy via visits CPC avg) ---
  roas_est: number;              // revenue_30d / (visits * 0.85)
  acos_est: number;              // (visits * 0.85) / revenue_30d * 100
  cost_per_sale_est: number;     // (visits * 0.85) / max(sales_30d, 1)
  revenue_per_visit: number;     // revenue_30d / max(visits, 1)
  sales_per_100_visits: number;  // (sales_30d / max(visits, 1)) * 100
}
