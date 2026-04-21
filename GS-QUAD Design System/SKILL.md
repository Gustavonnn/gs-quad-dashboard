---
name: gs-quad-design
description: Use this skill to generate well-branded interfaces and assets for GS-QUAD (ARMAZENACORP's Mercado Livre operational dashboard). Contains essential design guidelines, colors, type, fonts, and UI kit components for prototyping or production work.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Key design rules to follow immediately

- **Background**: near-black `#030303` / `#050505` / `#0a0a0a` (dark), `#f5f5f5` + white panels (light)
- **Accent**: `#00ff66` green (live/success), `#007aff` blue (interactive/active), `#ffd700` yellow (warning), `#ff3333` red (critical)
- **Fonts**: Outfit 900 for headings/KPIs, JetBrains Mono for all labels/badges/nav, Space Grotesk for body
- **Border radius**: always `2px` (nearly square — no rounded-lg)
- **Shadows**: flat pixel shadows `1px 1px 0 #1f1f1f` — no blur
- **Labels**: ALL_CAPS_SNAKE_CASE for module names, ALLCAPS + letter-spacing for inline labels
- **Language**: pt-BR for UI copy, English for technical module names
- **Icons**: Lucide React, `strokeWidth={2}`, `size={15}` for nav
- **No emoji** — use unicode `▸` `→` `↔` `·` only
- **Top accent lines**: colored `1px` at top of cards matching metric color
- **Card hover**: `translateY(-2px)` + `3px 3px 0` offset shadow
- **Active nav**: `background: #007aff`, white text, `2px` green left border with glow

## Files in this design system

- `README.md` — full context + visual foundations + iconography
- `colors_and_type.css` — all CSS vars (import this!)
- `preview/` — 12 visual card previews
- `ui_kits/dashboard/index.html` — full interactive dashboard prototype (5 screens)
