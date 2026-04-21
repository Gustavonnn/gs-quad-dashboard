# GS-QUAD Design System

**Product:** GS-QUAD Dashboard — Operational sales intelligence platform for Mercado Livre sellers  
**Company:** ARMAZENACORP  
**Version:** INTEL OPS v2.1  
**Source repo:** `Gustavonnn/gs-quad-dashboard` (https://github.com/Gustavonnn/gs-quad-dashboard)

---

## Overview

GS-QUAD is a React-based operational dashboard that orchestrates Mercado Livre sales data via Supabase (real-time backend), DuckDB (analytical source of truth), and N8N (automation). It is used internally by ARMAZENACORP to manage their Mercado Livre seller operations — monitoring SKU performance, ad campaigns, price timelines, stock alerts, ML predictions, and ad creation workflows (Kanban).

### Products / Surfaces

| Surface           | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Dashboard App** | The main SPA at `/` — dark-mode operational dashboard with 12+ views |
| **Light Theme**   | Mercado Livre–inspired light mode for wider accessibility            |

### Key Views

| Route        | View          | Description                                         |
| ------------ | ------------- | --------------------------------------------------- |
| `/`          | WAR_ROOM      | Live metrics overview — KPIs, charts, terminal feed |
| `/terminal`  | TERMINAL_DB   | Full SKU catalog                                    |
| `/monitor`   | MONITOR       | Tactical alerts                                     |
| `/growth`    | GROWTH_PLAN   | Strategic playbooks                                 |
| `/ml`        | NEURAL_INTEL  | ML predictions & clusters                           |
| `/price`     | PRICE_REACT   | Price history timeline                              |
| `/ads-radar` | ADS_RADAR     | Ad performance radar                                |
| `/explorer`  | DATA_EXPLORER | Visual query builder                                |
| `/activity`  | ACTIVITY      | Event timeline                                      |
| `/sync`      | SYNC_CTRL     | DuckDB ↔ Supabase pipeline                          |
| `/adfactory` | AD_FACTORY    | Kanban for ad creation                              |
| `/settings`  | SETTINGS      | User preferences                                    |

---

## Content Fundamentals

**Language:** Primarily Portuguese (pt-BR), with English used for technical labels and module names.

**Tone:** Terse, operational, technical. No warmth or marketing fluff. Reads like a military ops room or trading terminal dashboard.

**Casing:**

- Module names: `ALL_CAPS_SNAKE_CASE` (e.g. `WAR_ROOM`, `TERMINAL_DB`, `SYNC_CTRL`)
- Labels/tags: `ALLCAPS` with letter-spacing (e.g. `OPERAÇÃO ATIVA`, `SYSTEM ONLINE`)
- Body copy: Sentence case in pt-BR
- Status lines: monospaced ALL CAPS (e.g. `LATENCY 42ms · WS`)

**Voice examples:**

- "WAR_ROOM INTEL" — primary page header
- "OPERAÇÃO ATIVA" — live status badge
- "GS-QUAD · INTEL OPS · ARMAZENACORP" — subtitle tagline
- "SYSTEM ONLINE · LATENCY 42ms · WS" — footer status
- "SKUs sem estoque ativo" — alert description (pt-BR)
- "Pipeline DuckDB → Supabase: sincronizado." — terminal log line

**No emoji.** Never used in the UI. Unicode characters used sparingly: `▸` (terminal prompt), `·` (separator), `→` (directional), `↔` (bidirectional sync).

---

## Visual Foundations

### Colors

**Dark theme (default):**

- Background deep: `#050505` (near-black page background)
- Background: `#030303`
- Surface/Panel: `#0a0a0a`
- Border: `#1f1f1f` (ultra-subtle 1px dividers)
- Text primary: `#ededed`
- Text muted: `#888888`
- Text subtle: `#555555`

**Accent palette (dark):**

- Green (primary): `#00ff66` — live status, success, key metrics
- Blue (interactive): `#007aff` — active nav, buttons, links
- Cyan (intel): `#00d4ff` — data/ML signals
- Yellow (warning): `#ffd700` — alerts, attention
- Red (critical): `#ff3333` — destructive, critical severity
- Orange (caution): `#ff6b00` — moderate alerts

**Light theme (Mercado Livre–inspired):**

- Background: `#f5f5f5`
- Panel: `#ffffff`
- Header: `#fff159` (Mercado Livre yellow)
- Blue accent: `#3483fa` (Mercado Livre blue — used for links and interactive states)
- Text: `#333333`, Muted: `#666666`

### Typography

- **Display / Body:** Space Grotesk (sans-serif) — used for all body text
- **Headings:** Outfit (sans-serif) — black weight (900), used for page titles and KPI values
- **Mono / Labels:** JetBrains Mono — used everywhere for labels, tags, badges, terminal output, navigation items

**Type pattern:** Large Outfit headings + ultra-small mono labels. No mid-size body text blocks. Data-dense, scannable.

### Spacing & Layout

- Main content max-width: `1680px`, centered
- Content padding: `px-4 py-6` → `lg:px-8 lg:py-10` (progressive)
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` for KPI rows; `lg:grid-cols-3` for chart+terminal
- Gap: mostly `gap-3` (12px) between cards, `gap-5` (20px) between sections
- Sidebar collapsed: `52px`; expanded (hover): `220px`
- Topbar height: `60px`

### Borders & Corners

- **Border radius: `2px`** — nearly square everywhere. No rounded-lg bubbles.
- Border color: `#1f1f1f` — ultra-subtle in dark mode
- `box-shadow: 1px 1px 0 var(--color-gs-border)` — flat offset shadow (no blur), pixel-art style

### Cards

- Background: `var(--color-gs-panel)` (`#0a0a0a` dark)
- Border: `1px solid var(--color-gs-border)`
- Border-radius: `2px`
- Top accent: `1px` colored line at top edge (color matches metric accent)
- Hover: `translateY(-2px)` + `3px 3px 0` offset shadow + border-color → muted
- No drop shadows with blur — only flat pixel shadows

### Backgrounds & Texture

- Dark mode: subtle radial gradients using green/blue accent colors at 1-2% opacity
- Light mode: no background images
- No repeating patterns, no grain textures
- No full-bleed imagery
- Terminal panels: `var(--color-gs-bg)` (#030303) — even darker

### Animations

- `fade-in`: `opacity 0→1`, 0.35s ease-out — used on page transitions
- `slide-up`: `opacity + translateY(8px→0)`, 0.4s cubic-bezier(0.16, 1, 0.3, 1) — cards
- `glow-pulse`: green box-shadow oscillation, 2.5s ease-in-out infinite — live indicators
- `scan-line`: horizontal green scan sweep, 3.5s linear infinite — terminal chrome
- `blink-cursor`: opacity step blink, 1s — terminal cursor
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like, fast-out) for sidebar expand; `cubic-bezier(0.4, 0, 0.2, 1)` for material-style transitions

### Hover / Press States

- Nav items: `background: white/5%`, text → `var(--color-gs-text)`
- Active nav: `background: var(--color-gs-blue)`, text → white, + green left-border accent `2px`
- Cards: `translateY(-2px)` + offset shadow
- Buttons (outline): border-color → muted
- Glow-green utility: border + box-shadow → green on hover
- No opacity-based hover on most elements (except directional links)
- Press: no shrink state defined; transitions at 0.1s duration

### Scrollbar

- Width: `4px` (global), `2px` (custom-scrollbar utility)
- Track: transparent
- Thumb: `var(--color-gs-border)`
- Thumb hover: `var(--color-gs-muted)`

### Glass / Panel Pattern

- `.glass-panel`: `background: surface + backdrop-blur(4px) + 1px border + 1px 1px offset shadow`
- `.card-premium`: same without blur — solid panel

---

## Iconography

**Icon library:** [Lucide React](https://lucide.dev/) — stroke-based SVG icons at `size={15}` (nav) and `size={11-14}` (inline).

**Common icons used:**

- `LayoutDashboard` — WAR_ROOM
- `BarChart3` — TERMINAL_DB
- `Activity` — MONITOR
- `TrendingUp` / `TrendingDown` — metrics trends
- `Brain` — ML/Neural Intel
- `Database` — Data Explorer
- `Zap` — Activity, live indicators
- `RefreshCw` — Sync
- `Target` — Ad Factory
- `Radar` — ADS_RADAR
- `Command` — Command palette
- `AlertTriangle` — warnings
- `Package` — inventory
- `Settings` — settings

**Usage rules:**

- `strokeWidth={2}` universally
- Icons in nav use color `var(--color-gs-muted)`, active state → `white`
- Inline icons use the semantic accent color (e.g. green for live, yellow for warning)
- No filled/solid icons. All stroke-only.
- CDN: `lucide-react` via npm in the codebase; for HTML prototypes use `https://unpkg.com/lucide@latest/dist/umd/lucide.js`

---

## File Index

```
/
├── README.md                  ← This file
├── SKILL.md                   ← Agent skill definition
├── colors_and_type.css        ← CSS vars: colors + typography
├── assets/                    ← Brand assets (none in repo; see notes)
├── preview/                   ← Design system card previews
│   ├── colors-dark.html
│   ├── colors-light.html
│   ├── colors-semantic.html
│   ├── type-scale.html
│   ├── type-mono.html
│   ├── spacing-tokens.html
│   ├── card-patterns.html
│   ├── badges.html
│   ├── buttons.html
│   ├── nav-sidebar.html
│   ├── animations.html
│   └── kpi-card.html
└── ui_kits/
    └── dashboard/
        ├── README.md
        └── index.html         ← Interactive dashboard prototype
```

**Note on assets:** The repository contains no static image assets (no logos, no illustrations, no icon sprites). The logo is rendered as a CSS/HTML text mark — a blue `2px`-radius square with "GS" in white Outfit Black. Lucide React is the icon system.
