# Material Movement Module — Technical Backlog

Source of truth: current implementation (`components/use-material-movements.ts`, `components/material-movement-drawer.tsx`, `lib/material-movements-service.ts`, `lib/materials-service.ts`, `lib/production-helpers.ts`, `lib/production-business-rules.ts`, `lib/supabase-mappers.ts`, `supabase/migrations/0010_business_tables_rls.sql`). Business logic is considered correct and out of scope — items below are reliability, UX, performance, security, test, and code-quality improvements only.

---

## REL-1

Title: Re-sync from server after delete instead of trusting local snapshot

Priority:
High

Risk:
Low

Affected files:
- components/use-material-movements.ts (`removeOrder`)

Description:
`removeOrder()` optimistically removes a movement from local `orders` state and only re-inserts the captured pre-delete object if `deleteMaterialMovement` throws. Both the optimistic removal and the failure-path restore operate purely on the in-memory snapshot — there is no call to `reloadOperationalData()` (the pattern already used by `persistMovement` after create/update). If another edit to the same row lands between the delete attempt and its failure, the restore will splice back a stale version and silently revert that concurrent edit.

Acceptance Criteria:
- On successful delete: behavior unchanged.
- On failed delete when `isSupabaseConfigured`: state is reconciled via `reloadOperationalData()` (or equivalent server re-fetch) rather than re-inserting the locally-cached `target` object.
- Offline/demo mode (`isSupabaseConfigured === false`) keeps the current local restore behavior.
- No change to when deletion is allowed (`isClosedStatus` guard untouched).

Dependencies:
None.

Implementation Notes:
Mirror the `isSupabaseConfigured ? reloadOperationalData(...) : setOrders(...)` branching already used in `persistMovement` (use-material-movements.ts:186-196).

---

## REL-2

Title: Guard against duplicate/concurrent delete calls on the same row

Priority:
Medium

Risk:
Low

Affected files:
- components/use-material-movements.ts (`removeOrder`)
- components/material-movement-drawer.tsx (delete button / row action, if applicable)

Description:
`removeOrder(id)` has no in-flight guard. A double-click (or rapid repeat action) before the first async delete resolves can fire `deleteMaterialMovement(id)` twice concurrently, racing two failure/success branches against the same row and against each other's restore logic.

Acceptance Criteria:
- A second delete request for the same `id` while one is already in flight is a no-op (ignored or queued), not a second concurrent Supabase call.
- UI delete affordance is disabled/hidden for a row while its delete is pending.

Dependencies:
None.

Implementation Notes:
Track in-flight ids in a `Set`/state map inside the hook; disable the corresponding action in the drawer while the id is present.

---

## REL-3

Title: Stop silently degrading movement writes on ambiguous "missing column" errors

Priority:
High

Risk:
Medium

Affected files:
- lib/material-movements-service.ts (`isMissingColumnError`, `buildMovementRowBaseOnly`, `createMaterialMovement`, `updateMaterialMovement`, `loadProductionOrders`)

Description:
`isMissingColumnError` matches any Postgres error message containing the substring "column" or "schema cache" and silently retries with `buildMovementRowBaseOnly`, a reduced payload missing ~25 fields (dates, issue/return sku, source/import/export fields, NXT/loss period, converted weights). A legitimate validation error that happens to mention a column name in its message would be misclassified, causing a "successful" save that actually drops most of the record's business data with no warning surfaced to the user.

Acceptance Criteria:
- Fallback path only triggers on errors that are unambiguously schema-cache/missing-column errors (e.g. matched against Postgres error `code`, not a free-text substring match).
- When the fallback path is used, the user is shown a visible warning (not just a silent successful save) indicating the record was saved with reduced fields.
- Existing successful full-column save path is unaffected.

Dependencies:
None (does not require a schema/migration change, only stricter error classification and a UI notice).

Implementation Notes:
Prefer checking `error.code` (Supabase/Postgres error codes, e.g. `42703` undefined_column, `PGRST204` schema cache) instead of `message.includes("column")`. Surface the degraded-save warning through the existing `setRemoteError` / saved-notice channel.

---

## REL-4

Title: Fail loudly instead of defaulting to AU750 when material name is unrecognized

Priority:
Medium

Risk:
Low

Affected files:
- lib/material-movements-service.ts (`getMaterialId`, `materialCodeByName`)

Description:
`getMaterialId` looks up a material by exact name; if not found, it falls back to `materialCodeByName[materialName] ?? "AU750"` and looks up by that code. Any material name outside the four hardcoded keys (or a name with a typo/whitespace difference from the `materials` table) silently resolves to Vàng 18K (AU750), attaching the movement to the wrong material master row with no error.

Acceptance Criteria:
- Unmatched material name throws a clear error (surfaced via existing error-banner mechanism) instead of silently substituting AU750.
- Existing exact-name and known-code matches behave unchanged.

Dependencies:
None.

Implementation Notes:
Remove the `?? "AU750"` fallback; throw `Cannot find material ${materialName}` when neither name nor mapped code resolves.

---

## REL-5

Title: Preserve intentional falsy updates (zero / cleared text) when upserting production_orders

Priority:
Medium

Risk:
Medium

Affected files:
- lib/material-movements-service.ts (`upsertProductionOrder`)

Description:
`upsertProductionOrder` merges the incoming order with the existing DB row field-by-field using `||` (e.g. `order.destination || existingOrder?.destination`, `order.qtyPiece && order.qtyPiece > 0 ? ... : existingOrder?.quantity_piece`). This means a user intentionally clearing a text field to blank, or correcting a numeric field down to `0`, can never actually persist — the previous non-empty/non-zero value always wins.

Acceptance Criteria:
- Explicitly provided `0` or empty-string values from the current save are written as-is (not silently replaced by the previous DB value).
- Fields genuinely absent from the incoming order (undefined) continue to fall back to the existing DB value as today.

Dependencies:
None. Requires the domain model to distinguish "field not provided" from "field cleared" for text values, and "explicitly zero" from "not set" for numeric values — confirm current `ProductionOrder` type supports this distinction before implementing (may need `undefined` vs `0`/`""` convention audit).

Implementation Notes:
Replace `||`/truthy-fallback merge logic with explicit `undefined`-only fallback (`??` on a properly-typed optional field), auditing each of the ~20 merged fields individually.

---

## UX-1

Title: Surface a persistent, visible indicator when a movement save used the reduced-column fallback

Priority:
High

Risk:
Low

Affected files:
- lib/material-movements-service.ts
- components/use-material-movements.ts
- components/material-movement-drawer.tsx

Description:
Today, whether a save went through the full column set or the reduced fallback set is invisible to the end user — both show the same "Đã lưu/Đã cập nhật" success notice. Operators have no way to know a record is missing fields until they later notice data absent in the journal or dashboard.

Acceptance Criteria:
- When a save uses `buildMovementRowBaseOnly`/`MOVEMENT_SELECT_COLUMNS_FALLBACK`, the saved-notice or an additional banner clearly states that some fields were not saved and why (e.g. "Cần chạy migration mới trên Supabase").
- Normal full-column saves show no such warning.

Dependencies:
REL-3 (this is the user-facing counterpart of that fix — implement together).

Implementation Notes:
`createMaterialMovement`/`updateMaterialMovement` already know locally whether the fallback branch executed; thread that flag back through `persistMovement`'s return value or a side-channel into `setSavedMovementNotice`.

---

## UX-2

Title: Disable/spinner-state the delete action while a row's deletion is in flight

Priority:
Medium

Risk:
Low

Affected files:
- components/material-movement-drawer.tsx
- components/material-journal-view.tsx

Description:
There is currently no visual feedback that a delete is pending — the row simply vanishes optimistically. Combined with REL-1/REL-2, users have no indication a delete could still fail and be reverted, which can be confusing if the row reappears moments later.

Acceptance Criteria:
- Row shows a pending/disabled state between delete click and resolution.
- On failure + restore, the row visibly reappears with the existing error banner shown (not a silent, unexplained reappearance).

Dependencies:
REL-1, REL-2.

Implementation Notes:
Expose the in-flight id set (from REL-2) to the journal view/drawer so the relevant row can render a disabled/loading affordance.

---

## UX-3

Title: Distinguish "validation blocked save" from "server/network error blocked save" in the error banner

Priority:
Low

Risk:
Low

Affected files:
- components/use-material-movements.ts (`persistMovement`)
- components/material-movement-drawer.tsx (error banner rendering)

Description:
`setRemoteError` is used uniformly for missing-field validation (`validateMovementDraft`), business-rule blocks (`shouldForceDirectCharge`), and actual Supabase failures. All render through the same generic red banner, making it hard for the user to tell "you forgot a field" apart from "the save failed on the server and you should retry."

Acceptance Criteria:
- Validation/business-rule messages are visually distinguishable (e.g. different styling or icon) from server/network error messages.
- No change to the underlying validation or business-rule logic, only presentation.

Dependencies:
None.

Implementation Notes:
Could be done by tagging the error with a `kind: "validation" | "server"` alongside the message, without touching `validateMovementDraft`/`shouldForceDirectCharge` themselves.

---

## PERF-1

Title: Avoid redundant full-journal reload after every single movement save

Priority:
Medium

Risk:
Medium

Affected files:
- components/use-material-movements.ts (`persistMovement`)
- components/use-operational-data.ts

Description:
On every successful create/update, `persistMovement` calls `reloadOperationalData({ movementDraftOverrides: ... })` when Supabase is configured, which (per the hook's contract) appears to re-fetch and rebuild the full operational dataset rather than patching in just the one changed/created row. For a busy journal (many LSX / many movements), this means every single "Thợ mới" save in the multi-worker stage flow re-fetches everything.

Acceptance Criteria:
- Investigate whether `reloadOperationalData` can accept/merge a single updated row without a full re-fetch, or whether the full reload is required by current aggregation logic.
- If safe, avoid a full network round-trip reload for the common single-row save case; if not safe (aggregates depend on full recompute), document why and close as won't-fix.

Dependencies:
Requires reading `use-operational-data.ts` in full to confirm reload cost/behavior — investigation spike before implementation.

Implementation Notes:
This is a performance investigation, not a guaranteed change — the "keepStage" flow (adding many workers to one stage in sequence) is the highest-value case to check first since it triggers the most repeated reloads in a short span.

---

## SEC-1

Title: Add row-level ownership/role distinction to material_movements RLS policy

Priority:
High

Risk:
High

Affected files:
- supabase/migrations/0010_business_tables_rls.sql
- (new migration file, not yet created)

Description:
The current RLS policy (`for all using (is_whitelisted_user()) with check (is_whitelisted_user())`) grants any whitelisted user full read/write/delete on `material_movements`, `production_orders`, `workers`, `materials`, etc. There is no distinction between roles (e.g. admin vs. nhân viên) or ownership (a worker editing another worker's movement). The client-side `isClosedStatus` delete guard in `use-material-movements.ts` is enforced only in the React layer and can be bypassed by any direct REST call using the anon key plus a whitelisted session.

Acceptance Criteria:
- Define and document the intended access model (who can create/edit/delete which rows) with stakeholders before implementing — this is a policy decision, not purely technical.
- New RLS policy enforces at minimum: closed (`Đã chốt`) movements cannot be deleted/updated at the database level, matching the existing client-side guard.
- Existing whitelisted users retain all currently-relied-upon access for their legitimate workflows (verify no regression via manual QA pass on all save/delete flows).

Dependencies:
Requires a product/policy decision on role model before implementation. Should not be started without sign-off given High risk of breaking legitimate workflows.

Implementation Notes:
Start with the lowest-risk, highest-value rule: mirror `isClosedStatus` server-side via a `CHECK`/policy predicate on `status <> 'da_chot'` for update/delete, before attempting any broader ownership/role model.

---

## SEC-2

Title: Confirm anon key exposure scope and audit direct-REST bypass surface

Priority:
Medium

Risk:
Low

Affected files:
- lib/supabase.ts
- supabase/migrations/0010_business_tables_rls.sql

Description:
The client uses only the Supabase anon key; all authorization relies on RLS plus `is_whitelisted_user()`. This is a documentation/audit item to confirm no service-role key or elevated credential is ever exposed client-side, and to catalog exactly what a whitelisted-but-malicious/compromised account could do via direct REST calls today (this becomes the baseline SEC-1 is measured against).

Acceptance Criteria:
- Written confirmation (short doc, not code) that only the anon key ships to the client.
- A short table enumerating current RLS-permitted operations per table for a whitelisted user, to inform SEC-1 scoping.

Dependencies:
Feeds into SEC-1.

Implementation Notes:
Pure investigation/documentation task, no code or schema change.

---

## TEST-1

Title: Unit tests for `persistMovement` save/validation/business-rule branches

Priority:
High

Risk:
Low

Affected files:
- components/use-material-movements.ts
- (new) components/use-material-movements.test.ts

Description:
`persistMovement` is the single choke point for all movement saves (validation → business rules → direct-charge guard → dedup-by-stage → Supabase create/update → local/remote state sync → audit log), but no test file currently exercises it. Given its central role, regressions here are high-impact and easy to introduce silently.

Acceptance Criteria:
- Tests cover: missing-field validation blocks save; `shouldForceDirectCharge` blocks save with correct message; successful create path (new id, audit log, saved notice); successful update path (existing id resolved via `effectiveEditingIdOverride` and via single-worker-stage dedup match); Supabase throw is caught and surfaced via `setRemoteError`, state not corrupted.
- Tests run against mocked `createMaterialMovement`/`updateMaterialMovement`/`createAuditLog` (no real Supabase calls).

Dependencies:
None.

Implementation Notes:
Existing pure-function helpers (`validateMovementDraft`, `applyProductionBusinessRules`, `shouldForceDirectCharge`) are easier to unit test in isolation first if not already covered — check for existing coverage before duplicating.

---

## TEST-2

Title: Regression test for delete-failure restore path (REL-1/REL-2 companion)

Priority:
Medium

Risk:
Low

Affected files:
- components/use-material-movements.ts
- (new) components/use-material-movements.test.ts

Description:
The recently landed delete-restore fix (commit 8d01cea) has no accompanying automated test. Given this exact code path was the subject of a manual audit finding and fix, it is high-value to lock in with a regression test before further changes (e.g. REL-1's server-resync change) land on top of it.

Acceptance Criteria:
- Test: successful delete removes the row and leaves it removed, audit log fires once.
- Test: failed delete (mocked rejection) restores the row to its original position, shows the error, and does not double-restore on a second failed attempt.
- Test: `isClosedStatus` guard still blocks delete for "Đã chốt" rows without calling `deleteMaterialMovement` at all.

Dependencies:
Should land before REL-1/REL-2 are implemented, so those changes have a safety net.

Implementation Notes:
None beyond standard mocking of `deleteMaterialMovement`.

---

## TEST-3

Title: Test coverage for `buildMovementRow`/fallback payload construction

Priority:
Low

Risk:
Low

Affected files:
- lib/material-movements-service.ts
- (new) lib/material-movements-service.test.ts

Description:
`buildMovementRow`, `buildMovementRowBaseOnly`, and `mergeMovementResult` have no direct test coverage despite being the exact functions implicated in REL-3 (silent field-loss on fallback). Locking in their current field mapping behavior with tests makes REL-3's fix verifiable and prevents future regressions in the fallback logic.

Acceptance Criteria:
- Snapshot/assertion test enumerating every field `buildMovementRow` maps from `ProductionOrder` to the DB row shape.
- Test confirming `buildMovementRowBaseOnly` is a strict subset and documenting exactly which fields are dropped (this list becomes the basis for the REL-3/UX-1 user-facing warning copy).

Dependencies:
Pairs naturally with REL-3.

Implementation Notes:
Pure functions, no mocking required.

---

## CODE-1

Title: Extract error classification (`isMissingColumnError`) to use structured Postgres error codes

Priority:
Medium

Risk:
Low

Affected files:
- lib/material-movements-service.ts

Description:
Beyond the reliability concern in REL-3, `isMissingColumnError`'s string-matching approach is fragile to maintain — any change in Supabase/PostgREST error message wording silently changes fallback behavior. This is the code-quality companion to REL-3: even if the false-positive risk were accepted, matching on `error.code` is more maintainable and self-documenting than substring matching on `error.message`.

Acceptance Criteria:
- Error classification keyed off `error.code` (e.g. PostgREST `PGRST204`, Postgres `42703`) with the string-match kept only as a documented last-resort fallback, if at all.
- Behavior change (if any) covered by TEST-3.

Dependencies:
REL-3 (same code path; implement together to avoid double-touching this function).

Implementation Notes:
Check actual `error.code` values returned by Supabase-js in this project's version before finalizing the exact codes to match on.

---

## CODE-2

Title: Reduce duplicated field-list maintenance across `buildMovementRow`, `MOVEMENT_SELECT_COLUMNS`, and `movementRowToProductionOrder`

Priority:
Low

Risk:
Medium

Affected files:
- lib/material-movements-service.ts
- lib/supabase-mappers.ts

Description:
The set of `material_movements` columns is currently hand-maintained in at least three places: `MOVEMENT_SELECT_COLUMNS` (select list), `buildMovementRow` (write payload), and `MovementRow`/`movementRowToProductionOrder` (read mapping) — each already carries a comment acknowledging this is a known pain point ("chính nguyên nhân gây bug rớt field ở các phiên sửa trước"). Any new field requires editing three separate lists, and it's easy to update one and forget another (as REL-3/REL-5 findings show happening in adjacent ways).

Acceptance Criteria:
- A single source-of-truth field list/mapping (e.g. a field-definition table driving select columns, write keys, and read mapping) reduces the number of places a new column must be added to.
- No change in runtime read/write behavior — refactor only, verified via TEST-3.

Dependencies:
TEST-3 (need a characterization test in place before refactoring, given Medium risk of subtly changing field mapping).

Implementation Notes:
This is a larger refactor than other CODE items — treat as its own scoped task, not a quick cleanup, given three call sites and the fallback variant to reconcile.

---

## CODE-3

Title: Type the Supabase error/query results in `material-movements-service.ts` instead of `any`

Priority:
Low

Risk:
Low

Affected files:
- lib/material-movements-service.ts (`loadProductionOrders` uses `let result: any`)

Description:
`loadProductionOrders` types its Supabase query result as `any`, losing type safety on `result.data`/`result.error` and on the subsequent cast `result.data as unknown as MovementRow[]`. This double-cast pattern (`as unknown as X`) elsewhere in the file is a sign the actual Supabase-generated types aren't being leveraged.

Acceptance Criteria:
- Replace `any` with the actual Supabase query builder's inferred/generic result type where feasible.
- No behavior change; purely a typing improvement, verified by existing/added tests still passing and `tsc` reporting no new errors.

Dependencies:
None.

Implementation Notes:
May require generating/maintaining Supabase database types (`supabase gen types typescript`) if not already present in the repo — check first.
