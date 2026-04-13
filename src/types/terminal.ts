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
}

export interface TerminalSkuItem {
  sku: string;
  sku_master?: string;      // SKU mestre deste MLB (maior receita)
  is_master?: boolean;       // TRUE se este SKU é o mestre do MLB
  title: string;
  abc_class: 'A' | 'B' | 'C' | string;
  total_revenue_30d: number;
  total_sales_units: number;
  global_stock: number;
  trend: 'UP' | 'DOWN' | 'STABLE' | string;
  mlbs: MlbItem[];
  chartData: { date: string; revenue: number; sales: number }[];
}
