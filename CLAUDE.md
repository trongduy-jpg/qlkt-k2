# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

QLKT K2 is a Next.js (App Router) + TypeScript demo app for tracking raw-material
progress, loss/waste (hao hụt), and compensation settlement in a jewelry
manufacturing workflow. UI text and domain terms are in Vietnamese.

## Commands

```bash
npm.cmd install          # PowerShell may block npm.ps1 — use npm.cmd on Windows
npm.cmd run dev           # dev server
npm.cmd run build         # production build
npm.cmd run start         # run built app
npm.cmd run lint          # next lint
npm.cmd run typecheck     # tsc --noEmit
npm.cmd run test          # vitest run (all tests)
npx vitest run lib/production-workflow.test.ts   # single test file
npm.cmd run db:reset          # tools/reset-supabase-data.mjs
npm.cmd run db:seed:master    # tools/seed-supabase-master-data.mjs
```

Supabase setup: create a project, run `supabase/schema.sql` then optionally
`supabase/seed.sql`, copy `.env.example` to `.env.local` and fill
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Details in
`supabase/README.md`. Without Supabase configured, the app falls back to demo
data in `lib/demo-data.ts`.

## Architecture

**This is a client-side SPA on purpose** — there is no backend service. The
browser talks directly to Supabase (Postgres + Auth) using the anon key. Row
Level Security (RLS) in Supabase is the real authorization boundary, not the
frontend.

- `app/*/page.tsx` files are intentionally empty (`return null`). Routing
  exists only so the URL and sidebar stay in sync. Do not add real UI or data
  fetching to these files.
- All real UI is mounted once via `MaterialDashboard` in `app/layout.tsx`,
  wrapped in `AuthProvider` / `AuthGate`.
- Data fetching happens client-side through hooks in `components/use-*.ts`
  (`use-operational-data.ts`, `use-production-orders.ts`,
  `use-material-movements.ts`, `use-master-data-crud.ts`, etc.) that call
  service modules in `lib/*-service.ts` (`material-service.ts`,
  `production-orders-service.ts`, `materials-service.ts`, `workers-service.ts`,
  `stages-service.ts`, `audit-log-service.ts`, ...). There are no Server
  Components/server-side data loading — don't introduce them.
- Business rules and calculations live in `lib/production-*.ts`
  (`production-business-rules.ts`, `production-workflow.ts`,
  `production-mappers.ts`, `production-helpers.ts`, `production-summary.ts`),
  `lib/domain/production.ts` (core types like `ProductionOrder`), and
  `lib/use-cases/*.ts` (draft-building logic, e.g.
  `material-movement-drafts.ts`). Keep components focused on
  display/interaction; put logic in these `lib/` modules instead of inline in
  components.
- `lib/supabase.ts` / `lib/supabase-mappers.ts` handle the Supabase client and
  row<->domain mapping.
- Drafts/local edits use `localStorage` persistence
  (`components/use-local-storage-persistence.ts`, `lib/master-data-drafts.ts`)
  layered on top of remote Supabase data — this draft/cache pattern is
  intentional; don't replace it with server-side state.
- Frontend validation (e.g. `validateMovementDraft`) exists for UX only. It
  never replaces backend validation (RLS policies + Postgres constraints).

## Domain shape

Core object is the `ProductionOrder` movement record (`lib/domain/production.ts`):
tracks a stage of work (`stage`, `worker`, `material`), quantities
(`issued`/`returned`/`powder`/`transferred`), and a derived `loss` computed as
`xuất - nhập - bột` (issued - returned - powder). Movements are chained across
production stages via `nxtLinkCode`/`nxtPeriod`/`lossPeriod`, and statuses
(e.g. `"Đang xử lý"`, `"Đang thực hiện"`, `"Treo nợ"`, `"Đã chốt"`) drive
workflow transitions in `production-workflow.ts`.

The `app/` route names are Vietnamese business screens, not generic routes:
`lenh-san-xuat` (production orders), `nhat-ky-nvl` (material journal),
`ghi-nhan-cong-doan` (stage entry), `gia-dinh-muc` (price/norms),
`ton-hop-tho` (raw material summary), `bao-cao-hao-hut` (loss report),
`audit-log`, `cau-hinh` (config/master data).

## Conventions

- TypeScript strict; avoid `any`, prefer `unknown` + validation for untrusted
  input, avoid unsafe casts/non-null assertions, explicit return types on
  exported functions, exhaustive switches, discriminated unions where useful.
- Name things after business intent (`calculateAvailableStock`, not
  `processData`/`Utils`/`Manager`). Booleans start with `is`/`has`/`can`/`should`.
  Use the same Vietnamese/English domain terms consistently across code, DB,
  and docs.
- Tests use Vitest (`*.test.ts`, e.g. `production-business-rules.test.ts`,
  `production-workflow.test.ts`, `production-summary.test.ts`), node
  environment, `@` alias resolves to repo root. Test observable behavior
  (calculations, workflow transitions), not implementation details.
- Never claim tests passed unless actually executed.
- Icon-only buttons need `aria-label` (mirroring `title` when present);
  filter/search inputs without a visible `<label>` need `aria-label`.
- Show loading/empty/error states consistently (`isLoadingRemote`,
  `remoteError`, "Chưa có dữ liệu" style empty states).

## Multi-agent workflow (this repo)

- Each task has exactly one implementation owner; Claude and Codex work on
  separate branches/worktrees. Don't work directly on `main` or `develop`,
  and don't merge/deploy unless explicitly instructed.
- Claude focuses on business-rule analysis, architecture/domain design, and
  correctness review. Codex focuses on implementation, Supabase/API
  integration, automated tests, and lint/build/typecheck.
- Before editing, confirm the assigned task's allowed paths; don't touch
  files owned by another active task. If two tasks need the same file, stop
  and report the conflict instead of editing.
- Note: `.agents/architecture.md`, `.agents/backend.md`, and
  `.agents/database.md` describe a Prisma-based modular-monolith/layered
  backend (controllers, use cases, repositories, PostgreSQL via Prisma). That
  does **not** describe this codebase — this app has no backend layer and no
  Prisma; treat `.agents/frontend.md`'s description (client-side SPA, direct
  Supabase access, RLS as the authorization boundary) as authoritative for
  actual architecture decisions here.
