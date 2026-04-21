import { z } from 'zod';

// Coerce id to string (handles both number and string from database)
const idSchema = z.coerce.string();

// ─── Curva ABC ───────────────────────────────────────────────
export const curvaABCSchema = z.object({
  id: idSchema,
  titulo: z.string().nullable().optional(),
  curva_abc: z.string().nullable().optional(),
  receita_30d: z.coerce.number().nullable().optional().default(0),
  ciclo: z.string().nullable().optional(),
  tendencia: z.string().nullable().optional(),
  alerta: z.string().nullable().optional(),
});

export type CurvaABC = z.infer<typeof curvaABCSchema>;

// ─── Live Vendas ─────────────────────────────────────────────
export const liveVendasSchema = z.object({
  id: idSchema.optional(),
  data_venda: z.string().nullable().optional(),
  receita_total: z.coerce.number().nullable().optional().default(0),
});

export type LiveVenda = z.infer<typeof liveVendasSchema>;

// ─── Live Produtos ────────────────────────────────────────────
export const liveProdutosSchema = z.object({
  sku: z.string(),
  titulo: z.string().nullable().optional(),
  estoque: z.coerce.number().nullable().optional().default(0),
  price: z.coerce.number().nullable().optional().default(0),
  status: z.string().nullable().optional(),
});

export type LiveProduto = z.infer<typeof liveProdutosSchema>;

// ─── IA Alertas ──────────────────────────────────────────────
export const iaAlertaSchema = z.object({
  id: idSchema,
  sku: z.string(),
  tipo_alerta: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  severity: z.string().nullable().optional().default('BAIXO'),
  resolvido: z.coerce.boolean().nullable().optional().default(false),
  data_registro: z.string().nullable().optional(),
  data_resolucao: z.string().nullable().optional(),
  status: z.string().nullable().optional().default('PENDENTE'),
});

export type IAAlerta = z.infer<typeof iaAlertaSchema>;

export const ALERTA_RANK: Record<string, number> = {
  PENDENTE: 0,
  EM_ANALISE: 1,
  RESOLVIDO: 2,
  IGNORADO: 2,
};

// ─── Growth Plans ─────────────────────────────────────────────
export const iaGrowthPlanSchema = z.object({
  id: idSchema,
  sku: z.string(),
  acionavel: z.string().nullable().optional(),
  descricao_plano: z.string().nullable().optional(),
  status_intervencao: z.string().nullable().optional().default('PENDENTE'),
  created_at: z.string().nullable().optional(),
});

export type IAGrowthPlan = z.infer<typeof iaGrowthPlanSchema>;

export const GROWTH_RANK: Record<string, number> = {
  PENDENTE: 0,
  EM_ANDAMENTO: 1,
  APROVADO: 2,
  CONCLUÍDO: 3,
};

// ─── ML Insights ─────────────────────────────────────────────
export const mlInsightSchema = z.object({
  sku: z.string(),
  titulo: z.string().nullable().optional(),
  curva_abc: z.string().nullable().optional(),
  rupture_risk: z.coerce.number().nullable().optional().default(0),
  forecast_7d: z.coerce.number().nullable().optional().default(0),
  anomaly_score: z.coerce.number().nullable().optional().default(0),
  anomaly_severity: z.string().nullable().optional(),
  anomaly_type: z.string().nullable().optional(),
  anomaly_probability: z.coerce.number().nullable().optional().default(0),
  ml_cluster: z.string().nullable().optional(),
  abc_divergence: z.string().nullable().optional(),
  elasticity: z.coerce.number().nullable().optional().default(0),
  price_sensitivity: z.string().nullable().optional(),
  synced_at: z.string().nullable().optional(),
});

export type MLInsight = z.infer<typeof mlInsightSchema>;

// ─── ML Price Timeline ────────────────────────────────────────
export const mlPriceTimelineSchema = z.object({
  id: idSchema.optional(),
  sku: z.string(),
  evento_data: z.string().nullable().optional(),
  preco_anterior: z.coerce.number().nullable().optional().default(0),
  preco_novo: z.coerce.number().nullable().optional().default(0),
  delta_preco_pct: z.coerce.number().nullable().optional().default(0),
  volume_7d_antes: z.coerce.number().nullable().optional().default(0),
  volume_7d_depois: z.coerce.number().nullable().optional().default(0),
  delta_volume_pct: z.coerce.number().nullable().optional().default(0),
  absorcao_status: z.string().nullable().optional().default('INEFICAZ'),
  synced_at: z.string().nullable().optional(),
});

export type MLPriceTimeline = z.infer<typeof mlPriceTimelineSchema>;

// ─── Mensagens Equipe ─────────────────────────────────────────
export const mensagemSchema = z.object({
  id: idSchema,
  role: z.string(),
  content: z.string(),
  created_at: z.string().nullable().optional(),
});

export type Mensagem = z.infer<typeof mensagemSchema>;

// ─── Kanban Cards ─────────────────────────────────────────────
export const kanbanStatusSchema = z.enum([
  'backlog',
  'processing',
  'drafting',
  'pricing',
  'review',
  'live',
]);

export const kanbanCardSchema = z.object({
  id: idSchema,
  sku: z.string(),
  status: kanbanStatusSchema.default('backlog'),
  type: z.string().default('hybrid'),
  categoria: z.string().nullable().optional(),
  trigger_analysis: z.string().nullable().optional(),
  briefing_data: z
    .object({
      metadata: z
        .object({
          sku: z.string().nullable().optional(),
          categoria: z.string().nullable().optional(),
          pipeline_version: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      winning_formula: z
        .object({
          titulo_original: z.string().nullable().optional(),
          sugestao_titulo: z.string().nullable().optional(),
          descricao_template: z.string().nullable().optional(),
          preco_recomendado: z.coerce.number().nullable().optional(),
          preco_atual: z.coerce.number().nullable().optional(),
          elasticidade: z.coerce.number().nullable().optional(),
          elasticidade_class: z.string().nullable().optional(),
          tags_usadas: z.array(z.string()).nullable().optional().default([]),
          resultado_esperado: z
            .object({
              meta_receita: z.coerce.number().nullable().optional(),
              meta_unidades: z.coerce.number().nullable().optional(),
              prazo_avaliacao: z.string().nullable().optional(),
            })
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  manual_data: z
    .object({
      titulo: z.string().nullable().optional(),
      descricao: z.string().nullable().optional(),
      preco: z.coerce.number().nullable().optional(),
      tags: z.array(z.string()).nullable().optional().default([]),
    })
    .nullable()
    .optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type KanbanCard = z.infer<typeof kanbanCardSchema>;
export type KanbanStatus = z.infer<typeof kanbanStatusSchema>;
