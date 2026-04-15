# GS-QUAD Dashboard

Dashboard operacional React para orquestração de vendas via Mercado Livre, integrado com Supabase (banco em tempo real), DuckDB (fontes de verdade para análise), e N8N (automação).

## Stack Técnica

| Tecnologia | Versão | Propósito |
|---|---|---|
| Vite | 6.x | Build tool com tsconfigPaths |
| React | 18.x | UI framework |
| React Router DOM | 7.x | Roteamento com lazy loading |
| React Query | 5.x | Server-state, cache, realtime |
| Zustand | 5.x | Client state (theme, sidebar) |
| Supabase | 2.x | Backend em tempo real |
| Tailwind CSS | 4.x | Estilização com CSS variables |
| @dnd-kit | | Drag-and-drop Kanban |
| Recharts | | Gráficos |
| Framer Motion | | Animações |
| Sonner | | Toast notifications |
| Sentry | | Error tracking |

## Getting Started

### Pré-requisitos

- Node.js 20+
- npm ou yarn

### Instalação

```bash
# Clonar o repositório
git clone <repo-url>
cd gs-quad-dashboard

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Iniciar development server
npm run dev
```

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SENTRY_DSN=  # Opcional, para error tracking
VITE_APP_ENV=development
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Build para produção
npm run preview      # Preview do build
npm run test         # Unit tests (watch mode)
npm run test:run     # Unit tests (single run)
npm run test:coverage # Coverage report
npm run test:e2e     # Playwright E2E tests
npm run lint         # ESLint
npm run lint:fix     # ESLint fix
npm run format       # Prettier format
```

## Arquitetura

### Rotas

| Path | View | Descrição |
|---|---|---|
| `/` | VisaoGeral | WAR_ROOM — métricas live |
| `/terminal` | TerminalDB | Catálogo completo |
| `/monitor` | Monitor | Alertas operacionais |
| `/growth` | GrowthPlan | Estratégias validadas |
| `/ml` | MLIntel | ML predictions e clusters |
| `/price` | PriceTimeline | Timeline de preços |
| `/explorer` | DataExplorer | Banco visual |
| `/activity` | ActivityFeed | Timeline de eventos |
| `/sync` | SyncControl | Pipeline DuckDB ↔ Supabase |
| `/search` | GlobalSearch | Busca integrada |
| `/adfactory` | AdFactory | **Kanban** — criação de anúncios |
| `/settings` | Settings | Preferências |

### Pastas

```
src/
├── app/           # Rotas, layout, providers
├── components/    # UI components, Kanban
├── hooks/         # Data fetching hooks
├── views/         # Lazy-loaded page components
├── lib/           # Supabase, schemas, utils
├── stores/        # Zustand state
└── test/          # Test setup
```

## Testing

### Unit Tests (Vitest)

```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

### E2E Tests (Playwright)

```bash
npm run test:e2e    # Run E2E tests
npm run test:e2e:ui # UI mode
```

Os testes E2E requerem que o dev server esteja rodando ou vão iniciar um automaticamente.

## Deployment

O projeto é deployado automaticamente via GitHub Actions para Vercel quando há push na branch `main`.

Secrets necessários no GitHub:
- `VERCEL_TOKEN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Private
