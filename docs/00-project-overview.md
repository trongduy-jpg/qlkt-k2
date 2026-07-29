# 00 — Project Overview

> **Generated from source code.** Every statement below was verified against the current
> implementation (source, migrations, tests, config) — not from any prior document.
> Verified at commit `2fa1532` / branch `main`.

---

## Purpose

Give a new engineer (or AI agent) the shortest accurate mental model of what QLKT K2 is,
what it does for the business, and where to read next.

## Scope

**In scope:** business context, the nine functional modules, technology stack, repository
layout at the top level, and the documentation index.

**Out of scope:** implementation detail of any single module (see `03`–`08`), rules and
formulas (see `01`), and anything not currently built (see `15-future-roadmap.md`).

---

## Current implementation

### What the system is

QLKT K2 is an internal web application for **ASIANA GOLD**, a jewelry manufacturer.
It tracks precious-metal raw material (NVL) as it moves through the workshop:

1. A **production order** (LSX — *Lệnh sản xuất*) is opened for one or more product codes.
2. Material is **issued** to a worker at a **stage** (công đoạn), then **returned** after work.
3. The difference is **loss** (hao hụt) — the core number the business cares about, because
   loss above the allowed norm becomes a worker-compensation liability.
4. Loss is aggregated per stage/worker/material for reporting and period settlement.

All UI text and all domain vocabulary are **Vietnamese**. Code identifiers are English;
code comments are Vietnamese without diacritics. See `09-coding-standard.md`.

### The nine modules

| Route | Module | Purpose | Data state |
|---|---|---|---|
| `/` | Dashboard | KPI tiles + recent activity | Partly demo data |
| `/lenh-san-xuat` | Lệnh sản xuất | LSX header + per-SKU line items, close/reopen | Live |
| `/nhat-ky-nvl` | Nhật ký NVL | **Operational core** — material movement journal | Live |
| `/ghi-nhan-cong-doan` | Ghi nhận công đoạn | Fast per-stage entry shortcut | Live |
| `/gia-dinh-muc` | Giá & định mức | Price / loss-norm table | **Static placeholder** |
| `/ton-hop-tho` | Tồn hộp thợ | Worker-box balance reconciliation | Computed in browser |
| `/bao-cao-hao-hut` | Báo cáo hao hụt | Loss report | Live (derived) |
| `/audit-log` | Audit log | Recent activity, capped at 20 | Local only |
| `/cau-hinh` | Cấu hình | Master data CRUD (5 tabs) | Live, admin-only |

### Technology stack

Verified from `package.json`:

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | `^15.0.3` |
| UI runtime | React | `^19.0.0` |
| Language | TypeScript (`strict: true`) | `^5.6.3` |
| Styling | Tailwind CSS | `^3.4.15` |
| Icons | lucide-react | `^0.468.0` |
| Backend / DB | Supabase (Postgres + Auth) | `@supabase/supabase-js ^2.45.4` |
| Tests | Vitest (node environment) | `^4.1.10` |
| Hosting | Vercel | — |

**There is no server-side application layer.** No REST/GraphQL API, no ORM, no
controllers, no repositories, no server actions. The browser talks to Supabase directly
using the public anon key, and Postgres **Row Level Security is the authorization
boundary**. See `02-current-architecture.md` and `06-authentication.md`.

### Repository top level

```
app/          9 route stubs + root layout   (all pages return null — see 07)
components/   all UI + 6 state hooks        (8,649 lines)
lib/          services + business rules     (5,467 lines)
supabase/     26 SQL migrations             (1,444 lines)
tools/        two Node maintenance scripts
tasks/        task pipeline (backlog/active/review/done)
docs/         this documentation system
data/         original Google Sheets export (13 sheet groups, read-only reference)
```

### Documentation index

| File | Read it when you need… |
|---|---|
| `00-project-overview.md` | orientation (this file) |
| `01-business-rules.md` | formulas, statuses, what is enforced |
| `02-current-architecture.md` | how the app is wired end to end |
| `03-folder-structure.md` | where a given responsibility lives |
| `04-domain-model.md` | the entities and their relationships |
| `05-database.md` | tables, columns, RLS, migrations |
| `06-authentication.md` | login, whitelist, roles |
| `07-ui-navigation.md` | routing, module switching, drawers |
| `08-api-and-services.md` | the service-layer contract |
| `09-coding-standard.md` | conventions to follow when editing |
| `10-testing.md` | what is tested and how to run it |
| `11-deployment.md` | env vars, build, releasing, migrations |
| `12-ai-development-workflow.md` | how tasks flow through agents |
| `13-definition-of-done.md` | the completion gate |
| `14-known-limitations.md` | **read before changing behavior** |
| `15-future-roadmap.md` | what is planned and why |

---

## Important rules

1. **Source code is the only source of truth.** If a document disagrees with code, the
   code wins and the document is a bug — fix the document.
2. **The frontend accessing Supabase directly is the intended architecture**, not a defect
   to refactor away.
3. **Never treat anything under `docs/legacy/`, nor `.agents/**` or `.ai/**`, as
   authoritative.** They predate the current database and domain layer (all 26 migrations
   landed *after* those documents were written) and describe an architecture that was never
   built. `docs/legacy/` is retained only as historical business-analysis input — see
   `docs/legacy/README.md` for the migration table showing what superseded each file.
4. **Database changes are applied manually.** No migration runner exists; see `11-deployment.md`.
5. **Frontend validation is UX only.** Real enforcement is RLS + Postgres constraints.

---

## Related source code

- `package.json` — stack and scripts
- `app/layout.tsx` — the single mount point for the whole application
- `components/material-dashboard.tsx` — the orchestrator (884 lines)
- `lib/navigation.ts` — the nine module labels and their routes
- `CLAUDE.md`, `CLAUDE.local.md` — agent operating instructions

## Related database

Nine tables are actively used: `production_orders`, `production_order_items`,
`material_movements`, `materials`, `workers`, `production_stages`, `reference_options`,
`app_users`, `audit_logs`. `price_periods` exists and has RLS enabled but is never queried
by any `lib/*-service.ts` module. Roughly 24 further tables exist in migrations but are
never queried — see `05-database.md`.

## Known limitations

- Two modules are not production-ready: **Giá & định mức** is a static table with no
  persistence, and **Tồn hộp thợ** computes balances in the browser with placeholder
  values (`opening = 0`, `diff = 0`).
- **Audit log is write-only from the UI's perspective** — entries are inserted into
  `audit_logs` but the screen only renders in-memory events from the current session.
- Dashboard KPI tiles come from `lib/demo-data.ts`, not live queries.
- Full list: `14-known-limitations.md`.

## Future improvements

- Replace demo KPI tiles with live aggregates.
- Make Tồn hộp thợ a real reconciliation (period carry-forward + physical count entry).
- Build the price/norm module against the currently-unused `price_periods` table.
- See `15-future-roadmap.md` for sequencing and rationale.
