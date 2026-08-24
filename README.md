# Green Fibre Dashboard

Organized React + Tailwind + TanStack Query starter for the Green Fibre portal dashboard.

## Setup

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`. Loads with mock data out of the box, so you can see the full design immediately — no backend needed yet.

## Project structure

```
src/
  index.css                 ← design tokens + reusable classes (import in every page)
  App.jsx                   ← dashboard page layout
  main.jsx                  ← app entry, sets up QueryClientProvider
  lib/
    api.js                  ← fetch wrapper, mock/real toggle
    mockData.js             ← placeholder data until backend is ready
  hooks/
    useDashboardData.js     ← TanStack Query hooks (useKpis, useAlerts, etc.)
  components/
    ui/                     ← Card, Badge, Skeleton — generic, reusable anywhere
    layout/                 ← Sidebar, Topbar — shared across all future pages
    dashboard/               ← page-specific: KpiGrid, AlertsPanel, ChannelMarginBars, WhatIfSimulator
  utils/
    format.js                ← currency/percent formatting helper
tailwind.config.js           ← maps Tailwind classes to the CSS variables in index.css
```

## Reusing this on other pages (Products, Vendors, Reports, etc.)

1. Keep `index.css` and `tailwind.config.js` exactly as they are — every page should import the same `index.css`.
2. Reuse the class names already defined: `.card`, `.kpi-card`, `.badge-ok/-warn/-danger`, `.btn-primary/-outline/-ghost`, `.input`, `.skeleton`, `.section-title`, `.stat-figure`, `.table-clean`.
3. Reuse `Sidebar` and `Topbar` from `components/layout/` as the shell for every new page — just swap out `<main>`'s content.
4. For a new page's data, add a new hook file (e.g. `hooks/useVendorData.js`) following the same pattern as `useDashboardData.js`, and add matching functions to `lib/api.js`.

## Connecting your real backend

In `src/lib/api.js`:
1. Set `VITE_API_URL` in a `.env` file to your backend base URL (e.g. `VITE_API_URL=https://api.greenfibre.in`).
2. Set `VITE_USE_MOCK=false` in `.env` once your endpoints exist:
   - `GET /dashboard/kpis`
   - `GET /dashboard/alerts`
   - `GET /dashboard/channel-margins`
   - `POST /dashboard/what-if`
3. No component code needs to change — the hooks and components already consume whatever `api.js` returns.

## Design tokens (in `src/index.css`)

- **Primary (forest green)** — healthy margin / on-track status
- **Amber** — warning zone (matches your Amber margin rule)
- **Red** — urgent / below-floor margin
- Fonts: Space Grotesk (headings), Inter (body/UI), JetBrains Mono (all numbers, so ₹ figures align cleanly)

Change a color once in `:root` inside `index.css` and it updates everywhere, on every page.
