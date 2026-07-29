# Goal

Add validation to `validateMovementDraft` that rejects `NaN`, `Infinity`/`-Infinity`, and
negative values for `issued`, `returned`, `transferred`, and `goldAge`, with no other
behavior change of any kind.

**This task must not change any formula, status behavior, save workflow, database behavior,
or API contract.** It is strictly additive input validation at the existing client-side gate
in `validateMovementDraft` — nothing about how a valid movement is computed, saved, or
persisted may change.

# Business value

Every weight field feeds directly into the loss calculation and downstream compensation
liability. Right now `validateMovementDraft` only checks that required fields are non-empty
strings — it performs zero numeric validation, so a UI bug, a pasted value, or direct state
manipulation can currently save a movement with a `NaN`, `Infinity`, or negative weight/purity
value. These are unambiguous data-corruption cases with no legitimate use — rejecting them is
a small, contained, purely additive change with no ambiguity about what "invalid" means.

# Current implementation

- `lib/production-helpers.ts` — `validateMovementDraft` checks eight required string fields
  (`code`, `sku`, `occurredDate`, `destination`, `stage`, `worker`, `stageStatus`, `status`)
  using `.trim()` truthiness only. **Zero unit tests exist for this function** (confirmed by
  searching every `*.test.ts` file in the repo).
- No numeric validation exists anywhere today for `issued`, `returned`, `transferred`, or
  `goldAge`.
- `lib/production-helpers.ts` already has a precedent for treating non-finite numbers as
  invalid: `pickNumber(...)` filters candidates with `Number.isFinite(value)`. This task
  follows that same existing precedent rather than inventing a new one.
- `lib/production-business-rules.ts` computes `const goldAge = Number(order.goldAge || 1)`
  before converting weights — a falsy `goldAge` (including exactly `0`) is **silently coerced
  to `1`** today. This existing fallback must be left completely unchanged by this task —
  see "Preserve all current behavior" below.
- `createEmptyOrder()` and the `resetMode: "keepStage"` branch in
  `components/use-material-movements.ts` both default a fresh draft to
  `issued: 0, returned: 0, transferred: 0, status: "Treo nợ"`. This zero/​`Treo nợ` combination
  is today's normal starting state and must continue to save successfully — see "Preserve all
  current behavior" below.
- `powder` is never user-editable — `components/use-material-movements.ts` force-sets it to
  `0` before every save — so it is out of scope for validation entirely; there is no UI path
  that can produce an invalid `powder` value.
- No `returned > issued` comparison, and no numeric tolerance/epsilon constant, exists
  anywhere in the codebase today (confirmed by grep across all `.ts` files). This remains
  fully out of scope for this task — see "Deferred" below.
- Documented as a known limitation in `docs/01-business-rules.md` Rule 10 and
  `docs/14-known-limitations.md`.
- This validation is explicitly UX-only (per `docs/01-business-rules.md` and
  `docs/08-api-and-services.md`) — real enforcement remains RLS + Postgres constraints, which
  this task does not touch.

# Proposed improvement

Extend `validateMovementDraft` (or add a sibling function called from the same call site) to
reject a draft when, for each of `issued`, `returned`, `transferred`, and `goldAge`:

1. **Reject `NaN`** — `Number.isNaN(value)` is `true`.
2. **Reject `Infinity` and `-Infinity`** — `Number.isFinite(value)` is `false` (this
   subsumes `NaN` too; implementing a single `Number.isFinite(value) === false` check
   naturally covers both #1 and #2).
3. **Reject negative values** — `value < 0`.

Surface the failure through the same `remoteError` / save-blocking path already used for the
existing required-field checks in `validateMovementDraft`'s caller, so the user sees one
consistent validation message pattern rather than a new UI affordance.

### Preserve all current behavior for

- **Zero `issued`** — a draft with `issued === 0` must continue to save exactly as it does
  today.
- **Zero `returned`** — a draft with `returned === 0` must continue to save exactly as it
  does today.
- **Zero `transferred`** — a draft with `transferred === 0` must continue to save exactly as
  it does today.
- **`goldAge === 0` fallback behavior** — must continue to be silently coerced to `1` by
  `lib/production-business-rules.ts` exactly as it is today; this task adds no check that
  treats `goldAge === 0` as invalid.
- **`Treo nợ` drafts** — the default `issued: 0, returned: 0, transferred: 0, status: "Treo nợ"`
  state produced by `createEmptyOrder()` and the `keepStage` reset must continue to be
  saveable exactly as it is today.
- **`returned` greater than `issued`** — no comparison between these two fields is introduced;
  a draft with `returned > issued` must continue to save exactly as it does today.
- **`powder`** — remains untouched and unvalidated; it is never user-editable and is always
  force-set to `0` before save.

# Files likely affected

- `lib/production-helpers.ts` (the validation function itself)
- `lib/production-helpers.test.ts` or the relevant existing test file covering
  `validateMovementDraft`, if one exists — otherwise a new test file
- `components/use-material-movements.ts` (call site — likely no change needed beyond
  confirming the existing error-handling path surfaces the new messages)
- `docs/01-business-rules.md` (update Rule 10 to describe exactly the checks implemented —
  no more, no less)

# Risks

- Low risk: this only tightens an existing client-side gate to reject values with no
  legitimate business meaning (`NaN`, `Infinity`, negative weight/purity); it does not touch
  the database, RLS, any generated column, the loss formula, any status transition, the save
  workflow, or any service/API contract.
- The only implementation risk is scope creep: it would be easy to also "helpfully" reject
  zero values, `goldAge === 0`, or `returned > issued` while in this function — that is
  explicitly forbidden by this task (see "Preserve all current behavior" and "Deferred"
  below) and must be caught in review if it happens.
- Regression risk is fully covered by explicit test cases for every "preserve" item below —
  if any of them starts failing, the change has exceeded its intended scope.

# Acceptance Criteria

- [ ] Saving a movement where `issued`, `returned`, `transferred`, or `goldAge` is `NaN` is
      blocked with a clear message.
- [ ] Saving a movement where `issued`, `returned`, `transferred`, or `goldAge` is `Infinity`
      or `-Infinity` is blocked with a clear message.
- [ ] Saving a movement where `issued`, `returned`, `transferred`, or `goldAge` is negative is
      blocked with a clear message.
- [ ] A movement with `issued === 0` still saves successfully (unchanged).
- [ ] A movement with `returned === 0` still saves successfully (unchanged).
- [ ] A movement with `transferred === 0` still saves successfully (unchanged).
- [ ] A movement with `goldAge === 0` still saves successfully, and
      `lib/production-business-rules.ts` still silently coerces it to `1` exactly as today
      (unchanged).
- [ ] The default `Treo nợ` draft produced by `createEmptyOrder()`
      (`issued: 0, returned: 0, transferred: 0, status: "Treo nợ"`) still saves successfully
      (unchanged).
- [ ] A movement where `returned > issued` still saves successfully — no comparison between
      the two fields is introduced (unchanged).
- [ ] `powder` is not validated and its existing force-set-to-`0` behavior is untouched.
- [ ] No change to the loss formula, any status transition/workflow, the database, RLS, or
      any service/API contract/signature.
- [ ] `docs/01-business-rules.md` Rule 10 is updated to describe exactly the four checks
      implemented (NaN / Infinity / negative, across the four named fields) — and explicitly
      notes that zero values, `goldAge === 0`, and `returned > issued` remain unchanged.

# Testing Checklist

- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run test` — `validateMovementDraft` currently has **zero** test coverage; add a
      new test suite covering, for each of `issued`/`returned`/`transferred`/`goldAge`:
      - rejects `NaN`
      - rejects `Infinity` and `-Infinity`
      - rejects a negative value
      - **regression:** accepts `0`
      Plus:
      - **regression:** accepts a draft with `returned > issued`
      - **regression:** accepts the default `createEmptyOrder()` draft unchanged
      - **regression:** existing loss-formula/`goldAge` fallback tests in
        `lib/production-business-rules.test.ts` still pass unmodified
- [ ] `npm.cmd run build`
- [ ] Manual: attempt to save a movement in Nhật ký NVL with a negative issued weight and
      confirm it is blocked with a visible message.
- [ ] Manual: confirm a movement with `goldAge = 0` still saves successfully and produces the
      same converted-weight result as before this change.
- [ ] Manual: confirm a movement with `returned > issued` still saves successfully.

## Deferred — Human Decision Required

The following were considered during refinement and are **explicitly out of scope** for this
task. None of them may be implemented as part of this task; each requires a business/product
decision before any future task can act on it:

- **Whether `returned > issued` should be rejected at all.** No such comparison exists in the
  codebase today, and no business rule has been confirmed either way.
- **The exact comparison tolerance**, if `returned > issued` rejection is ever approved — no
  tolerance/epsilon constant exists anywhere in the codebase to derive one from; a value would
  have to be supplied by a human, not inferred.
- **Whether zero quantities (`issued`/`returned`/`transferred`) should be rejected** for any
  status, or specifically for `Treo nợ` — `createEmptyOrder()` and the `keepStage` reset both
  default to zero, but no code path confirms whether the business ever intentionally *saves* a
  final movement in that state versus it being a transient blank-form state.
- **Whether `goldAge === 0` should remain fallback-to-`1`**, or instead be rejected outright —
  changing this would alter existing, currently-working behavior in
  `lib/production-business-rules.ts` and is a business-rule change, not a validation gap-fill.
- **Whether `Treo nợ` needs special numeric rules** beyond what any other status gets — no
  code was found granting `Treo nợ` a distinct numeric-validation exemption; the only
  status-linked behavior found is the default-draft state, which is not itself proof of an
  intended special rule.

# Estimated Complexity
S
