export interface Venda {
  data_venda: string
  receita_total: number
}

export interface CurvaABCItem {
  id: string
  titulo: string
  curva_abc: 'A' | 'B' | 'C'
  receita_30d: number
  ciclo: string
  tendencia: 'crescendo' | 'caindo' | 'estavel' | 'declínio'
  alerta: string | null
}

export interface IAAlerta {
  id: string
  sku: string
  tipo_alerta: string
  descricao: string
  severity: 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO'
  resolvido: boolean
  data_registro: string
  status: string
  data_resolucao: string | null
}

export interface StockAlert {
  sku: string
  titulo: string
  estoque: number
  curva_abc: string
}


export interface IAGrowthPlan {
  id: string
  sku: string
  acionavel: string
  descricao_plano: string
  status_intervencao: 'APROVADO' | 'PENDENTE' | 'EM_ANALISE'
  created_at: string
}

export interface Mensagem {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface LiveMetrics {
  totalVendas: number
  alertasAtivos: number
  totalProdutos: number
  sparkData: number[]
}

export interface MLPriceTimeline {
  sku: string
  evento_data: string
  preco_anterior: number
  preco_novo: number
  delta_preco_pct: number
  volume_7d_antes: number
  volume_7d_depois: number
  delta_volume_pct: number
  absorcao_status: 'ABSORVIDO' | 'REJEITADO' | 'INEFICAZ'
}

export interface MLInsight {
  sku: string
  titulo: string
  curva_abc: string
  rupture_risk: number
  forecast_7d: number
  anomaly_score: number
  anomaly_severity: string
  anomaly_type: string
  anomaly_probability: number
  ml_cluster: string
  abc_divergence: string
  elasticity: number
  price_sensitivity: string
  synced_at: string
}

export interface MLPriceTimeline {
  id: string
  sku: string
  evento_data: string
  preco_anterior: number
  preco_novo: number
  delta_preco_pct: number
  volume_7d_antes: number
  volume_7d_depois: number
  delta_volume_pct: number
  absorcao_status: 'ABSORVIDO' | 'REJEITADO' | 'INEFICAZ'
  synced_at: string
}