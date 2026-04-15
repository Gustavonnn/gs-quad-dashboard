# GS-QUAD Dashboard — Checkpoint de Desenvolvimento

## Data: 2026-04-14

## Estado Atual do Projeto

### Fase 6 — Testes, CI/CD, Monitoring, Docs ✅ COMPLETO
- Vitest + @testing-library/react configurado
- Playwright E2E tests configurado
- ESLint + Prettier + Husky (lint-staged no pre-commit)
- GitHub Actions CI/CD para Vercel
- @sentry/react para error tracking
- README.md + CONTRIBUTING.md criados

### Correções Aplicadas (Hoje)

1. **lazy() named exports** — `routes.tsx`
   - Padrão: `lazy(() => import('@/views/View').then(m => ({ default: m.ViewName })))`
   - Applied to all 12 routes

2. **Duplicate KanbanCard import** — `KanbanColumn.tsx`
   - Renamed: `import type { KanbanCard as KanbanCardType }` + `import { KanbanCard as KanbanCardComponent }`

3. **Suspense para React.lazy** — `main.tsx`
   - Added `<Suspense fallback={<RouteFallback />}>` wrapping RouterProvider

4. **Schema id coerce** — `schemas.ts`
   - Added `const idSchema = z.coerce.string()` for all id fields
   - Handles both number and string IDs from database

5. **Realtime disabled** — Views agora funcionam sem realtime
   - `useKanbanCards`: `enabled: false`
   - `useIAAlertas`: `enabled: false`
   - `useGrowthPlans`: `enabled: false`

6. **N8N/Claude AI removido de textos visíveis**
   - Subtitle routes: `DADOS EXCEL ↔ SUPABASE ↔ DASHBOARD`
   - KanbanCardModal: "Briefing" (não "Briefing IA")
   - KanbanCard: "ANÁLISE ATIVA" (não "ANÁLISE IA ATIVA")

7. **data?.length / data?.filter safe guards** — Todos os views
   - `MLIntel.tsx`: `if (isLoading || !data)`
   - `GrowthPlan.tsx`: `(!data || data.length === 0)`, `(data ?? []).map()`
   - `CurvaABC.tsx`: `const safeData = data ?? []`
   - `TerminalDB.tsx`: `(data ?? []).filter()`, `data?.length ?? 0`
   - `PriceTimeline.tsx`: `data?.length ?? 0`, `if (!data) return []`

## Scripts Disponíveis
```bash
npm run dev        # Development
npm run build      # Production build
npm run test       # Vitest watch
npm run test:run   # Vitest single run
npm run test:e2e   # Playwright E2E
npm run lint       # ESLint
npm run lint:fix   # ESLint fix
npm run format     # Prettier
```

## Estrutura de Pastas
```
gs-quad-dashboard/
├── src/
│   ├── app/           # routes.tsx, RootLayout, QueryProvider, ThemeProvider
│   ├── components/    # Layout, Kanban*, ui/*
│   ├── hooks/         # useTableData, useKanbanBoard, useRealtimeTable
│   ├── views/         # 12 lazy-loaded views
│   ├── lib/          # schemas, supabase, utils, env
│   └── stores/       # uiStore (Zustand)
├── e2e/              # Playwright tests
├── src/test/         # Vitest setup
└── .github/workflows/ci.yml
```

## PRÓXIMOS PASSOS (Fase 6 completa, continuação livre)
- Testar todas as views com dados reais do Supabase
- Verificar se há mais erros de runtime
- Adicionar mais unit tests
- Configurar deploy no Vercel (precisa VERCEL_TOKEN)
