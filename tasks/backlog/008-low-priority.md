# Goal

Convert the `Status` domain type from a bare `string` to a real TypeScript union, so that an
invalid status literal is caught at compile time instead of silently passing through.

# Business value

`Status` (`lib/domain/production.ts`) governs the most important state machine in the system —
loss status, delivery status, and stage status all flow through code that types this field as
`string`. A typo in a status literal anywhere in the codebase currently compiles successfully
and fails silently at runtime (e.g. a comparison that never matches, or a value that renders
as an unrecognized label). Making this a real union converts an entire class of
easy-to-introduce bugs into compile errors, at the cost of a mechanical, low-creativity
refactor.

# Current implementation

- `lib/domain/production.ts` — `export type Status = string;` (not a union).
- The real allowed values are only enforced by convention, spread across exported option
  arrays: `lib/production-helpers.ts` (loss status), `lib/production-journal-options.ts`
  (delivery status, stage status).
- `lib/production-helpers.ts` → `isClosedStatus(status: Status)` compares against the literal
  `"Đã chốt"` with no compiler assistance that `"Đã chốt"` is even a valid `Status` value.
- Documented as a known weakness in `docs/01-business-rules.md` (Important rules #5) and
  `docs/09-coding-standard.md`.

# Proposed improvement

1. Define three real union types (one per status axis, since `docs/01-business-rules.md`
   explicitly documents them as independent axes that must not be conflated):
   `LossStatus`, `DeliveryStatus`, `StageStatus` — each listing the exact literals already
   used by the corresponding option array.
2. Derive the existing option arrays (`statusOptions`, `movementLossStatusOptions`, etc.) from
   the union types (or vice versa, whichever direction avoids duplicating the literal list),
   so the type and the UI dropdown values cannot drift apart.
3. Update every function signature currently typed as `(status: Status)` or `(status: string)`
   in a status-comparison context to the appropriate specific union.
4. Fix any compile errors this surfaces — each one is, by definition, a place where an
   un-typed status literal was being used loosely.

# Files likely affected

- `lib/domain/production.ts`
- `lib/production-helpers.ts`
- `lib/production-journal-options.ts`
- `lib/production-workflow.ts`
- `lib/production-summary.ts`
- `components/use-material-movements.ts`, `components/use-production-orders.ts`,
  `components/use-selected-production-order.ts` (call sites)
- `docs/01-business-rules.md`, `docs/04-domain-model.md`, `docs/09-coding-standard.md`
  (update to describe the union types)

# Risks

- Breadth: this type is threaded through most of the business-logic layer, so the change
  touches many files even though each individual edit is mechanical — the risk is in volume
  and easy-to-miss call sites, not in conceptual difficulty.
- Any place currently relying on loose `string` comparison with a typo'd or legacy literal
  (e.g. a status value stored in old data that isn't in the current option arrays) will now
  fail to compile or need an explicit escape hatch — must decide how to handle historical data
  that doesn't match the new union (e.g. a wider "legacy" union member, or a runtime
  normalization step).
- Should be done as its own isolated task, not combined with any of the other backlog items,
  since it touches broad surface area purely for type-safety with no behavior change.

# Acceptance Criteria

- [ ] `Status = string` is replaced by three named unions (`LossStatus`, `DeliveryStatus`,
      `StageStatus`) reflecting the three independent axes documented in
      `docs/01-business-rules.md`.
- [ ] The existing option arrays are derived from (or kept in lockstep with, via a shared
      const array + `typeof` pattern) the union types.
- [ ] `npm.cmd run typecheck` passes with zero new `any`/type-assertion workarounds introduced
      to force the migration through.
- [ ] No runtime behavior changes — this is a type-level-only refactor.

# Testing Checklist

- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run test` — all 59 existing tests continue to pass unchanged (confirms no
      behavior drift).
- [ ] `npm.cmd run build`
- [ ] Manual: exercise loss-status, delivery-status, and stage-status transitions in the UI
      (Nhật ký NVL, Lệnh sản xuất, Ghi nhận công đoạn) and confirm no regressions.

# Estimated Complexity
L
