# GS-QUAD Dashboard — Contexto de Implementação

## Visão Geral do Projeto

**gs-quad-dashboard** é um dashboard operacional React para orquestração de vendas via Mercado Livre, integrado com Supabase (banco em tempo real), DuckDB (fontes de verdade para análise), e N8N (automação). Desenvolvido em **6 fases incrementais**.

---

## Stack Técnica

| Tecnologia | Versão | Propósito |
|---|---|---|
| Vite | 6.x | Build tool com tsconfigPaths |
| React | 18.x | UI framework |
| React Router DOM | 6.x | Roteamento com `createBrowserRouter` + lazy loading |
| React Query (@tanstack) | 5.x | Server-state, cache, realtime invalidation |
| Zustand | 5.x | Client state (theme, sidebar, command palette) |
| Supabase | @supabase/supabase-js | Backend em tempo real via `postgres_changes` |
| Zod | 4.x | Validação de env e schemas de dados |
| shadcn/ui | components | UI components (copy-paste, não npm) |
| Tailwind CSS | 4.x | Estilização com `@theme` e CSS variables |
| @dnd-kit | core + sortable | Drag-and-drop do Kanban |
| Recharts | ~403KB | Gráficos |
| Framer Motion | ~162KB | Animações de rota (AnimatePresence) |
| Sonner | — | Toast notifications |
| cmdk | — | Command Palette (⌘K) |
| @tanstack/react-table + react-virtual | — | Data Explorer com 500+ rows virtualizadas |

---

## Arquitetura de Pastas

```
src/
├── app/
│   ├── routes.tsx          # 12 rotas lazy-loaded + meta
│   ├── RootLayout.tsx      # Layout raiz + AnimatePresence + Toaster + CommandPalette
│   ├── QueryProvider.tsx   # QueryClient (staleTime: 30s, retry: 1)
│   └── ThemeProvider.tsx   # data-theme attribute no <html>
├── components/
│   ├── Layout.tsx           # Sidebar retraível + header + mobile drawer
│   ├── CommandPalette.tsx   # cmdk com 3 grupos: Navegação, Ferramentas, SKU
│   ├── ThemeToggle.tsx      # DropdownMenu light/dark
│   ├── ErrorBoundary.tsx    # react-error-boundary com retry
│   ├── Skeleton.tsx         # Loading skeletons
│   ├── RouteFallback.tsx    # Skeleton para lazy routes
│   ├── KanbanBoard.tsx      # DndContext + DragOverlay + Add Card dialog
│   ├── KanbanColumn.tsx     # useDroppable + SortableContext
│   ├── KanbanCard.tsx       # useSortable + drag handle + hover actions
│   ├── KanbanCardModal.tsx  # Dialog com Briefing IA tab + Manual data tab
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx, card.tsx, badge.tsx, input.tsx
│       ├── separator.tsx, tooltip.tsx, dialog.tsx, sheet.tsx
│       ├── dropdown-menu.tsx, tabs.tsx, index.tsx
├── hooks/
│   ├── index.ts             # Barrel export único (evitar duplicatas)
│   ├── useTableData.ts      # useLiveMetrics, useCurvaABC, useIAAlertas, useStockAlerts,
│   │                        # useGrowthPlans, useUpdateGrowthPlanStatus, useMLInsights,
│   │                        # usePriceTimeline, usePaginatedAlertas
│   ├── useRealtimeTable.ts  # Supabase postgres_changes → invalidates cache
│   ├── useSupabaseMutation.ts  # Generic mutation + optimistic updates + sonner toasts
│   └── useKanbanBoard.ts    # CRUD Kanban + realtime + optimistic drag-drop
├── lib/
│   ├── env.ts               # Zod validation para SUPABASE_URL + SUPABASE_ANON_KEY
│   ├── supabase.ts          # Supabase client
│   ├── utils.ts             # cn() helper (clsx + tailwind-merge)
│   └── schemas.ts           # Zod schemas + ALERTA_RANK + GROWTH_RANK
├── stores/
│   └── uiStore.ts           # Zustand persist (theme, sidebarState, commandPaletteOpen)
├── views/
│   ├── VisaoGeral.tsx       # useLiveMetrics + MetricCard
│   ├── TerminalDB.tsx        # CurvaABC table + terminal output box
│   ├── Monitor.tsx           # useIAAlertas + useStockAlerts + ALERTA_RANK cycling
│   ├── GrowthPlan.tsx        # useGrowthPlans + useUpdateGrowthPlanStatus + GROWTH_RANK
│   ├── MLIntel.tsx          # useMLInsights + cluster cards
│   ├── PriceTimeline.tsx    # usePriceTimeline + price chart
│   ├── DataExplorer.tsx     # react-table + react-virtual (500+ rows)
│   ├── ActivityFeed.tsx     # Timeline de eventos (alerta/sync/growth/price/system)
│   ├── SyncControl.tsx      # PUSH/PULL/BOTH + execution log
│   ├── GlobalSearch.tsx      # Promise.allSettled + ilike search
│   ├── Settings.tsx          # Theme toggle + keyboard shortcuts
│   └── AdFactory.tsx        # Thin wrapper → KanbanBoard
└── index.css                # Dual-theme CSS variables (dark + light)
```

---

## Rotas

| Path | View | Descrição |
|---|---|---|
| `/` | VisaoGeral | WAR_ROOM — métricas live |
| `/terminal` | TerminalDB | Catálogo completo |
| `/monitor` | Monitor | Alertas operacionais |
| `/growth` | GrowthPlan | Estratégias validadas |
| `/ml` | MLIntel | ML predictions e clusters |
| `/price` | PriceTimeline | Timeline de preços |
| `/explorer` | DataExplorer | Banco visual (react-table virtualizada) |
| `/activity` | ActivityFeed | Timeline de eventos |
| `/sync` | SyncControl | Pipeline DuckDB ↔ Supabase |
| `/search` | GlobalSearch | Busca integrada |
| `/adfactory` | AdFactory | **Kanban** — criação inteligente de anúncios |
| `/settings` | Settings | Preferências |

---

## Fases Implementadas

### Fase 1 — Infraestrutura Base ✅
- Vite 6 + tsconfigPaths (`@/*` aliases)
- React Router DOM v6 com lazy loading
- React Query v5 com cache + realtime invalidation
- Zustand persist para UI state
- Zod env validation
- Dual-theme CSS variables (dark + light)
- shadcn/ui components (10 componentes)
- Layout com sidebar retraível + mobile drawer
- Error boundary + skeletons
- Command Palette (⌘K)

### Fase 2 — Módulos Principais ✅
- VisaoGeral com useLiveMetrics
- Monitor com useIAAlertas + ALERTA_RANK cycling
- GrowthPlan com useGrowthPlans + GROWTH_RANK cycling
- TerminalDB com CurvaABC table
- MLIntel com useMLInsights
- PriceTimeline com usePriceTimeline

### Fase 3 — Realtime + Mutations ✅
- Supabase realtime subscriptions via useRealtimeTable
- Optimistic updates nas mutations
- Sonner toasts em todas operações
- useSupabaseMutation genérico com onMutate/onError/onSettled

### Fase 4 — Ferramentas Avançadas ✅
- DataExplorer (react-table + react-virtual, 500+ rows)
- ActivityFeed (timeline de eventos)
- SyncControl (PUSH/PULL/BOTH)
- GlobalSearch (Promise.allSettled)
- Settings (theme + shortcuts)

### Fase 5 — Kanban AdFactory ✅
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
- `useKanbanBoard.ts` — 8 hooks: useKanbanCards (realtime), useCreateKanbanCard,
  useUpdateKanbanCardStatus (optimistic), useTriggerKanbanAnalysis,
  useUpdateKanbanBriefing, useUpdateKanbanManual, useDeleteKanbanCard, useResetKanbanCard
- `KANBAN_COLUMNS` — 6 statuses: backlog, processing, drafting, pricing, review, live
- `KanbanBoard.tsx` — DndContext + closestCorners + DragOverlay + Add Card dialog
- `KanbanColumn.tsx` — useDroppable + SortableContext + drop highlight
- `KanbanCard.tsx` — useSortable + drag handle + briefing preview + hover actions
- `KanbanCardModal.tsx` — Dialog com Briefing IA tab (Winning Formula display) +
  Manual data tab + trigger button
- `AdFactory.tsx` — thin wrapper com header + KanbanBoard
- `/adfactory` route adicionada

### Fase 6 — Testes, CI/CD, Monitoring, Docs ❌ (PENDENTE)
- Vitest + @testing-library/react
- Playwright E2E tests
- ESLint + Prettier + Husky (pre-commit hooks)
- GitHub Actions → Vercel deployment
- @sentry/react (error tracking)
- README.md + CONTRIBUTING.md

---

## Padrões Importantes

### Barrel Exports (evitar duplicatas)
```typescript
// hooks/index.ts — exports únicos, sem re-exportar o mesmo nome de dois arquivos
// Se usar useRealtimeTable em useTableData.ts e Quer exportar dele → NÃO re-exporte
// também de useRealtimeTable.ts diretamente no index.ts (causa "Multiple exports")
```

### React Query v5
- `loading` → `isLoading` (mudou na v5)
- `useQuery` → `queryKey` array, `staleTime: 30_000`
- Mutations: `onMutate` para optimistic update, `onError` para rollback, `onSettled` para invalidate

### Realtime
```typescript
// useRealtimeTable.ts usa Supabase postgres_changes
// Ao receber mudança → queryClient.invalidateQueries({ queryKey })
// KanbanBoard usa useKanbanCards que é realtime (escuta INSERT/UPDATE/DELETE)
```

### Kanban Drag-Drop
```typescript
// PointerSensor com activationConstraint: { distance: 5 }
// closestCorners collision detection
// handleDragEnd: determina targetStatus da coluna OU do card sobreposto
// useUpdateKanbanCardStatus.mutate com optimistic update
```

### Dual-Theme CSS Variables
```css
/* Dark (default) */
:root, [data-theme="dark"] {
  --color-gs-green: #00FF66;
  --color-gs-bg: #030303;
  /* ... */
}
/* Light */
[data-theme="light"] {
  --color-gs-green: #00A344;
  --color-gs-bg: #F5F5F5;
  /* ... */
}
```

### ALERTA_RANK e GROWTH_RANK (status cycling)
```typescript
// ALERTA_RANK: PENDENTE=0 < EM_ANALISE=1 < RESOLVIDO/IGNORADO=2
// GROWTH_RANK: PENDENTE=0 < EM_ANDAMENTO=1 < APROVADO=2 < CONCLUÍDO=3
// handleAdvanceStatus: rank = (rank + 1) % max → resolve para status correto
```

---

## Dependências Instaladas (package.json)
```json
"dependencies": {
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@dnd-kit/utilities": "^3.x",
  "@radix-ui/react-dialog": "^1.x",
  "@radix-ui/react-dropdown-menu": "^2.x",
  "@radix-ui/react-separator": "^1.x",
  "@radix-ui/react-tooltip": "^1.x",
  "@radix-ui/react-tabs": "^1.x",
  "@supabase/supabase-js": "^2.x",
  "@tanstack/react-query": "^5.x",
  "@tanstack/react-query-devtools": "^5.x",
  "@tanstack/react-table": "^8.x",
  "@tanstack/react-virtual": "^3.x",
  "class-variance-authority": "^0.7.x",
  "clsx": "^2.x",
  "cmdk": "^1.x",
  "framer-motion": "^11.x",
  "lucide-react": "^0.x",
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-error-boundary": "^4.x",
  "react-router-dom": "^6.x",
  "recharts": "^2.x",
  "sonner": "^1.x",
  "tailwind-merge": "^2.x",
  "zod": "^4.x",
  "zustand": "^5.x"
}
```

---

## Para Começar Onde Parou

1. **Ler o projeto** — explorar `src/` para entender estado atual
2. **Build de validação** — `cd gs-quad-dashboard && npm run build`
3. **Phase 6** é o próximo passo: vitest, playwright, CI/CD, sentry, README
4. **Regras de ouro**:
   - Não modificar `_opensquad/` (core do Opensquad)
   - Usar `/opensquad` commands para interagir com o sistema
   - Verificar `src/hooks/index.ts` antes de adicionar exports (evitar duplicatas)
   - Testar realtime localmente: Supabase precisa estar conectado para dados live
