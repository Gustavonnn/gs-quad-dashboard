# Contributing to GS-QUAD Dashboard

## Development Setup

1. Fork e clone o repositório
2. Instale dependências: `npm install`
3. Copie `.env.example` para `.env` e configure as variáveis
4. Inicie o dev server: `npm run dev`

## Branching Strategy

- `main` — branch de produção (protected)
- `feature/*` — novas features
- `fix/*` — correções de bug
- `refactor/*` — refatorações

## Commits

Seguimos Conventional Commits:

```
feat: add new dashboard view
fix: resolve kanban drag bug
docs: update README
refactor: simplify query logic
test: add tests for GrowthPlan
chore: update dependencies
```

## Pull Requests

1. Crie uma branch a partir de `main`
2. Faça suas alterações seguindo os padrões do código
3. Rode `npm run lint:fix` para formatar
4. Asegure que `npm run test:run` passa
5. Push e abra um PR

## Code Style

- ESLint + Prettier configurados
- Husky roda lint-staged no pre-commit
- Evite `any` — use tipos específicos
- Props interfaces começam com nome do componente (ex: `KanbanCardProps`)

## Testing

### Unit Tests

- Arquivos: `*.test.ts` ou `*.spec.ts`
- Localização: mesmo diretório do arquivo testado ou `src/test/`
-Imports: `import { describe, it, expect } from 'vitest'`

```typescript
describe('MyFeature', () => {
  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

### E2E Tests

- Localização: `e2e/*.spec.ts`
- Use Playwright selectors: `page.getByRole()`, `page.locator()`
- Cada teste deve ser independente

## Checklist antes de PR

- [ ] Tests passando (`npm run test:run`)
- [ ] Lint passando (`npm run lint`)
- [ ] Build passando (`npm run build`)
- [ ] Novas features tem testes
- [ ] Docs atualizadas se necessário

## Dicas

- Use `npm run test:ui` para visualizar testes no browser
- Use `console.log` apenas em debug, remova antes de commitar
- Para testar realtime local, Supabase precisa estar conectado
- Verifique `src/hooks/index.ts` antes de adicionar exports (evitar duplicatas)
