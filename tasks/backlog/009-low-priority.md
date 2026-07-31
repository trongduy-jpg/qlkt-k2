# Goal

**Surface the master-data foreign keys that the database already stores** into the domain layer,
additively and read-only:

1. Add `material_id` and `worker_id` to `MOVEMENT_SELECT_COLUMNS` in
   `lib/material-movements-service.ts` (the **full** select only — **not** the reduced
   `MOVEMENT_SELECT_COLUMNS_FALLBACK`).
2. Add `materialId?: string` and `workerId?: string` to `ProductionOrder`
   (`lib/domain/production.ts`) — both **optional**, because the fallback select path will not
   return them.
3. Populate both in `movementRowToProductionOrder` (`lib/supabase-mappers.ts`), adding
   `material_id?: string | null` and `worker_id?: string | null` to the `MovementRow` type.
4. **Preserve every existing name field exactly** — `material`, `worker`, `stage`,
   `sourceMaterialName`, `sourceName`, and all other mapped fields keep their current values and
   behavior.

This is a purely additive read-path change. It makes the stable ids *available* to the domain
layer for the first time, so a later — separately decided — switch to id-based references has
something to build on. It changes no runtime behavior.

# Business value

`material_movements` **already** stores `material_id` and `worker_id` as `not null` foreign keys
(`supabase/migrations/0001_schema.sql:31-33`), so the persisted layer is already referentially
correct and enforced. But the read path never selects them: `MOVEMENT_SELECT_COLUMNS` pulls
`order_id` plus joined `materials(name)` / `workers(full_name)`, and
`movementRowToProductionOrder` maps only the names. The result is a **name → id → name round
trip** in which the id is resolved on write and then discarded on read, leaving the domain layer
with no stable handle on master data.

Surfacing the ids costs nothing, breaks nothing, and unblocks every later improvement that needs
them (id-keyed aggregation, id-based form values, orphan detection) without committing to any of
those decisions now.

### Correction to this task's original rationale

The original version of this task claimed that *"renaming a material or worker in the Cấu hình
screen orphans every historical movement that referenced the old name."* **That is incorrect and
must not be used to justify work here.** Verified:

- `updateWorker` (`lib/workers-service.ts`) and `updateMaterial` (`lib/materials-service.ts`)
  both perform `update … .eq("id", id)` — an **in-place rename that preserves the id**.
- Movements link to master data by `worker_id` / `material_id`, and the read path joins
  `workers(full_name)` / `materials(name)`, which return the **current** name.
- Therefore a rename orphans **nothing**: every historical movement automatically displays the
  new name, and aggregation over loaded rows stays internally consistent.

**The narrower real risk** is a stale, name-only draft cached in `localStorage`
(`qlkt-k2-movement-draft-cache`): if a master record is renamed while such a draft exists, saving
that draft later re-resolves the *old* name — which, on the write path, either auto-creates a
worker or silently substitutes a material. That risk lives entirely in the write path and is
**out of scope here** (see Deferred and Separate Higher-Priority Bug below).

# Current implementation

- **Database (already id-based):** `material_movements.material_id uuid not null references
  materials(id)` and `worker_id uuid not null references workers(id)`
  (`supabase/migrations/0001_schema.sql:32-33`). Nothing to add, nothing to backfill.
- **Read path:** `MOVEMENT_SELECT_COLUMNS` (`lib/material-movements-service.ts`) selects
  `order_id` and joins `materials(name)`, `workers(full_name)` — **but not `material_id` /
  `worker_id`**. `MOVEMENT_SELECT_COLUMNS_FALLBACK` is the reduced 11-entry degraded select used
  when PostgREST reports a missing column (see L-05).
- **Domain:** `ProductionOrder` has `material: string`, `worker: string`, `stage: string`, and
  `orderId?: string` — no `materialId` / `workerId` / `stageId`.
- **Mapper:** `MovementRow` (`lib/supabase-mappers.ts`) declares `order_id?: string | null` but
  no `material_id` / `worker_id`; `movementRowToProductionOrder` maps
  `row.materials?.name` → `material` and `row.workers?.full_name` → `worker`.
- **Master-data domain types already carry ids:** `MaterialMaster.id`, `WorkerMaster.id`,
  `StageMaster.id`, `ReferenceOption.id` (`lib/material-service-types.ts:6-39`), and every
  `load*` selects them. The gap is only in the movement object.
- **UI already has the ids in hand and discards them:**
  `components/material-movement-drawer.tsx` and `components/stage-entry-view.tsx` render
  `<option key={worker.id} value={worker.full_name}>`; `components/production-items-editor.tsx`
  renders `<option key={material.id} value={material.name}>`. **All three stay as-is.**
- **Stage references are a different shape and out of scope:** movements store
  `process_name` (a *label*), matched by `normalizeStageCode()`. A `stage_id` column exists
  (added `0002`, indexed `0005`) but references the **dead** `process_stages` table and is never
  written or read. No `stageId` is introduced by this task.
- **Neither `materials.name` nor `workers.full_name` has a unique constraint** anywhere in the 26
  migrations (only `materials.code` and `workers.worker_code` are unique). This matters for the
  write path, not for this read-only change.

# Proposed improvement

Exactly the four steps in the Goal. Nothing else.

### Write behavior remains completely unchanged

- **`getMaterialId` is untouched** — including its `materialCodeByName` map and its `"AU750"`
  default (see Separate Higher-Priority Bug).
- **`upsertWorker` is untouched** — it still resolves by `full_name` and still auto-creates a
  worker when no match is found.
- **Form values remain names.** No `<option value>` changes from a name to an id anywhere.
- **`localStorage` draft shape is unchanged.** The new fields are optional, so drafts cached
  under the current name-only shape continue to load and save exactly as before.
- **No aggregation is re-keyed.** `buildLossReportRows` (`lib/production-summary.ts`) keeps its
  `stage::worker::material::status` key, and `lib/worker-box-service.ts` keeps its
  `periodCode::worker::stage::metal::goldAge` key and its `full_name`-matching worker-code
  lookup.
- **No write path, service signature runtime contract, persisted value, schema, migration, or RLS
  policy changes.**

# Files likely affected

- `lib/material-movements-service.ts` — add two column names to `MOVEMENT_SELECT_COLUMNS` only
- `lib/supabase-mappers.ts` — two optional fields on `MovementRow`; two mapped fields in
  `movementRowToProductionOrder`
- `lib/domain/production.ts` — `materialId?: string`, `workerId?: string`
- A new or extended test file covering the mapper
- `docs/04-domain-model.md`, `docs/08-api-and-services.md` — record that the ids are now surfaced
  on reads while writes remain name-resolved

**Explicitly untouched:** every component, every form, `getMaterialId`, `upsertWorker`,
`lib/production-summary.ts`, `lib/worker-box-service.ts`, `MOVEMENT_SELECT_COLUMNS_FALLBACK`,
all migrations, RLS.

# Risks

- **Very low.** Two optional fields and two column names; no consumer is required to read them,
  and every existing field keeps its value.
- The fields are `undefined` on the degraded fallback path by design. Any future consumer must
  treat them as optional — do **not** add a non-null assertion or a cast to work around this.
- The main risk is scope creep: it is tempting to "finish the job" by switching form values to
  ids, re-keying aggregation, or fixing the AU750 substitution while in these files. All three are
  forbidden here (see the stopping rule).

# Acceptance Criteria

- [ ] `MOVEMENT_SELECT_COLUMNS` includes `material_id` and `worker_id`;
      `MOVEMENT_SELECT_COLUMNS_FALLBACK` is **unchanged**.
- [ ] `ProductionOrder` gains `materialId?: string` and `workerId?: string`, both optional.
- [ ] `MovementRow` gains `material_id?: string | null` and `worker_id?: string | null`.
- [ ] `movementRowToProductionOrder` populates `materialId` / `workerId` when the row returns
      them.
- [ ] Both fields are `undefined` when the row does not carry them (the fallback select path) —
      no empty-string coercion, no assertion, no cast.
- [ ] **Existing `material` and `worker` display names are unchanged** — still sourced from the
      joined `materials(name)` / `workers(full_name)`.
- [ ] **Every other field mapped by `movementRowToProductionOrder` is byte-for-byte unchanged.**
- [ ] No change to: any write path (`getMaterialId`, `upsertWorker`, `upsertProductionOrder`,
      create/update movement), any UI form value, any persisted value, any service runtime
      contract, database schema, migration, RLS policy, workflow, status transition, rendered
      label, or `localStorage` draft shape.
- [ ] No aggregation key in `production-summary.ts` or `worker-box-service.ts` is re-keyed.
- [ ] `docs/04-domain-model.md` and `docs/08-api-and-services.md` state that reads now surface
      `materialId` / `workerId` while writes still resolve master data **by name**.

# Testing Checklist

- [ ] `npm.cmd run lint` — 0 errors, 0 warnings (current clean baseline must hold).
- [ ] `npm.cmd run typecheck` — passes.
- [ ] `npm.cmd run test` — the existing **95 tests across 5 files** pass **unmodified**.
- [ ] `npm.cmd run build` — passes.
- [ ] **New:** `movementRowToProductionOrder` returns both ids when the row supplies
      `material_id` and `worker_id`.
- [ ] **New:** the same function leaves both `undefined` when the row omits them (fallback path),
      and does not throw.
- [ ] **New:** a field-by-field assertion that every pre-existing mapped field
      (`material`, `worker`, `stage`, `status`, weights, periods, `orderId`, document fields,
      issue/return blocks, …) is unchanged for an identical input row.
- [ ] Manual: load Nhật ký NVL with Supabase configured and confirm displayed material/worker
      names, filters, the loss report, and Tồn hộp thợ are all visually identical to before.

## Deferred — Human Decision Required

None of the following may be implemented as part of this task.

- **Whether a brand-new worker may still be typed and auto-created on save.** `upsertWorker`
  creates a worker whenever `full_name` does not match, so a typo silently produces a new record.
  Changing that requires deciding between: keep auto-create, prompt for confirmation, or block
  the save. This is the crux of the original task and is a product decision.
- **How an invalid or unknown id/name should behave** once ids are actually used as references —
  reject, fall back to a default, or surface a warning. No silent substitution may be introduced.
- **Migration strategy for name-only `localStorage` drafts** (`qlkt-k2-movement-draft-cache`,
  `qlkt-k2-production-header-draft-cache`). Drafts cached before any id-based switch carry no
  `materialId` / `workerId`; a decision is needed on whether to resolve them lazily, drop them,
  or keep supporting the name path indefinitely.
- **When UI option values may switch from names to ids** — affects
  `material-movement-drawer.tsx`, `stage-entry-view.tsx`, `production-items-editor.tsx`, and
  interacts with the auto-create decision above. Note `SelectControl`
  (`components/production-ui.tsx`) is non-generic (`value: string`) and used in ~25 places, so
  this is a broader refactor than it appears.
- **Whether `buildLossReportRows` and `worker-box-service.ts` should eventually group by ids**
  instead of names. Current name-keying is correct today (renames are id-preserving, so joined
  reads keep all rows for one worker under one current name), but id-keying would be more robust
  against duplicate-name master data.
- **Live data checks required before any of the above** — an agent cannot run these (anon key +
  RLS block unauthenticated reads):
  - `select name, count(*) from materials group by name having count(*) > 1;`
  - `select full_name, count(*) from workers group by full_name having count(*) > 1;`
    Duplicate names would mean the existing `.eq("name"/"full_name", …).maybeSingle()` lookups are
    already erroring, since neither column is unique.
  - `select count(*) from material_movements where material_id is null or worker_id is null;`
    Expected `0` given the `not null` FKs — confirms it before anything relies on the columns.

## Separate Higher-Priority Bug

**`getMaterialId` may silently substitute the wrong material.**
In `lib/material-movements-service.ts`, `getMaterialId(materialName)`:

1. looks up `select id from materials where name = <materialName>`; if found, uses it;
2. otherwise falls back to a **hard-coded 4-entry map** (`materialCodeByName`: `Vàng 24K`,
   `Vàng 18K`, `Platinum 900`, `Bạc 92.5`) **defaulting to `"AU750"`**, and looks up that code;
3. throws only if *that* code lookup fails.

So a movement saved with any material name outside those four — a typo, a renamed material, a
value from a stale cached draft, or simply a material added later via Cấu hình — is silently
persisted against **`AU750` (Vàng 18K)**. No error, no warning, and the wrong `material_id` is
written to a `not null` FK column, so the row looks perfectly valid afterwards.

This is a **data-integrity defect independent of the id refactor**, and it is more severe than the
read-only improvement in this task:

- It **must not be fixed inside this task.** Touching `getMaterialId` would make this task a write
  path change and void its SAFE_AUTOMATION classification.
- **Recommendation:** raise it as its own **high-priority** backlog item, ahead of this one. That
  task will need the same duplicate-name data check listed above, plus a decision on the correct
  behavior for an unrecognized material (throw, prompt, or create) — which is why it is not
  automatable either.
- Related: `upsertWorker` writes the **legacy singular `workers.stage` column** rather than the
  `stages text[]` array introduced by migration `0014`. Worth folding into that same follow-up.

# Hard stopping rule

Stop immediately, revert the in-progress edit, and report — do not work around it — if
implementation requires any of:

- changing any write path (`getMaterialId`, `upsertWorker`, `upsertProductionOrder`,
  `createMaterialMovement`, `updateMaterialMovement`) or any persisted value;
- changing any UI form value, `<option value>`, or making `SelectControl` generic;
- changing the `localStorage` draft shape or adding draft migration logic;
- re-keying any aggregation in `lib/production-summary.ts` or `lib/worker-box-service.ts`;
- any database schema change, migration, or RLS policy edit;
- changing a service function's runtime contract or any API behavior;
- adding a type assertion or non-null assertion to make the optional ids compile;
- modifying an existing test to accommodate the new fields.

Reaching any of these means the scope was mis-drawn — report the specific site instead of
adapting to it.

# Estimated Complexity
S

*(Reduced from L: the full id-based-reference refactor — form values, write-path resolution,
aggregation keys, draft migration — is deferred, leaving only an additive read-path change.)*

# Implementation record — read-path scope **implemented, awaiting review**

The additive read-only scope has been implemented. The **Deferred** and **Separate
Higher-Priority Bug** sections above remain **fully open** — no write path, UI, `localStorage`,
or aggregation work was done, and the AU750 substitution was not touched.

| Item | Result |
|---|---|
| `MOVEMENT_SELECT_COLUMNS` | `material_id` and `worker_id` added beside `order_id` |
| `MOVEMENT_SELECT_COLUMNS_FALLBACK` | **unchanged** — still omits both, so the ids are `undefined` on the degraded path |
| `ProductionOrder` | added `materialId?: string`, `workerId?: string` (optional); `material` / `worker` name fields unchanged |
| `MovementRow` | added `material_id?: string \| null`, `worker_id?: string \| null` |
| `movementRowToProductionOrder` | added `materialId: row.material_id ?? undefined`, `workerId: row.worker_id ?? undefined` — `?? undefined`, deliberately **not** `?? ""` like the adjacent `orderId`. No existing mapped field altered |
| `mergeMovementResult` | **no change needed** — it spreads `...mapped` and does not re-pin `material`/`worker`/`materialId`/`workerId`, so the ids flow through |
| New tests | `lib/supabase-mappers.test.ts` — 8 tests, incl. two complete field-by-field `toEqual` assertions (full row + fallback row) |
| Write path | `getMaterialId` (incl. the `AU750` fallback), `upsertWorker`, `upsertProductionOrder`, create/update: **all untouched** |

Not done, still deferred: id-based write resolution, UI option values, `localStorage` draft
migration, id-keyed aggregation, and the AU750 substitution defect.

# Classification

**SAFE_AUTOMATION** for the narrowed read-only scope above.

Justification: the database already stores both foreign keys as `not null`, so nothing is
invented, migrated, or backfilled; the change adds two optional domain fields and two column names
to one select constant; every existing mapped field, every write path, every form value, every
aggregation key, and the `localStorage` shape are untouched; the new fields being `undefined` on
the degraded fallback path is expected and asserted rather than papered over with a cast. The two
genuinely ambiguous areas — write-path behavior and UI form values — are excluded by scope and
recorded under Deferred, and the AU750 defect is quarantined into its own follow-up rather than
bundled in.
