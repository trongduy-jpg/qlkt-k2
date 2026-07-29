# Goal

Reference materials and workers by their stable database id when saving a movement, instead
of matching them by display name, so a typo or rename cannot silently create a duplicate
record.

# Business value

Master data (materials, workers) is currently matched by name when a movement is saved: a
mistyped worker name silently creates a brand-new worker record rather than erroring or
prompting for confirmation, and renaming a material or worker in the Cấu hình screen orphans
every historical movement that referenced the old name. Over time this fragments reporting
(the same real-world worker appearing as two "different" workers) and undermines the accuracy
of loss aggregation per worker/material — directly undercutting the compensation-settlement
purpose of the system.

# Current implementation

- `lib/material-movements-service.ts` — `getMaterialId(order.material)` looks up a material by
  display name (falling back to code), and `upsertWorker(order.worker, order.stage)` upserts a
  worker by a `worker_code` derived from the name, creating a new worker row if no match is
  found.
- The movement row stores `order_id`/`material_id`/`worker_id` as real foreign keys once
  resolved, but the *resolution* step that produces those ids is name-based, not id-based.
- Documented in `docs/08-api-and-services.md` ("Hidden side effects of a movement save") and
  its "Known limitations" section.

# Proposed improvement

Change the movement-save flow so that the UI passes the already-known `materialId`/`workerId`
(selected from a dropdown backed by the loaded master-data lists) through to the service layer,
and have `createMaterialMovement`/`updateMaterialMovement` use those ids directly instead of
re-resolving by name on every save. Reserve the name-based `getMaterialId`/`upsertWorker`
lookup path only for the narrow legacy case where an id genuinely isn't available (e.g. an
import from external data), and make that path explicit/opt-in rather than the default for
every save from the UI.

# Files likely affected

- `lib/material-movements-service.ts` (`getMaterialId`, `upsertWorker`,
  `createMaterialMovement`, `updateMaterialMovement`)
- `components/use-material-movements.ts` (movement draft must carry the selected id, not just
  the display name, from the point of selection through to save)
- `lib/domain/production.ts` / movement draft types (add `materialId`/`workerId` fields if not
  already present in the domain shape used by the drawer)
- `components/material-movement-drawer.tsx` (or wherever material/worker are selected) — must
  supply the id alongside the label
- `docs/08-api-and-services.md` (update once name-based matching is no longer the default path)

# Risks

- This is the highest-traffic write path in the application (every movement save) — a mistake
  here has broad blast radius, which is why it is prioritized lower despite clear business
  value; it needs careful, incremental rollout rather than a single sweeping change.
- Existing drafts cached in `localStorage` (per `docs/02-current-architecture.md`'s three-tier
  persistence model) may only carry the display name, not an id — the migration must handle
  drafts created before this change without crashing or silently mis-saving them.
- Must preserve the "journal before order" and "create worker/material on the fly" workflows
  that the business currently relies on (per `docs/08-api-and-services.md`) — this task changes
  *how* the id is obtained, not whether ad-hoc creation remains possible when a user genuinely
  types a brand-new name.
- Requires close collaboration with whoever verifies UI behavior, since drawer/dropdown
  wiring changes are easy to get subtly wrong (e.g. stale id after a name edit).

# Acceptance Criteria

- [ ] Saving a movement for an existing material/worker uses the already-resolved id, not a
      fresh name-based lookup, when the id is available from the selection UI.
- [ ] A genuine typo in a worker/material name during selection (i.e. selecting from the
      dropdown) can no longer silently create a duplicate record.
- [ ] The "create a new worker/material by typing a new name" workflow still works when a
      user intentionally enters a name that doesn't match any existing id.
- [ ] Movement drafts cached in `localStorage` before this change do not crash the app after
      the change ships.
- [ ] `docs/08-api-and-services.md` is updated to describe the id-based resolution as the
      primary path.

# Testing Checklist

- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run test`
- [ ] `npm.cmd run build`
- [ ] Manual: select an existing worker from the dropdown, save a movement, and confirm no new
      worker row is created.
- [ ] Manual: intentionally type a brand-new worker name (not selecting from the dropdown, if
      that affordance still exists) and confirm the "create new" path still works as before.
- [ ] Manual: load a movement draft that was cached before this change (or simulate one) and
      confirm it does not crash and saves correctly.

# Estimated Complexity
L
