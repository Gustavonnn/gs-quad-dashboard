import { z } from 'zod'

// Coerce id to string (handles both number and string from database)
const idSchema = z.coerce.string()

// ─── Curva ABC ───────────────────────────────────────────────
export const curvaABCSchema = z.object({
  id: idSchema,
  titulo: z.string(),
  curva_abc: z.enum(['A', 'B', 'C']),
  receita_30d: z.number(),
  ciclo: z.string(),
  tendencia: z.enum(['crescendo', 'caindo', 'estavel', 'declínio']),
  alerta: z.string().nullable(),
})

export type CurvaABC = z.infer<typeof curvaABCSchema>

// ─── Live Vendas ─────────────────────────────────────────────
export const liveVendasSchema = z.object({
  id: idSchema.optional(),
  data_venda: z.string(),
  receita_total: z.number(),
})

export type LiveVenda = z.infer<typeof liveVendasSchema>

// ─── Live Produtos ────────────────────────────────────────────
export const liveProdutosSchema = z.object({
  sku: z.string(),
  titulo: z.string().optional(),
  estoque: z.number(),
  price: z.number().optional(),
  status: z.string().optional(),
})

export type LiveProduto = z.infer<typeof liveProdutosSchema>

// ─── IA Alertas ──────────────────────────────────────────────
export const alertaSeveritySchema = z.enum(['CRÍTICO', 'ALTO', 'MÉDIO', 'BAIXO'])
export const alertaStatusSchema = z.enum(['PENDENTE', 'EM_ANALISE', 'RESOLVIDO', 'IGNORADO'])

export const iaAlertaSchema = z.object({
  id: idSchema,
  sku: z.string(),
  tipo_alerta: z.string(),
  descricao: z.string(),
  severity: alertaSeveritySchema,
  resolvido: z.boolean(),
  data_registro: z.string(),
  status: z.string(),
  data_resolucao: z.string().nullable(),
  // rank para hierarquia: PENDENTE(0) < EM_ANALISE(1) < RESOLVIDO(2) = IGNORADO(2)
})

export type IAAlerta = z.infer<typeof iaAlertaSchema>

export const ALERTA_RANK: Record<string, number> = {
  PENDENTE: 0,
  EM_ANALISE: 1,
  RESOLVIDO: 2,
  IGNORADO: 2,
}

// ─── Growth Plans ─────────────────────────────────────────────
export const growthStatusSchema = z.enum(['PENDENTE', 'EM_ANDAMENTO', 'APROVADO', 'CONCLUÍDO'])

export const iaGrowthPlanSchema = z.object({
  id: idSchema,
  sku: z.string(),
  acionavel: z.string(),
  descricao_plano: z.string(),
  status_intervencao: z.string(),
  created_at: z.string(),
})

export type IAGrowthPlan = z.infer<typeof iaGrowthPlanSchema>

export const GROWTH_RANK: Record<string, number> = {
  PENDENTE: 0,
  EM_ANDAMENTO: 1,
  APROVADO: 2,
  CONCLUÍDO: 3,
}

// ─── ML Insights ─────────────────────────────────────────────
export const mlInsightSchema = z.object({
  sku: z.string(),
  titulo: z.string(),
  curva_abc: z.string(),
  rupture_risk: z.number(),
  forecast_7d: z.number(),
  anomaly_score: z.number(),
  anomaly_severity: z.string(),
  anomaly_type: z.string(),
  anomaly_probability: z.number(),
  ml_cluster: z.string(),
  abc_divergence: z.string(),
  elasticity: z.number(),
  price_sensitivity: z.string(),
  synced_at: z.string(),
})

export type MLInsight = z.infer<typeof mlInsightSchema>

// ─── ML Price Timeline ────────────────────────────────────────
export const absorcaoStatusSchema = z.enum(['ABSORVIDO', 'REJEITADO', 'INEFICAZ'])

export const mlPriceTimelineSchema = z.object({
  id: idSchema.optional(),
  sku: z.string(),
  evento_data: z.string(),
  preco_anterior: z.number(),
  preco_novo: z.number(),
  delta_preco_pct: z.number(),
  volume_7d_antes: z.number(),
  volume_7d_depois: z.number(),
  delta_volume_pct: z.number(),
  absorcao_status: absorcaoStatusSchema,
  synced_at: z.string().optional(),
})

export type MLPriceTimeline = z.infer<typeof mlPriceTimelineSchema>

// ─── Mensagens Equipe ─────────────────────────────────────────
export const mensagemSchema = z.object({
  id: idSchema,
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  created_at: z.string(),
})

export type Mensagem = z.infer<typeof mensagemSchema>

// ─── Kanban Cards ─────────────────────────────────────────────
export const kanbanStatusSchema = z.enum([
  'backlog', 'processing', 'drafting', 'pricing', 'review', 'live',
])

export const kanbanCardTypeSchema = z.enum(['hybrid', 'manual'])

export const briefingDataSchema = z.object({
  winning_formula: z.object({
    titulo_original: z.string().nullable(),
    sugestao_titulo: z.string(),
    descricao_template: z.string(),
    preco_recomendado: z.number(),
    preco_atual: z.number().nullable(),
    elasticidade: z.number().nullable(),
    elasticidade_class: z.string().nullable(),
    metodologia: z.string(),
    tags_usadas: z.array(z.string()),
    fotos_sugestoes: z.array(z.string()),
    resultado_esperado: z.object({
      meta_receita: z.number(),
      meta_unidades: z.string(),
      prazo_avaliacao: z.string(),
    }),
  }),
  classificacao: z.string(),
  contexto_mercado: z.string(),
  fonte_consultadas: z.object({
    playbook_matches: z.number(),
    similar_skus: z.number(),
    tem_elasticidade: z.boolean(),
  }),
  metadata: z.object({
    sku: z.string(),
    categoria: z.string().nullable(),
    generated_at: z.string(),
    pipeline_version: z.string(),
  }),
})

export const kanbanCardSchema = z.object({
  id: idSchema,
  sku: z.string(),
  status: kanbanStatusSchema,
  type: kanbanCardTypeSchema,
  categoria: z.string().nullable(),
  briefing_data: briefingDataSchema.nullable(),
  manual_data: z.record(z.string(), z.any()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().nullable(),
  processed_at: z.string().nullable(),
  trigger_analysis: z.boolean().optional(),
  analysis_requested_at: z.string().nullable(),
})

export type KanbanCard = z.infer<typeof kanbanCardSchema>
export type KanbanStatus = z.infer<typeof kanbanStatusSchema>
