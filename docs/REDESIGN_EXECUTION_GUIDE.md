# GS-QUAD Dashboard - Redesign Execution Guide

Documento para iniciar uma nova conversa/agente sem perder contexto. O objetivo e
reformular 100% da interface do dashboard, mantendo dados, regras, fluxos e
funcionalidades atuais.

> Nota de encoding: este documento foi escrito em ASCII de proposito. O projeto
> tem varios textos quebrados por encoding, entao a correcao de copy/acentos deve
> ser feita de forma controlada durante a fase de UI.

---

## Prompt pronto para nova conversa

Copie e cole o bloco abaixo em uma nova conversa:

```text
Voce esta trabalhando no projeto GS-QUAD Dashboard em:
c:\Users\clayt\competitors\gs-quad-dashboard

Objetivo principal:
Reformular completamente o dashboard, deixando a interface muito mais avancada,
moderna, bonita, animada, responsiva e profissional, sem perder nenhum dado,
nenhuma funcionalidade e nenhum fluxo operacional existente.

Contexto do produto:
O GS-QUAD e um dashboard operacional de Mercado Livre para ARMAZENACORP. Ele usa
React/Vite no front, Supabase como backend, DuckDB/N8N como pipeline de dados e
modulos para vendas, estoque, anuncios, alertas, ML, precificacao, busca,
sincronizacao e criacao de anuncios via Kanban.

Stack atual:
- Vite 6
- React 18
- React Router
- Supabase JS
- TanStack React Query
- Zustand
- Tailwind CSS 4
- Radix UI
- Framer Motion
- Recharts
- TanStack Table
- @dnd-kit
- Sonner
- Zod
- Lucide React

Regras obrigatorias:
1. Nao apagar dados, nao mudar schema do banco e nao fazer migracoes destrutivas.
2. Antes de mudar uma tela, entender quais hooks/tabelas ela usa.
3. Preservar todos os fluxos atuais: alertas, status, Kanban, notas, busca,
   sync, Terminal SKU/MLB, filtros, links externos e tema.
4. Corrigir bugs de contrato com Supabase antes ou junto do redesign.
5. Usar componentes reutilizaveis para padronizar UI.
6. Fazer mudancas incrementais, rodando build/testes a cada bloco.
7. Corrigir textos quebrados por encoding, mas com cuidado para nao gerar mais
   caracteres corrompidos.
8. Manter a identidade GS-QUAD: operacional, denso, tecnico, pt-BR, com labels
   tipo terminal/ops, mas mais refinado e legivel.
9. Nao transformar em landing page. A primeira tela deve ser o dashboard real.
10. Priorizar leitura rapida, diagnostico e acao.

Achados tecnicos importantes:
- Build passa com variaveis do .env.example.
- Testes unitarios atuais passam.
- Lint falha com muitos any, refs em useRealtimeTable e DataExplorer.
- O clone novo nao tinha .env nem node_modules; npm install foi rodado.
- Supabase real tem dados nas seguintes tabelas:
  - live_vendas: 2573 registros
  - live_produtos: 811 registros
  - curva_abc: 528 registros
  - ia_alertas_operacionais: 284 registros
  - ia_growth_plans: 153 registros
  - ml_insights: 850 registros
  - ml_price_timeline: 283 registros
  - sku_user_notes: 3 registros
  - ia_alertas: 0 registros
  - ia_kanban_cards: 0 registros
  - mlb_notes: 0 registros
  - gs_anuncios: nao existe

Contratos de dados que precisam ser corrigidos:
- Varias telas consultam ia_alertas, mas a tabela viva e ia_alertas_operacionais.
- ia_alertas_operacionais usa severidade, nao severity.
- live_vendas usa receita_total, nao receita.
- live_produtos usa visitas_total e vendas_total, nao visits/conversao.
- FridayOrb consulta gs_anuncios, mas essa tabela nao existe.
- OperationKPIBar precisa ser corrigido para schema real.
- ActivityFeed ainda e mockado.

Rotas atuais:
- / -> VisaoGeral / WAR_ROOM
- /hub -> OperationHub
- /terminal -> TerminalDB
- /monitor -> Monitor
- /growth -> GrowthPlan
- /ml -> MLIntel
- /price -> PriceTimeline
- /explorer -> DataExplorer
- /activity -> ActivityFeed
- /sync -> SyncControl
- /search -> GlobalSearch
- /adfactory -> AdFactory
- /ads-radar -> AdsRadar
- /conversion -> ConversionRadar
- /stock-ads -> StockAdsMatrix
- /hidden-potential -> HiddenPotential
- /settings -> Settings

Plano recomendado:
Fase 0: criar branch e blindar dados.
Fase 1: corrigir contrato Supabase + bugs evidentes.
Fase 2: criar design foundation e componentes base.
Fase 3: redesenhar primeiro OperationHub e VisaoGeral.
Fase 4: redesenhar TerminalDB.
Fase 5: redesenhar AdsRadar, ConversionRadar, StockAdsMatrix e HiddenPotential.
Fase 6: redesenhar Monitor, GrowthPlan, MLIntel e PriceTimeline.
Fase 7: redesenhar DataExplorer, GlobalSearch, SyncControl, AdFactory e Settings.
Fase 8: animacoes, polish, responsividade, testes E2E e performance.

Antes de editar:
- Leia README.md, package.json, src/app/routes.tsx, src/components/Layout.tsx,
  src/lib/supabase.ts, src/lib/env.ts, src/lib/schemas.ts e os hooks em src/hooks.
- Leia docs/REDESIGN_EXECUTION_GUIDE.md se existir.
- Rode git status.
- Nao reverta mudancas do usuario.

Comandos de validacao:
- npm run test:run
- npm run build
- npm run lint
- npm run test:e2e, depois que a UI estiver estavel

Meta final:
Um dashboard GS-QUAD visualmente excelente, responsivo, rapido, com graficos mais
ricos, animacoes discretas e uteis, dados reais do Supabase funcionando, modulos
atuais preservados e fluxo operacional pronto para uso diario.
```

---

## Estado atual do projeto

### Stack

- Vite 6 + React 18.
- React Router com lazy routes.
- React Query para server state.
- Zustand para estado local de UI.
- Supabase JS para dados.
- Tailwind CSS 4 com CSS variables.
- Radix UI para primitives.
- Framer Motion para transicoes.
- Recharts para graficos.
- TanStack Table para DataExplorer.
- @dnd-kit para Kanban.
- Zod para validacao.
- Sonner para toasts.
- Lucide React para icones.

### Estrutura principal

```text
src/
  app/
    routes.tsx
    RootLayout.tsx
    QueryProvider.tsx
    ThemeProvider.tsx
  components/
    Layout.tsx
    CommandPalette.tsx
    SalesTicker.tsx
    OperationKPIBar.tsx
    Kanban*
    ui/*
  hooks/
    useTableData.ts
    useTerminalData.ts
    useAdsRadar.ts
    useConversionMetrics.ts
    useKanbanBoard.ts
    useMLBNotes.ts
    useRealtimeTable.ts
    useSupabaseMutation.ts
  lib/
    env.ts
    supabase.ts
    schemas.ts
    utils.ts
  stores/
    uiStore.ts
    voiceStore.ts
  views/
    *.tsx
```

---

## Modulos e funcoes atuais

### WAR_ROOM / VisaoGeral

Funcao:
- Visao executiva inicial.
- Receita do dia.
- Alertas ativos.
- Score de portfolio Ads.
- SKUs sem estoque.
- Terminal feed simulado.
- Ticker global de vendas.

Dependencias:
- `useLiveMetrics`
- `useIAAlertas`
- `useStockAlerts`
- `useAdsRadar`
- `OperationKPIBar`
- `SalesTicker`
- `Sparkline`

Riscos:
- `useIAAlertas` consulta `ia_alertas`, que esta vazia.
- `OperationKPIBar` usa colunas erradas em alguns pontos.
- Muitos textos com encoding quebrado.

### OP_HUB / OperationHub

Funcao:
- Central de comando operacional.
- Produtos por performance.
- Alertas operacionais reais.
- Receita por periodo e variacoes.
- Navegacao para Terminal.

Ponto positivo:
- Ja usa `ia_alertas_operacionais` e `receita_total`, mais alinhado ao Supabase real.

### TERMINAL_DB

Funcao:
- Nucleo mais importante do produto.
- Monta arvore SKU -> MLBs.
- Mostra vendas 7/15/30 dias, estoque, preco, status, forecast, comparativo,
  stockout markers, diagnostico causa/efeito e notas por SKU.

Dependencias:
- `useTerminalData`
- `sku_user_notes`
- `curva_abc`
- `live_produtos`
- `live_vendas`
- `ml_insights`

Riscos:
- Hook grande e centralizado.
- Precisa preservar deep links `?sku=` e `?mlb=`.
- Redesign deve melhorar layout sem mexer na logica de dados inicialmente.

### MONITOR

Funcao:
- Alertas de IA e ruptura de estoque.
- Avanco de status de alerta.

Riscos:
- Usa `useIAAlertas`, que hoje consulta `ia_alertas` vazia.
- Precisa migrar para `ia_alertas_operacionais`.
- Mapeamento `severity` -> `severidade`.

### GROWTH_PLAN

Funcao:
- Lista planos taticos gerados.
- Permite avancar status.

Tabela:
- `ia_growth_plans`

Status:
- PENDENTE
- EM_ANDAMENTO
- APROVADO
- CONCLUIDO

### MLIntel

Funcao:
- Insights de ML.
- Risco de ruptura.
- Anomalias.
- Clusters/divergencias.
- Elasticidade.

Tabela:
- `ml_insights`

Risco:
- Pode ter filtros que nao mostram nada se thresholds estiverem muito restritos.

### PRICE_REACTION

Funcao:
- Timeline de mudancas de preco.
- Reacao de volume antes/depois.
- Status de absorcao.

Tabela:
- `ml_price_timeline`

### ADS_RADAR

Funcao:
- Classifica MLBs em WINNER, MONITOR, KILL.
- Usa score computado com vendas, visitas, estoque, conversao e proxies de Ads.

Dependencia:
- `useAdsRadar`, que depende de `useTerminalData`.

Risco:
- Performance pode ficar pesada porque usa arvore do Terminal.
- Precisa manter expansao de linhas e links para Terminal/Mercado Livre.

### CONVERSION_RADAR

Funcao:
- Produtos por taxa de conversao.
- Diagnostico de queda, preco, estoque e Ads.

Dependencia:
- `useConversionMetrics`

Ponto positivo:
- Ja considera schema real `visitas_total`, `vendas_total`, `receita_total`.

### STOCK_ADS

Funcao:
- Matriz estoque x investimento/score Ads.
- Scatter chart com quadrantes e acao sugerida.

Tabelas:
- `live_produtos`
- `ia_alertas_operacionais`

### HIDDEN_POTENTIAL

Funcao:
- Detecta estoque parado e oportunidades rapidas.
- Mostra potencial de receita e perda diaria.
- Abre modal `DropAnalysisRadar`.

Tabelas:
- `live_produtos`
- `live_vendas`
- `ia_alertas_operacionais`

### DATA_EXPLORER

Funcao:
- Visualizar tabelas em formato tabular.
- Ordenacao, filtro, paginacao.

Riscos:
- Muitos `any`.
- Usa `ia_alertas` no tab de alertas.
- Diz usar virtualizacao, mas o arquivo atual usa paginacao do TanStack Table.

### GLOBAL_SEARCH

Funcao:
- Busca integrada por SKU/titulo.

Riscos:
- Busca em `ia_alertas`, que esta vazia.
- Deve buscar em `ia_alertas_operacionais`.

### SYNC_CONTROL

Funcao:
- Chama edge function `sync-trigger`.
- Modos push/pull/both.

Risco:
- URL hardcoded do Supabase.
- Ideal usar env.

### AD_FACTORY

Funcao:
- Kanban de criacao de anuncios.
- Criar card.
- Mover status com drag/drop.
- Trigger de analise.
- Modal com briefing e dados manuais.

Tabela:
- `ia_kanban_cards`

Risco:
- Hooks de update manual/briefing existem, mas modal atual nao salva de fato.

### SETTINGS

Funcao:
- Tema light/dark.
- Atalhos.
- Info do sistema.

Risco:
- Textos quebrados.
- Versao hardcoded.

### FRIDAY_ORB

Funcao:
- Assistente de voz.
- Usa Speech API e MiniMax.

Risco:
- Consulta `gs_anuncios`, tabela inexistente.
- Nao esta montado no RootLayout atualmente, mas deve ser corrigido se for reativado.

---

## Supabase - inventario observado

Leitura feita com a anon key do `.env.example`.

```text
live_vendas:
  count=2573
  columns=id, order_id, item_id, sku, titulo, quantidade, preco_unitario,
  receita_total, data_venda, status, buyer_id, buyer_nickname, shipping_id,
  dados_raw, created_at

live_produtos:
  count=811
  columns=id, item_id, sku, titulo, categoria, preco, estoque, status, url,
  visitas_total, vendas_total, health_score, dados_raw, synced_at, created_at,
  vendas_7d, vendas_15d

curva_abc:
  count=528
  columns=id, mlb, titulo, curva_abc, receita_30d, ciclo, tendencia, alerta,
  data_snapshot

ia_alertas:
  count=0

ia_alertas_operacionais:
  count=284
  columns=id, sku, run_id, tipo_alerta, severidade, descricao, resolucao,
  status, data_registro, data_resolucao

ia_growth_plans:
  count=153
  columns=id, created_at, sku, acionavel, descricao_plano, status_intervencao

ml_insights:
  count=850
  columns=sku, titulo, curva_abc, rupture_risk, forecast_7d, anomaly_score,
  anomaly_severity, ml_cluster, abc_divergence, elasticity, price_sensitivity,
  synced_at

ml_price_timeline:
  count=283
  columns=id, sku, evento_data, preco_anterior, preco_novo, delta_preco_pct,
  volume_7d_antes, volume_7d_depois, delta_volume_pct, absorcao_status,
  synced_at

ia_kanban_cards:
  count=0

sku_user_notes:
  count=3
  columns=id, sku, nota, tipo_acao, resolvido, created_at, created_by

mlb_notes:
  count=0

gs_anuncios:
  erro: tabela nao encontrada
```

---

## Problemas tecnicos a corrigir antes do polish

### P0 - Dados/funcionalidade

- Trocar consultas de alertas para `ia_alertas_operacionais` onde fizer sentido.
- Normalizar severidade:
  - banco: `severidade`
  - UI pode expor `severity` internamente se houver mapper.
- Corrigir `OperationKPIBar`:
  - `receita` -> `receita_total`
  - `visits` -> `visitas_total`
  - `conversao` deve ser calculada por `vendas_total / visitas_total`.
- Corrigir `GlobalSearch` para alertas reais.
- Corrigir `DataExplorer` para alertas reais.
- Corrigir ou desativar consulta `gs_anuncios` no `FridayOrb`.
- Garantir que mutations de alertas atualizem a tabela certa.

### P1 - Qualidade de codigo

- Reduzir `any` em hooks centrais.
- Corrigir `useRealtimeTable` para nao acessar/alterar refs durante render.
- Resolver `InputProps` vazio em `components/ui/input.tsx`.
- Separar exports que causam warnings de fast refresh se necessario.
- Remover variavel nao usada `skuDates` em `useTerminalData`.

### P2 - Produto/UI

- Corrigir textos corrompidos.
- Padronizar labels, titulos, badges e mensagens vazias.
- Criar estados de erro por modulo.
- Melhorar loading states.
- Melhorar mobile.
- Melhorar acessibilidade de botoes iconicos.

---

## Design direction recomendado

### Principios

- Dashboard operacional, nao landing page.
- Denso, mas legivel.
- Priorizar diagnostico e acao.
- Mostrar hierarquia clara:
  1. Saude da operacao
  2. Problemas urgentes
  3. Oportunidades
  4. Evidencias
  5. Acao sugerida
- Animacoes devem explicar mudanca de estado, nao decorar demais.

### Identidade

- Dark mode como experiencia premium principal.
- Light mode inspirado no Mercado Livre, mas mais limpo.
- Cores sem excesso:
  - Verde: sucesso/live
  - Azul: interacao/links
  - Amarelo: atencao
  - Vermelho: critico
  - Cinza: neutro
- Radius baixo, idealmente 2px a 8px conforme componente.
- Usar Lucide React.
- Sem emoji na UI.

### Componentes base a criar

Sugestao de pasta:

```text
src/components/dashboard/
  PageShell.tsx
  ModuleHeader.tsx
  MetricCard.tsx
  DataPanel.tsx
  StatusBadge.tsx
  EmptyState.tsx
  ErrorState.tsx
  FilterBar.tsx
  ChartPanel.tsx
  InsightCallout.tsx
  ActionButton.tsx
```

Sugestao para graficos:

```text
src/components/charts/
  ChartTooltip.tsx
  ChartLegend.tsx
  RevenueAreaChart.tsx
  SalesComposedChart.tsx
  PortfolioGauge.tsx
  QuadrantScatter.tsx
  RadarHealthChart.tsx
```

### Bibliotecas de graficos

Curto prazo:
- Manter Recharts para reduzir risco.
- Criar wrappers padronizados.

Medio prazo:
- Avaliar Apache ECharts para:
  - heatmap
  - treemap
  - sankey
  - grandes scatter plots
  - graficos com zoom/dataZoom

Nao trocar tudo de uma vez.

---

## Roadmap de execucao

### Fase 0 - Setup seguro

Checklist:
- Criar branch:
  - `git checkout -b redesign/gs-quad-v3`
- Confirmar status:
  - `git status --short --branch`
- Rodar baseline:
  - `npm run test:run`
  - `npm run build`
  - `npm run lint`
- Criar arquivo de notas de progresso se necessario:
  - `docs/REDESIGN_PROGRESS.md`

Definition of done:
- Branch criada.
- Baseline documentado.
- Nenhuma alteracao funcional ainda.

### Fase 1 - Contrato de dados

Tarefas:
- Criar mappers de dados para Supabase real.
- Ajustar schemas Zod para `ia_alertas_operacionais`.
- Corrigir hooks:
  - `useIAAlertas`
  - `useUpdateAlertaStatus`
  - `usePaginatedAlertas`
  - `useLiveMetrics`, se necessario
  - `OperationKPIBar`
  - `GlobalSearch`
  - `DataExplorer`
  - `FridayOrb`
- Evitar duplicacao de hooks parecidos em `useTableData.ts`,
  `useQueryTable.ts` e `useSupabaseMutation.ts`.

Definition of done:
- Monitor mostra alertas reais.
- War Room conta alertas reais.
- Global Search encontra alertas reais.
- OperationKPIBar nao consulta colunas inexistentes.
- Build passa.

### Fase 2 - Design foundation

Tarefas:
- Corrigir `@import` de fonts para ficar antes das regras CSS.
- Revisar tokens dark/light.
- Criar componentes base.
- Padronizar:
  - titulos
  - subtitulos
  - cards
  - botoes
  - badges
  - panels
  - empty/error/loading
- Criar wrappers de charts.

Definition of done:
- Existe base visual reutilizavel.
- Nenhum modulo precisa reinventar card/header/badge.
- Build passa.

### Fase 3 - OperationHub + WarRoom

Objetivo:
- Transformar a entrada do sistema em uma central executiva.

Ideias:
- Header com estado do pipeline, ultima atualizacao, health geral.
- KPI rail com receita, conversao, estoque critico, alertas, ads score.
- Painel "Agora" com alertas urgentes.
- Painel "Oportunidades" com hidden potential e winners.
- Grafico principal de receita/volume.
- Feed/ticker mais refinado.

Definition of done:
- `/` e `/hub` usam visual novo.
- Dados reais continuam iguais.
- Mobile sem quebra.

### Fase 4 - TerminalDB

Objetivo:
- Melhorar o modulo mais importante sem quebrar navegacao.

Ideias:
- Split layout:
  - lista de SKUs a esquerda
  - painel de detalhe a direita
  - drawer/modal para notas e diagnostico
- Busca e filtros fixos.
- Cards de MLB mais legiveis.
- Grafico com comparativo/forecast/stockout melhor organizado.
- Links externos preservados.

Definition of done:
- `?sku=` e `?mlb=` continuam funcionando.
- Notas SKU continuam funcionando.
- Forecast/comparativo continuam funcionando.
- Performance aceitavel.

### Fase 5 - Modulos de inteligencia comercial

Modulos:
- AdsRadar
- ConversionRadar
- StockAdsMatrix
- HiddenPotential

Ideias:
- Unificar linguagem de score e acao.
- Criar cards de diagnostico.
- Melhorar scatter/quadrantes.
- Criar drill-down consistente para Terminal.
- Padronizar modal `DropAnalysisRadar`.

Definition of done:
- Cada modulo gera acao clara.
- Links para Terminal funcionam.
- Graficos mais ricos e legiveis.

### Fase 6 - Modulos analiticos

Modulos:
- Monitor
- GrowthPlan
- MLIntel
- PriceTimeline

Ideias:
- Monitor com fila operacional e severidade real.
- GrowthPlan com status timeline e acoes.
- MLIntel com tabs mais visuais e explicaveis.
- PriceTimeline com filtros, impacto e recomendacao.

Definition of done:
- Mutations seguem funcionando.
- Status atualizam no Supabase.
- Erros de dados aparecem como UI util.

### Fase 7 - Ferramentas e sistema

Modulos:
- DataExplorer
- GlobalSearch
- SyncControl
- AdFactory
- Settings

Ideias:
- DataExplorer com virtualizacao real.
- GlobalSearch como command center.
- SyncControl com historico real se existir fonte.
- AdFactory com modal de edicao manual funcional.
- Settings com preferencias reais.

Definition of done:
- Ferramentas estao coerentes com a nova UI.
- Kanban move/cria/deleta/trigger funciona.

### Fase 8 - Polish e validacao

Tarefas:
- Corrigir responsividade rota por rota.
- Rodar Playwright.
- Criar testes de smoke para todas as rotas.
- Testar tema light/dark.
- Checar acessibilidade basica.
- Checar bundle.
- Eliminar warnings criticos.

Definition of done:
- `npm run test:run` passa.
- `npm run build` passa.
- `npm run lint` passa ou tem backlog documentado.
- E2E cobre rotas principais.

---

## Checklist funcional que nao pode quebrar

- Navegacao sidebar desktop.
- Drawer mobile.
- Topbar com titulo da rota.
- Theme toggle.
- Command palette.
- War Room carrega KPIs.
- SalesTicker navega para Terminal.
- OperationHub navega para Terminal.
- Terminal aceita `?sku=` e `?mlb=`.
- Terminal mostra SKU, MLB, vendas, estoque, forecast e comparativo.
- Notas de SKU continuam abrindo/salvando.
- Monitor lista alertas reais.
- Monitor avanca status de alertas.
- GrowthPlan lista planos e atualiza status.
- MLIntel lista insights.
- PriceTimeline lista eventos.
- AdsRadar expande diagnostico e navega para Terminal.
- ConversionRadar filtra conversao.
- StockAdsMatrix mostra quadrantes e navega.
- HiddenPotential abre diagnostico.
- GlobalSearch busca dados reais.
- DataExplorer mostra tabelas reais.
- SyncControl chama edge function.
- AdFactory cria card.
- AdFactory move card entre colunas.
- AdFactory aciona trigger.
- AdFactory deleta card.
- Settings muda tema.

---

## Comandos uteis

```powershell
cd c:\Users\clayt\competitors\gs-quad-dashboard
git status --short --branch
npm run test:run
npm run build
npm run lint
npm run dev
```

Build com env em PowerShell, se nao houver `.env`:

```powershell
$env:VITE_SUPABASE_URL='https://mxwzvdbzwnavsnvndted.supabase.co'
$env:VITE_SUPABASE_ANON_KEY='sb_publishable_LVv655unDsN4UwPt1eEIAg_dTOUs_VV'
$env:VITE_APP_ENV='development'
npm run build
```

Consulta rapida do Supabase via Node:

```powershell
@'
import { createClient } from '@supabase/supabase-js';
const url = 'https://mxwzvdbzwnavsnvndted.supabase.co';
const key = 'sb_publishable_LVv655unDsN4UwPt1eEIAg_dTOUs_VV';
const supabase = createClient(url, key);
const tables = [
  'live_vendas','live_produtos','curva_abc','ia_alertas',
  'ia_alertas_operacionais','ia_growth_plans','ml_insights',
  'ml_price_timeline','ia_kanban_cards','sku_user_notes','mlb_notes'
];
for (const table of tables) {
  const countRes = await supabase.from(table).select('*', { count: 'exact', head: true });
  const sampleRes = await supabase.from(table).select('*').limit(1);
  const err = countRes.error || sampleRes.error;
  if (err) console.log(`${table}: ERROR ${err.message}`);
  else console.log(`${table}: count=${countRes.count ?? 'unknown'} columns=${sampleRes.data?.[0] ? Object.keys(sampleRes.data[0]).join(',') : '(no rows)'}`);
}
'@ | node --input-type=module
```

---

## Arquivos prioritarios para ler antes de mexer

```text
package.json
README.md
src/app/routes.tsx
src/app/RootLayout.tsx
src/components/Layout.tsx
src/index.css
src/lib/env.ts
src/lib/supabase.ts
src/lib/schemas.ts
src/hooks/index.ts
src/hooks/useTableData.ts
src/hooks/useTerminalData.ts
src/hooks/useAdsRadar.ts
src/hooks/useConversionMetrics.ts
src/hooks/useKanbanBoard.ts
src/views/VisaoGeral.tsx
src/views/OperationHub.tsx
src/views/TerminalDB.tsx
src/views/Monitor.tsx
src/views/DataExplorer.tsx
src/views/GlobalSearch.tsx
```

---

## Criterios de sucesso final

- Interface claramente superior, moderna e consistente.
- Dados reais do Supabase aparecem nos modulos corretos.
- Nenhuma funcionalidade atual perdida.
- Todos os modulos principais responsivos.
- Graficos mais legiveis e acionaveis.
- Loading, empty e error states tratados.
- Textos em pt-BR corrigidos.
- Build funcionando.
- Testes basicos funcionando.
- Lint idealmente limpo ou com pendencias documentadas.
- Codigo mais facil de evoluir depois.

