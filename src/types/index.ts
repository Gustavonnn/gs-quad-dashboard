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