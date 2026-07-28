# Task ID

REL-1

# Title

Re-sync from server after delete instead of trusting local snapshot

# Goal

When a movement delete fails against Supabase, reconcile the local `orders` state with the server's actual current state instead of re-inserting the locally-cached pre-delete object. This closes a race window where a stale in-memory snapshot could overwrite a concurrent edit to the same row that landed between the delete attempt and its failure.

# Scope

- Only the `removeOrder()` function in `components/use-material-movements.ts`.
- Only the failure branch (when `deleteMaterialMovement(id)` throws) needs to change: replace the local re-splice of `target` with a call to `reloadOperationalData()` when `isSupabaseConfigured` is true, mirroring the existing pattern already used in `persistMovement` (see `use-material-movements.ts:186-196`).
- When `isSupabaseConfigured` is false (offline/demo mode), keep the current local-restore behavior exactly as-is — there is no server to reconcile against.
- Do NOT change: the `isClosedStatus` delete guard, the success path, the audit-log calls, validation logic, or any business rule.
- Do NOT touch `persistMovement`, `updateStageMovementFields`, or any other function in this file.
- Do NOT implement REL-2 (duplicate/concurrent delete guard) or UX-2 (pending/disabled row state) — those are separate backlog items and out of scope here.

# Acceptance Criteria

- On successful delete: behavior unchanged (row removed, audit log fires once, no reload triggered by this path).
- On failed delete when `isSupabaseConfigured` is true: instead of re-inserting the captured `target` object into local state, the code calls `reloadOperationalData()` (or the equivalent already-used reload mechanism) so the UI reflects actual server state; the existing error banner (`setRemoteError`) is still shown.
- On failed delete when `isSupabaseConfigured` is false: current local-restore behavior (re-splice `target` back into `orders` at its original position, guarded against double-restore) is preserved unchanged.
- No change to when deletion is allowed — the `isClosedStatus` block-and-return-early logic at the top of `removeOrder` is untouched.
- No change to any other file, business rule, validation function, or Supabase query/payload shape.

# Files allowed to modify

- `components/use-material-movements.ts`

# Files forbidden to modify

- Everything else, including but not limited to:
  - `components/material-movement-drawer.tsx`
  - `components/material-journal-view.tsx`
  - `components/use-operational-data.ts`
  - `lib/material-movements-service.ts`
  - `lib/materials-service.ts`
  - `lib/production-helpers.ts`
  - `lib/production-business-rules.ts`
  - `lib/production-mappers.ts`
  - `lib/supabase-mappers.ts`
  - `lib/supabase.ts`
  - Any file under `supabase/migrations/`
  - Any file under `tasks/`

# Test plan

Manual verification (no test infra assumed in place yet — TEST-2 covers automated regression tests separately):

1. **Successful delete (Supabase configured):** Delete a non-closed movement. Confirm it disappears from the journal, an audit log entry ("delete_movement") is created, and no error banner appears.
2. **Failed delete (Supabase configured):** Simulate a delete failure (e.g. temporarily break network, or force `deleteMaterialMovement` to reject — can be done by editing a test double locally, not committed). Confirm:
   - The error banner appears with the expected message.
   - `reloadOperationalData()` is invoked (verify via a log/breakpoint or by confirming the journal reflects the server's actual state — i.e., the row is still present because the delete never actually happened server-side).
   - No stale/duplicate row appears from a locally re-spliced object.
3. **Failed delete (offline/demo mode, `isSupabaseConfigured` false):** Confirm the row reappears at its original position via local restore, exactly as before this change (regression check against current behavior).
4. **Closed-status guard:** Attempt to delete a movement with status "Đã chốt". Confirm it is blocked before any Supabase call, with the existing "LSX đã chốt" error message, unchanged from current behavior.
5. Run `tsc`/build to confirm no type errors introduced.
