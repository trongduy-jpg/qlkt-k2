# Goal

Reconcile the "loss" (hao hụt) calculation so the application and the database compute the
same number for the same movement, instead of silently diverging whenever `transferred > 0`.

# Business value

Loss (hao hụt) is the single number the entire business process exists to track — it drives
worker-compensation liability. Today the number shown while editing a movement can differ
from the number stored and re-displayed after save, for any movement that uses the
`transferred` field. That is a correctness bug in the core metric of the system, not a
cosmetic issue — it can misstate a worker's liability.

# Current implementation

- Application computes loss in three separate places, all agreeing with each other but not
  with the database:
  - `components/use-material-movements.ts` — `next.loss = Math.max(0, Number((issued - returned - transferred).toFixed(4)))`
  - `lib/production-mappers.ts` — same formula, used as a fallback when `order.loss` is not
    a finite number.
  - `components/use-production-orders.ts` — same formula again, on header-driven recalculation.
- The database computes it differently, as a **stored generated column**:
  - `supabase/migrations/0001_schema.sql` — `loss_gram numeric(14,4) generated always as (greatest(issued_gram - returned_gram - powder_gram, 0)) stored`
- The application always writes `powder = 0`, and always reads the loss value back from the
  generated column (`lib/supabase-mappers.ts`), so the two formulas only produce the same
  result when `transferred = 0`.
- Documented as `L-01` in `docs/14-known-limitations.md` and Rule 1 in `docs/01-business-rules.md`.

# Proposed improvement

Decide, with the accounting/business owner, which quantity is actually supposed to reduce
loss — `transferred` or `powder` — then:
1. Make the three application call sites and the database's generated column use the same
   inputs.
2. If `transferred` is the correct input, change the generated column definition in a new
   migration (`greatest(issued_gram - returned_gram - transferred_weight_gram, 0)`), or drop
   the generated column and compute/store loss explicitly from the app using the agreed
   formula.
3. If `powder` is the correct input, change the three application call sites to stop always
   zeroing `powder` and instead capture/use it, matching the database.
4. Extract the agreed formula into a single exported function in
   `lib/production-business-rules.ts` so there is exactly one implementation to maintain
   going forward.

# Files likely affected

- `lib/production-business-rules.ts` (add the single authoritative function)
- `components/use-material-movements.ts`
- `lib/production-mappers.ts`
- `components/use-production-orders.ts`
- `lib/supabase-mappers.ts` (if the read-back behavior changes)
- A new file `supabase/migrations/00NN_reconcile_loss_formula.sql` (only if the generated
  column definition changes)
- `docs/01-business-rules.md`, `docs/14-known-limitations.md` (remove L-01 once resolved)

# Risks

- This is a business-rule decision, not just a code change — implementing the wrong formula
  (choosing `transferred` vs `powder` incorrectly) reintroduces the same bug with a different
  shape.
- Changing a `generated always as` column requires a manual migration run in the Supabase SQL
  editor plus `notify pgrst, 'reload schema';` — cannot be verified end-to-end by an agent
  without the user executing the migration.
- Historical rows already have a `loss_gram` computed under the old formula; decide whether a
  backfill/recompute is needed for existing data, or whether the change is forward-only.
- Existing Vitest coverage for the loss formula must be updated to match the new agreed
  formula, not just left passing against the old one.

# Acceptance Criteria

- [ ] Exactly one function in `lib/production-business-rules.ts` computes loss; all three
      former call sites call it instead of re-implementing the arithmetic.
- [ ] The database's `loss_gram` generated column (or its replacement) uses the same inputs
      as the application formula.
- [ ] For a movement with `transferred > 0`, the loss value shown immediately after entry and
      the loss value re-displayed after save/reload are identical.
- [ ] `docs/01-business-rules.md` Rule 1 and `docs/14-known-limitations.md` L-01 are updated
      to reflect the resolved state (or removed, if fully resolved).

# Testing Checklist

- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run test` — update/add cases in the existing loss-formula tests to cover the
      `transferred > 0` scenario end-to-end (compute → save → reload).
- [ ] `npm.cmd run build`
- [ ] Manual: create a movement in Nhật ký NVL with a non-zero `transferred` value, save it,
      reload the page, and confirm the displayed loss did not change.
- [ ] Confirm the migration (if any) was run via the Supabase SQL editor and
      `notify pgrst, 'reload schema';` was executed, per `docs/05-database.md`.

# Estimated Complexity
M
