# Goal

Make the Audit log (Nhật ký thao tác) screen read from the persisted `audit_logs` table
instead of only showing in-memory events from the current browser session.

# Business value

Every movement/order/master-data change already writes a row to `audit_logs`
(`lib/audit-log-service.ts` → `createAuditLog`), but nothing in the UI ever reads it back —
the Audit log screen only renders events accumulated in React state during the current
session, capped at 20. This means the audit trail is effectively invisible to the business
the moment a user refreshes the page or a different user logs in — despite the data being
faithfully recorded. Reading the real table turns an already-collected data asset into an
actually-useful audit trail.

# Current implementation

- `lib/audit-log-service.ts` — `createAuditLog(action, detail, entityId?)` is insert-only; no
  corresponding `loadAuditLogs` function exists in the service layer.
- The Audit log screen and `pushAudit` (in `components/material-dashboard.tsx`) work purely
  off local component state populated during the current session, capped at 20 entries.
- Documented as `L-06` in `docs/14-known-limitations.md` and `docs/08-api-and-services.md`.
- `audit_logs` has RLS enabled (migration `0010`) under the same whitelist policy as other
  business tables, so any logged-in user can already read it at the database level — only the
  UI/service-layer read path is missing.

# Proposed improvement

1. Add a `loadAuditLogs(): Promise<AuditLogRecord[]>` function to
   `lib/audit-log-service.ts`, following the same shape as the other `load*` functions in the
   service layer (ordered by `created_at desc`, with a reasonable limit/pagination window).
2. Wire the Audit log screen to call this on mount (and optionally on a manual refresh
   action) instead of relying solely on the in-session `pushAudit` state.
3. Keep `pushAudit`'s in-session behavior for instant feedback immediately after an action,
   but reconcile it with the persisted list rather than replacing it entirely.

# Files likely affected

- `lib/audit-log-service.ts` (add `loadAuditLogs`)
- `lib/material-service.ts` (barrel export)
- `components/material-dashboard.tsx` and/or a new `components/use-audit-log.ts` hook
- The Audit log view component
- `docs/08-api-and-services.md`, `docs/14-known-limitations.md` (update/remove L-06)

# Risks

- Low-to-moderate: purely additive (a new read function + a UI wiring change); does not touch
  any write path or existing business logic.
- Needs a sensible pagination/limit strategy — `audit_logs` has no upper bound today and could
  grow large; loading the entire table unpaginated on every mount would be wasteful.
- Should confirm whether `audit_logs.entity_id`'s `not null` constraint (currently satisfied
  with a sentinel UUID when no entity is supplied, per `docs/05-database.md`) needs any
  special handling when rendering rows back in the UI.

# Acceptance Criteria

- [ ] The Audit log screen shows real, persisted entries from `audit_logs` after a page
      refresh or a fresh login — not just the current session's in-memory events.
- [ ] The list is ordered most-recent-first and bounded by a reasonable limit (not an
      unbounded full-table load).
- [ ] Existing in-session instant-feedback behavior (`pushAudit`) still works alongside the
      persisted view.
- [ ] `docs/08-api-and-services.md` and `docs/14-known-limitations.md` reflect the resolved
      state.

# Testing Checklist

- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run test`
- [ ] `npm.cmd run build`
- [ ] Manual: perform a movement save, refresh the page, and confirm the action still appears
      in the Audit log screen.
- [ ] Manual: log in as a different whitelisted user and confirm they see the same persisted
      history (not just their own session's actions).

# Estimated Complexity
M
