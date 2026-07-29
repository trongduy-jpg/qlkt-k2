# Goal

Add Row Level Security to (or explicitly drop) the roughly 24 tables created by migrations
`0002` and `0004` that currently have no RLS at all.

# Business value

These tables (planning/sales/settlement tables from `0002`: `process_stages`, `customers`,
`stores`, `products`, `sales_orders`, `sales_order_items`, `production_tasks`,
`material_requests`, `material_purchase_transactions`, `worker_box_balances`,
`inventory_period_balances`, `loss_norms`, `loss_settlements`, `refining_batches`; and the
worker-box ingestion schema from `0004`) are unused by the application today but are fully
open to anyone holding the public anon key — no authentication, no whitelist check, nothing.
Since the anon key ships in every browser bundle, this is a live, unauthenticated read/write
hole into the production database, even though the app itself never exercises it. Closing it
removes a real attack surface without the business needing to build anything new first.

# Current implementation

- Migrations `0002` and `0004` create the tables listed above with no accompanying `enable
  row level security` or policy statements.
- Migration `0010` later added the `<tbl>_whitelisted_access` policy pattern to eight
  *different* tables (`materials`, `workers`, `production_orders`, `material_movements`,
  `price_periods`, `audit_logs`, `production_stages`, `reference_options`), and `0022` added
  it to `production_order_items` — the `0002`/`0004` tables were never included.
- `lib/worker-box-service.ts` and `components/worker-box-view.tsx` — confirmed to never call
  Supabase; the Tồn hộp thợ module computes everything client-side from `material_movements`
  plus local fixtures, so the entire `0004` worker-box schema is provably dead from the
  application's perspective.
- Documented as `L-03` in `docs/14-known-limitations.md` and `docs/05-database.md`.

# Proposed improvement

For each of the ~24 tables, choose one of two paths per the existing `0010` pattern:
1. **Enable RLS with the same whitelist policy** used elsewhere
   (`is_whitelisted_user()`), if the table might still be used later (e.g. the worker-box
   ingestion tables, which have a plausible future per `docs/15-future-roadmap.md`); or
2. **Drop the table entirely** in a clearly-labelled cleanup migration, if it has no plausible
   near-term use and only adds attack surface and schema clutter.

Given the scope (24 tables) and mixed disposition, this task should start with **enabling
RLS on all of them** (the lower-risk, reversible option) as a single migration, deferring the
decision of which tables to actually drop to a separate, smaller follow-up task.

# Files likely affected

- New file: `supabase/migrations/00NN_rls_for_remaining_tables.sql`
- `docs/05-database.md` (update the RLS inventory and dead-schema section)
- `docs/14-known-limitations.md` (update/remove L-03)

# Risks

- Breadth: 24 tables in one migration increases the chance of a typo or missed table; a
  generated/scripted migration (looping the same policy statement per table name) reduces
  this risk versus hand-writing 24 blocks.
- None of these tables are read/written by the app today, so enabling RLS should have zero
  observable effect on current functionality — but this must be verified by exercising every
  module after the migration runs, not assumed.
- Requires the user to run the migration manually in the Supabase SQL editor plus
  `notify pgrst, 'reload schema';` — cannot be verified end-to-end without that step.
- Deciding to *drop* any of these tables (rather than just protect them) is a separate,
  higher-risk decision that should not be bundled into this task.

# Acceptance Criteria

- [ ] Every table created by migrations `0002` and `0004` has RLS enabled with the same
      whitelist policy pattern used in `0010`.
- [ ] No currently-working module's behavior changes (Nhật ký NVL, Lệnh sản xuất, Ghi nhận
      công đoạn, Tồn hộp thợ, Báo cáo hao hụt, Cấu hình, Audit log, Dashboard) — all continue
      to function identically after the migration.
- [ ] `docs/05-database.md`'s RLS inventory table is updated to reflect all tables now
      protected.
- [ ] `docs/14-known-limitations.md` L-03 is updated or removed.

# Testing Checklist

- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run test`
- [ ] `npm.cmd run build`
- [ ] Manual: exercise every module in the app after the migration runs and confirm no
      regressions (none of these tables should be touched, but this confirms the assumption).
- [ ] Manual: attempt an unauthenticated request against one of the previously-open tables
      (e.g. `customers`) and confirm it now returns 0 rows instead of full data.
- [ ] Confirm the migration was run via the Supabase SQL editor and
      `notify pgrst, 'reload schema';` was executed.

# Estimated Complexity
L
