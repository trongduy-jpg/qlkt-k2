# Goal

Replace `type Status = string` with a **single, exact four-value union for the loss-status
domain only**, derived from a `LOSS_STATUSES` const array — so a typo in a loss-status literal
becomes a compile error instead of a silent runtime mismatch.

**Scope is deliberately narrow.** Stage status, delivery status, and price-approval status are
**explicitly deferred** (see the Deferred section) because their persisted vocabularies cannot
be verified from this repository. This task must not change workflow behavior, labels,
transitions, database schema, migrations, RLS, or any API contract.

# Business value

`Status` governs the most important state machine in the system, yet it is typed `string`, so a
typo in a status literal compiles cleanly and fails silently at runtime (a comparison that never
matches, or a value rendered as an unrecognized label). The loss-status vocabulary is the one
axis where a union is provably safe today, because the database boundary already normalizes
unknown values. Narrowing it converts an entire class of easy-to-introduce bugs into compile
errors, at the cost of a mechanical, low-creativity refactor.

# Current implementation

- `lib/domain/production.ts:3` — `export type Status = string;` (not a union).
- The real loss-status vocabulary is **exactly four values**, hard-coded in source (no
  database-driven status list exists — the 8 `getDynamicOptions` list keys are all
  material/source/destination/gold-age lists, never a status list):
  `"Đang xử lý"`, `"Treo nợ"`, `"Xác định"`, `"Đã chốt"`.
- `lib/production-helpers.ts` — `statusOptions: Array<Status | "Tất cả">` (the filter sentinel is
  already modelled separately), `statusClass: Record<Status, string>` (exactly the 4 keys),
  `getSummaryStatus`, `isClosedStatus`.
- `lib/production-journal-options.ts` — `movementLossStatusOptions` is a deliberate **subset**
  (`Treo nợ`, `Xác định`) used by the movement drawer.
- `lib/supabase-mappers.ts` — the DB boundary. `statusToDb: Record<Status, string>` maps the 4
  values to `dang_xu_ly` / `treo_no` / `xac_dinh` / `da_chot`; `statusFromDb` maps back.
  **`toDbStatus` falls back to `"dang_xu_ly"` and `fromDbStatus` falls back to `"Đang xử lý"`
  for any unrecognized input** — this pre-existing coercion is what makes a union sound here,
  and it must be preserved byte-for-byte.
- `lib/production-order-items-service.ts` routes `production_order_items.status` through the same
  `fromDbStatus`/`toDbStatus` pair; DB default is `'dang_xu_ly'` (migrations `0001`, `0024`).
- **Not** part of this vocabulary and **not** in scope:
  - `stageStatus` — typed plain `string` (`lib/domain/production.ts:15`), persisted **raw**
    (`stage_status: order.stageStatus || null`), read with a null-only fallback.
  - `deliveryStatus` — typed plain `string` everywhere, persisted **raw**
    (`delivery_status: input.deliveryStatus || null`), read as `String(row.delivery_status ?? "")`.
  - Price-approval values (`Đã duyệt` / `Chờ duyệt` / `Nháp`) — untyped `priceRows` in
    `lib/demo-data.ts`, backing the static placeholder module (L-11).
  - Worker-box `reviewStatus` / `debtStatus` — already proper unions, English, unrelated.
- **No CHECK constraint exists on any status column** in any of the 26 migrations.

# Proposed improvement

1. In `lib/domain/production.ts`, introduce the const array as the single source of truth and
   derive the type from it (never hand-duplicate the literals):

   ```ts
   export const LOSS_STATUSES = ["Đang xử lý", "Treo nợ", "Xác định", "Đã chốt"] as const;
   export type LossStatus = (typeof LOSS_STATUSES)[number];
   ```

2. Replace `Status` with `LossStatus` **only** on fields that carry the loss-status vocabulary:
   `ProductionOrder.status`, the three `status: Status` fields in `lib/production-types.ts`, the
   two `status?: Status` fields in `lib/material-service-types.ts`, `StageEntryDraft.status`, and
   the `Status`-typed parameters/returns in `production-helpers.ts`,
   `production-business-rules.ts`, `production-summary.ts`, `production-workflow.ts`,
   `production-mappers.ts`, `use-cases/material-movement-drafts.ts`, `supabase-mappers.ts`,
   `production-order-items-service.ts`, `production-orders-service.ts`,
   `material-movements-service.ts`.

3. Derive `statusOptions` from `LOSS_STATUSES` (plus the existing `"Tất cả"` sentinel) so the
   type and the dropdown cannot drift. Leave `movementLossStatusOptions` as the explicit 2-value
   subset it already is.

4. Keep `export type Status = LossStatus` as a **temporary deprecated alias** so the ~26
   importing files can be migrated in reviewable steps rather than one sweep. Mark it
   `@deprecated` with a comment pointing to `LossStatus`. Removing the alias is a follow-up, not
   part of this task.

5. `Record<Status, string>` maps (`statusToDb` in `supabase-mappers.ts`, `statusClass` in
   `production-helpers.ts`) become **exhaustive** under the union — both already contain exactly
   the 4 keys, so they require no edit and gain compile-time completeness checking. This is a
   benefit, not a risk.

6. The four `as Status` assertions on **literal** values in `lib/demo-data.ts` (`:22`, `:35`,
   `:48`, `:61`) become unnecessary under the union. Removing them is optional and safe; each
   asserted literal is a valid member.

### Explicitly out of scope for this task

- The three `as Status` assertions on **dynamic** values —
  `components/material-movement-drawer.tsx:858`, `components/stage-entry-view.tsx:213`,
  `components/use-material-movements.ts:106` — are **left exactly as they are**. They continue to
  compile under the union (asserting `string` to a narrower union is permitted), so this task
  introduces no new unsafe assertion and changes no runtime behavior. They cannot be replaced
  with real narrowing here because `SelectControl` (`components/production-ui.tsx:122`) is
  non-generic (`value: string`, `onChange: (value: string) => void`) and is used in ~25 places;
  making it generic is a separate refactor, and adding a runtime guard requires the
  invalid-value decision recorded in the Deferred section. Runtime risk today is nil — the select
  can only emit an option it rendered from the status option arrays. **Do not "fix" these three
  sites as part of this task, and do not add any new assertion.**
- Any change to `stageStatus`, `deliveryStatus`, or price-approval status.

# Files likely affected

- `lib/domain/production.ts` — `LOSS_STATUSES`, `LossStatus`, deprecated `Status` alias
- `lib/production-helpers.ts` — `statusOptions` derivation, `statusClass`, `getSummaryStatus`,
  `isClosedStatus`
- `lib/supabase-mappers.ts` — `statusToDb`, `statusFromDb`, `toDbStatus`, `fromDbStatus` signatures
  (behavior unchanged)
- `lib/production-types.ts`, `lib/material-service-types.ts` — field types
- `lib/production-business-rules.ts`, `lib/production-summary.ts`, `lib/production-workflow.ts`,
  `lib/production-mappers.ts`, `lib/use-cases/material-movement-drafts.ts` — signatures
- `lib/production-order-items-service.ts`, `lib/production-orders-service.ts`,
  `lib/material-movements-service.ts` — signatures only
- `lib/demo-data.ts` — optional removal of 4 now-redundant literal assertions
- `components/stage-entry-view.tsx` — `StageEntryDraft.status` type only (not the `onChange` site)
- `components/use-production-orders.ts`, `components/use-selected-production-order.ts`,
  `components/material-dashboard.tsx` — type-only follow-through
- `docs/04-domain-model.md`, `docs/01-business-rules.md`, `docs/09-coding-standard.md` — update the
  `Status = string` weakness notes to describe `LossStatus`, and state that stage/delivery status
  remain `string` with the reason

# Risks

- **Breadth, not depth.** `Status` is imported by ~26 files; each edit is mechanical, but a missed
  call site is easy. Mitigated by `typecheck` — the compiler enumerates every site.
- **Must not weaken the DB boundary.** `fromDbStatus`/`toDbStatus`'s unknown-value fallbacks are
  the reason this narrowing is sound. Removing, tightening, or "improving" them would change how
  legacy rows are read and is out of scope.
- **Must not touch the three dynamic assertion sites** (see above) — doing so pulls in the
  deferred invalid-value decision and turns a type-only change into a behavior change.
- **No new type assertions.** If a site cannot be typed without an assertion, stop and report it
  rather than asserting; that is a signal the scope was mis-drawn.
- Zero database, migration, RLS, or wire-format impact: the persisted snake_case values and the
  mapping functions' behavior are unchanged.

# Acceptance Criteria

- [ ] `LOSS_STATUSES` exists as an `as const` array containing **exactly** the four values
      `"Đang xử lý"`, `"Treo nợ"`, `"Xác định"`, `"Đã chốt"` — no additions, no removals.
- [ ] `LossStatus` is **derived from** `LOSS_STATUSES` (`(typeof LOSS_STATUSES)[number]`), not
      hand-written as a duplicate literal union.
- [ ] `statusOptions` is derived from `LOSS_STATUSES` plus the existing `"Tất cả"` sentinel;
      `movementLossStatusOptions` remains the same explicit 2-value subset.
- [ ] Every loss-status-carrying field and signature uses `LossStatus` (directly or via the
      temporary deprecated `Status` alias).
- [ ] **Existing DB mapping behavior is preserved exactly**: `toDbStatus` still returns
      `dang_xu_ly`/`treo_no`/`xac_dinh`/`da_chot` for the four values, and **still falls back to
      `"dang_xu_ly"`** for unrecognized input; `fromDbStatus` still maps the four snake_case
      values back and **still falls back to `"Đang xử lý"`** for unrecognized input.
- [ ] An unknown loss status read from the database still resolves through that documented
      fallback — no new error, no crash, no silent rewrite of the stored value.
- [ ] **No unsafe type assertion is added anywhere.** The three pre-existing dynamic `as Status`
      sites are unchanged; no new `as` cast is introduced to make the union compile.
- [ ] `stageStatus` and `deliveryStatus` remain typed `string` and behave identically; no union
      is introduced for either.
- [ ] No change to workflow behavior, status transitions, user-visible labels, database schema,
      migrations, RLS, or any service/API signature's runtime contract.
- [ ] `docs/04-domain-model.md`, `docs/01-business-rules.md`, and `docs/09-coding-standard.md`
      describe `LossStatus` accurately and state why stage/delivery status remain `string`.

# Testing Checklist

- [ ] `npm.cmd run lint` — 0 errors, 0 warnings (current clean baseline must hold).
- [ ] `npm.cmd run typecheck` — passes; used as the enumeration tool for missed call sites.
- [ ] `npm.cmd run test` — the existing **85 tests across 4 test files** pass **unmodified**.
      They encode the status vocabulary and are the primary regression guard; weakening a test to
      make new types fit is a failure, not a fix.
- [ ] `npm.cmd run build` — passes.
- [ ] **New:** a test asserting `LOSS_STATUSES` equals exactly the four documented values, in a
      form that fails if a value is added, removed, or altered.
- [ ] **New:** all four loss-status values covered — for each, assert `isClosedStatus` and
      `statusClass` behave as before.
- [ ] **New:** DB round-trip — `fromDbStatus(toDbStatus(s)) === s` for all four values.
- [ ] **New:** unknown-DB-value fallback — `fromDbStatus("khong_biet")` returns `"Đang xử lý"` and
      `toDbStatus("khong hop le")` returns `"dang_xu_ly"`, pinning the current documented coercion.
- [ ] Manual: exercise loss-status changes in Nhật ký NVL and Lệnh sản xuất (including
      close/reopen) and confirm no visible behavior change.

## Deferred — Human Decision and Live Data Required

None of the following may be implemented as part of this task. Each needs evidence or a decision
that cannot be obtained from this repository.

- **`select distinct stage_status from material_movements;`** — required before any
  `StageStatus` union. `stage_status` is persisted raw with no CHECK constraint and no translation
  layer, so the live table may hold values outside the four documented literals
  (`Chưa thực hiện`, `Đang thực hiện`, `Hoàn thành`, `Bỏ qua`).
- **`select distinct delivery_status from production_orders;`** and
  **`select distinct delivery_status from production_order_items;`** — required before any
  `DeliveryStatus` union, for the same reason. Note the documented four values have inconsistent
  casing (`Chưa Hoàn Tất`, `Hoàn tất`, `Chưa giao đủ`, `Ngưng Sản Xuất`) and must be preserved
  verbatim.
- Neither query can be run by an agent: only the public anon key is available and RLS blocks
  unauthenticated reads, so the user must run them and report the distinct values.
- **Decision — invalid value submitted at a UI input boundary:** `ignore` (drop the change),
  `fallback` (substitute a default), or `block` (refuse the save with a message). This decision is
  what unblocks replacing the three dynamic `as Status` assertions with real runtime narrowing,
  and it is a UX/business call, not a typing detail.
- **Hard rule for whoever implements the deferred work: no silent normalization or rewrite of an
  unknown persisted value.** If a stored `stage_status`/`delivery_status` is not in the agreed
  vocabulary, it must not be quietly coerced on read and then written back — that destroys data.
  Surface it or preserve it; do not overwrite it.
- **Price-approval status** (`Đã duyệt` / `Chờ duyệt` / `Nháp`, untyped `priceRows` in
  `lib/demo-data.ts`) — out of scope until the Giá & định mức module is actually built (L-11).
- Removing the temporary deprecated `Status` alias — a separate cleanup once all ~26 importers
  reference `LossStatus` directly.

# Estimated Complexity
M

*(Reduced from L: narrowing only the loss-status vocabulary, with the stage/delivery unions and
the UI-boundary narrowing deferred, removes the ambiguous and highest-risk portions.)*

# Implementation record — loss-status scope **implemented, awaiting review**

The narrowed loss-status scope has been implemented. The Deferred section above remains **fully
open** — no stage-status, delivery-status, price-approval, or UI-validation work was done.

| Item | Result |
|---|---|
| `LOSS_STATUSES` + `LossStatus` | Added in `lib/domain/production.ts`; type derived via `(typeof LOSS_STATUSES)[number]` |
| Deprecated `Status` alias | **Kept** as `export type Status = LossStatus` with `@deprecated`; still imported by `use-material-movements.ts`, `material-movement-drawer.tsx`, `stage-entry-view.tsx` (the three files whose protected assertions depend on the name) |
| `statusOptions` | Derived as `["Tất cả", ...LOSS_STATUSES]` — order and rendered labels unchanged |
| `statusToDb` / `statusFromDb` / `toDbStatus` / `fromDbStatus` | **Type annotations only.** Bodies untouched; both fallbacks (`"dang_xu_ly"`, `"Đang xử lý"`) preserved and now carry a comment marking them deliberate and runtime-reachable. `statusFromDb`'s key stays `string` |
| Protected dynamic assertions | All 4 unchanged: `material-movement-drawer.tsx`, `stage-entry-view.tsx`, `use-material-movements.ts`, `material-journal-view.tsx` |
| Redundant literal assertions | 4 × `as Status` removed from `lib/demo-data.ts` (each was a valid literal; no behavior change) |
| New tests | `lib/domain/production.test.ts` — 10 tests. Suite: **95 tests across 5 files** (85 pre-existing, unmodified) |
| Gates | lint 0/0 · typecheck pass · test 95 pass · build pass |

Not done, still deferred: `StageStatus`, `DeliveryStatus`, price-approval status, UI
invalid-value validation, and removal of the deprecated `Status` alias.

# Classification

**SAFE_AUTOMATION** for the narrowed scope above.

Justification: the loss-status vocabulary is fully enumerable from source (four values, no
database-driven status list exists); the DB boundary already coerces unknown values through
`fromDbStatus`/`toDbStatus`, so the union is sound without touching persistence; the change is
type-level only with no runtime behavior, schema, migration, RLS, or API-contract impact; and the
three ambiguous UI-boundary sites are explicitly excluded rather than silently asserted, with the
decision they depend on recorded above. Every remaining edit is mechanical and enumerable by
`typecheck`.

Note honestly: this leaves three pre-existing unsafe-by-nature assertions in place. That is a
knowingly-accepted, documented residual — not a regression (they exist today and their runtime
inputs are constrained to rendered options) — and it is the reason `stageStatus`/`deliveryStatus`
and the invalid-value decision remain deferred rather than resolved here.
