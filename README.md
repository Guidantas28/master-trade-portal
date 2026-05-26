# Fixfy Trade Portal

Desktop web app for **trades (partners)** to receive distributed leads and manage their
work — the supply-side counterpart to the Fixfy partner mobile app. Built from the
`trade-portal` design handoff (Claude Design) and brand-matched to Fixfy OS (`master-os`).

Stack: **Next.js 16 · React 19 · TypeScript**. The UI is ported faithfully from the
design prototype using inline styles + a shared token object (`src/lib/tokens.ts`), with
icons from `lucide-react`. No Tailwind — the design is token/inline-style driven.

## Status

- **UI-first**: every screen renders from typed mock data (`src/lib/mock-data.ts`),
  shaped to the Fixfy OS Supabase structure (`src/types`). See
  [`src/lib/supabase/README.md`](src/lib/supabase/README.md) for the data-wiring plan.
- **Dev-open**: no auth gate yet. Partner authentication (reusing master-os
  `partner-portal-session`) is a follow-up step.
- **Same database**: intended to reuse the master-os Supabase project/schema (the new
  app only needs the env vars in `.env.example` pointed at it).

## Screens

Dashboard · Leads · Available jobs · Available quotes · My jobs (board / list / map) ·
Job drawer (overview / checklist / photos / notes / sign-off) · Schedule
(month / week / day / agenda) · Settings (10 pages) · Onboarding (11 steps).

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
```

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

## Structure

```
src/
  app/            layout (Geist fonts) + globals.css + page (mounts the SPA)
  components/
    app.tsx       root shell: sidebar + topbar + screen router + overlays
    ui/           primitives (Button, Card, Badge, Input, Tabs, Modal…), Icon, Toast
    shell/        Sidebar, TopBar
    screens/      dashboard, opportunities, jobs, job-drawer, schedule, settings, onboarding
  lib/            tokens, format, mock-data, supabase client (for wiring phase)
  types/          domain types (mapped to master-os tables)
```
