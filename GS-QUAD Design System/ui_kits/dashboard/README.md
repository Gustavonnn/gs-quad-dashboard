# GS-QUAD Dashboard UI Kit

**Surface:** Main SPA dashboard  
**Design width:** 1440px  
**Theme:** Dark (default) + Light toggle

## Screens included

1. **WAR_ROOM** — Live KPI overview, sparkline chart, terminal feed, alerts
2. **TERMINAL_DB** — SKU catalog table with filters
3. **MONITOR** — Tactical alerts list
4. **AD_FACTORY** — Kanban board for ad creation
5. **SETTINGS** — Preferences panel

## Components

- `Layout` — sidebar + topbar shell
- `Sidebar` — collapsible with hover-expand, nav groups, status footer
- `Topbar` — route title + search button + theme toggle
- `KpiCard` — accent line, value, progress bar, trend label
- `TerminalFeed` — macOS chrome, live log lines, blinking cursor
- `AlertRow` — severity dot + SKU + description
- `DataTable` — sortable table with mono cells
- `KanbanColumn` / `KanbanCard` — drag-drop columns
- `Badge` — all variants
- `Button` — all variants

## Usage

Open `index.html` to interact with the full prototype.
Click nav items to switch views. Use the theme toggle in the topbar.
