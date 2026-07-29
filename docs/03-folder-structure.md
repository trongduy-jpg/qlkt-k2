# 03 — Folder Structure

> **Generated from source code.** Line counts are actual (`wc -l`) at the verified commit.

---

## Purpose

Let anyone locate the right file for a change in seconds, and make it obvious when a file
has grown beyond its intended responsibility.

## Scope

**In scope:** the full tree, per-file responsibility, line counts, dead files, and the
ownership rules that keep layers separate.

**Out of scope:** what the code does internally (`01`, `04`, `07`, `08`).

---

## Current implementation

### Tree

```
QLKT K2/
├── app/                          59 lines total — routing shell only
│   ├── layout.tsx                32   the single mount point
│   ├── globals.css                    theme + .shell-grid/.content-shell/.unified-stack
│   ├── page.tsx                    3   stub (Dashboard)
│   ├── lenh-san-xuat/page.tsx      3   stub
│   ├── nhat-ky-nvl/page.tsx        3   stub
│   ├── ghi-nhan-cong-doan/page.tsx 3   stub
│   ├── gia-dinh-muc/page.tsx       3   stub
│   ├── ton-hop-tho/page.tsx        3   stub
│   ├── bao-cao-hao-hut/page.tsx    3   stub
│   ├── audit-log/page.tsx          3   stub
│   └── cau-hinh/page.tsx           3   stub
│
├── components/                   8,649 lines — all UI + all stateful hooks
├── lib/                          5,467 lines — services + pure business logic
├── supabase/migrations/          1,444 lines — 26 SQL files, applied manually
├── tools/                        2 Node maintenance scripts
├── tasks/                        task pipeline: backlog → active → review → done
├── docs/                         this documentation system
└── data/                         original Google Sheets export (reference only)
```

### `components/` — UI and state

Views and drawers (one per module or dialog):

| File | Lines | Responsibility | Module |
|---|---|---|---|
| `material-dashboard.tsx` | **884** | orchestrator; owns ~25 `useState`, ~20 `useMemo`, wires 6 hooks | all |
| `app-shell.tsx` | 133 | sidebar nav, header, global error toast, sign-out | all |
| `dashboard-overview-view.tsx` | 185 | KPI tiles + recent tables | Dashboard |
| `production-orders-view.tsx` | 347 | LSX table + filters | Lệnh sản xuất |
| `production-order-detail-drawer.tsx` | 303 | LSX detail / inline edit slide-over | Lệnh sản xuất |
| `production-order-form-overlay.tsx` | 281 | full-screen create-LSX form | Lệnh sản xuất |
| `production-order-inline-edit-form.tsx` | 114 | same fields, embedded in the drawer | Lệnh sản xuất |
| `production-items-editor.tsx` | 211 | repeatable Mã hàng rows | shared by both LSX forms |
| `material-journal-view.tsx` | 333 | movement journal table + 5 filters | Nhật ký NVL |
| `material-movement-drawer.tsx` | **962** | movement create/edit; info tab + stage tab + per-worker blocks | Nhật ký NVL |
| `material-journal-print-dialog.tsx` | 526 | print/PDF layout builder | Nhật ký NVL |
| `stage-entry-view.tsx` | 243 | fast per-stage entry | Ghi nhận công đoạn |
| `price-table-view.tsx` | 44 | static price table | Giá & định mức |
| `worker-box-view.tsx` | **682** | worker-box balances, period selector, detail drawer | Tồn hộp thợ |
| `loss-report-view.tsx` | 63 | loss table + JSON export | Báo cáo hao hụt |
| `audit-log-view.tsx` | 39 | last 20 local audit events | Audit log |
| `master-data-settings-view.tsx` | **569** | 5 CRUD tabs | Cấu hình |
| `login-view.tsx` | 79 | magic-link email form | pre-auth |
| `production-ui.tsx` | 435 | 10 shared primitives (see below) | all |

Contexts and hooks:

| File | Lines | Owns | Returns |
|---|---|---|---|
| `auth-context.tsx` | 83 | Supabase session → `appUser`, `deniedEmail` | `useAuth()` |
| `auth-gate.tsx` | 16 | gate: `LoginView` vs children | — |
| `master-data-context.tsx` | 69 | ~45 master-data fields for the settings screen | `useMasterData()` |
| `use-operational-data.ts` | 218 | all remote collections + loading/error | `reloadOperationalData` + setters |
| `use-material-movements.ts` | 455 | `draft`, `editingMovementId`, form open/tab, save notice | movement CRUD handlers |
| `use-production-orders.ts` | 567 | `productionHeaderDraft`, `editingProductionCode` | LSX draft/save handlers |
| `use-selected-production-order.ts` | 277 | *no `useState`* — only `useMemo`/`useRef` | selected-order derivations, close/reopen |
| `use-master-data-crud.ts` | 402 | 5 drafts + 5 editing ids | ~28 CRUD handlers |
| `use-local-storage-persistence.ts` | 129 | `hasLoadedStorage` | read/write of 5 cache keys |

Shared primitives exported from `production-ui.tsx`:
`fieldControlClass`, `DateInput`, `FieldShell`, `DrawerHeaderMeta`, `SelectControl`,
`SearchableSelect`, `InfoMetric`, `DetailGroup`, `DetailInlineList`, `DrawerSection`.

### `lib/` — services and business logic

Three distinct kinds of module live here; keep them distinct.

**A. Data access (`*-service.ts`)** — the only files allowed to touch Supabase:

| File | Lines | Domain |
|---|---|---|
| `supabase.ts` | 10 | client + `isSupabaseConfigured` |
| `material-service.ts` | 62 | **barrel re-export** — the single import point for all services |
| `material-movements-service.ts` | 408 | `material_movements` CRUD (largest service) |
| `production-orders-service.ts` | 214 | LSX headers |
| `production-order-items-service.ts` | 152 | LSX line items |
| `materials-service.ts` | 64 | NVL master data |
| `workers-service.ts` | 72 | worker master data + `buildWorkerCode` |
| `stages-service.ts` | 60 | stage master data |
| `reference-options-service.ts` | 56 | shared dropdown vocabularies |
| `auth-service.ts` | 111 | magic link, whitelist, `app_users` CRUD |
| `audit-log-service.ts` | 12 | insert-only audit writer |
| `database-health-service.ts` | 51 | row counts for the dashboard |
| `supabase-mappers.ts` | 121 | DB row ↔ domain object, `toDbStatus`/`fromDbStatus` |

**B. Pure business logic** — no React, no Supabase, fully testable:

| File | Lines | Contents |
|---|---|---|
| `production-business-rules.ts` | 253 | codes, periods, purity, stage normalization, rule gates |
| `production-summary.ts` | 367 | `buildOrderSummaries`, `buildLossReportRows`, stage progress |
| `production-workflow.ts` | 291 | filters, overview, `buildSelectedOrderDetail`, aggregates |
| `production-helpers.ts` | 72 | status vocabulary, `isClosedStatus`, validation, formatters |
| `production-mappers.ts` | 357 | draft/header/movement merge + factory functions |
| `production-journal-options.ts` | 374 | every dropdown vocabulary and the stage catalog |
| `worker-box-service.ts` | 328 | worker-box computation, filtering, paging (**no Supabase**) |
| `use-cases/material-movement-drafts.ts` | 140 | draft- and seed-movement construction |
| `master-data-drafts.ts` | 59 | reference-list keys and empty drafts |

**C. Types** — `domain/production.ts` (48), `production-types.ts` (139),
`material-service-types.ts` (137).

**D. Data fixtures / leftovers:**

| File | Lines | Status |
|---|---|---|
| `demo-data.ts` | 86 | **live** — seeds offline mode and dashboard KPIs; contains stale code format `DHAG-26/03/02` |
| `worker-box-data.ts` | 350 | **live** — hard-coded worker-box fixtures used as the default source |
| `google-sheet-blueprint.ts` | 213 | **dead — zero importers.** Safe to delete |
| `navigation.ts` | 25 | live — module/route mapping |

### `supabase/migrations/` — 26 files, applied by hand

Numbered `0001`–`0026`. Two pairs cancel out: `0015`↔`0016` (stage list), `0019`↔`0020`
(`product_qty`), and `0016` was itself reverted by `0017`. Full history in `05-database.md`.

### `tasks/` — the work pipeline

```
tasks/
├── backlog/   material-movement.md (a multi-item technical backlog)
├── active/    REL-3-stop-silent-column-fallback.md
├── review/    (empty)
└── done/      REL-1-resync-after-delete-failure.md
```

Task file format is fixed — see `12-ai-development-workflow.md`.

---

## Important rules

1. **File ownership by layer.** A service may not import React; a business-rule module may
   not import Supabase or a service; a view may not call a service directly (go through a hook).
2. **Import services through the barrel** `@/lib/material-service`, not the individual files —
   that indirection is deliberate so files can be split without touching call sites.
3. **New business logic goes in `lib/`**, not in a component or hook. If it can be expressed
   as a pure function of its inputs, it belongs in `lib/` and should get a test.
4. **Path alias:** `@/*` maps to the repo root (`tsconfig.json`), so imports are
   `@/lib/...`, `@/components/...`.
5. **Naming:** views `*-view.tsx`, slide-overs `*-drawer.tsx`, full-screen `*-overlay.tsx`,
   hooks `use-*.ts`, data access `*-service.ts`, pure rules `production-*.ts`.
6. **Do not add files to `app/`** other than routing shells.

## Related source code

- `tsconfig.json` — `strict`, `@/*` alias, `moduleResolution: "bundler"`
- `tailwind.config.ts` — content globs cover `app/`, `components/`, `lib/`
- `lib/material-service.ts` — the barrel, and the map of which service owns what

## Related database

Folder structure maps onto tables through the services in group A above; each
`*-service.ts` owns exactly one table (except `material-movements-service.ts`, which also
upserts `production_orders`, `materials`, and `workers` as a side effect of saving a
movement — see `08-api-and-services.md`).

## Known limitations

- **Four files exceed 500 lines** and hold several responsibilities each:
  `material-movement-drawer.tsx` (962), `material-dashboard.tsx` (884),
  `worker-box-view.tsx` (682), `use-production-orders.ts` (567),
  `master-data-settings-view.tsx` (569), `material-journal-print-dialog.tsx` (526).
- `lib/google-sheet-blueprint.ts` (213 lines) is entirely unreferenced.
- `production-ui.tsx` mixes a 187-line combobox with six display shells in one module.
- The nav label list is **duplicated** in `lib/navigation.ts` and `app-shell.tsx:17-27`;
  they can drift.
- `production-order-form-overlay.tsx` and `production-order-inline-edit-form.tsx` render
  the same field set twice.
- `use-production-orders.ts` contains mapper logic (`normalizeProductionHeaderDraft`,
  `toProductionHeaderInput`, `applyPrimaryItem`) that belongs in `lib/production-mappers.ts`.

## Future improvements

1. Delete `lib/google-sheet-blueprint.ts`.
2. Extract `SearchableSelect` into its own file and give it accessibility support.
3. Split `master-data-settings-view.tsx` into one component per tab.
4. Derive `app-shell.tsx`'s nav from `lib/navigation.ts` to remove the duplicate list.
5. Move mapper functions out of `use-production-orders.ts` into `lib/production-mappers.ts`.
6. Unify the two LSX form components behind one shared field-set component.
