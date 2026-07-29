# Goal

Replace the Dashboard's KPI tiles with live aggregates computed from real Supabase data,
instead of the current fixtures from `lib/demo-data.ts`.

# Business value

The Dashboard is the first screen a user sees, and its KPI tiles currently show canned demo
numbers regardless of what has actually happened in the workshop. For a system whose entire
purpose is tracking real material movement and loss, an inaccurate landing screen undermines
trust in the tool and forces users to navigate elsewhere (Nhật ký NVL, Báo cáo hao hụt) to get
real numbers that could have been front and center.

# Current implementation

- Per `docs/00-project-overview.md` and `docs/02-current-architecture.md`, the Dashboard
  module's KPI tiles are sourced from `lib/demo-data.ts`, not from `reloadOperationalData`'s
  live query results, even though the same hook already loads `orders`, `materials`,
  `workers`, and computed summaries elsewhere in the app.
- `lib/production-summary.ts` already contains aggregation logic (used by other screens, e.g.
  Báo cáo hao hụt) that could plausibly be reused or extended for dashboard-level KPIs.

# Proposed improvement

Identify which KPI tiles are currently shown (e.g. counts of open LSX, total loss this
period, recent movement volume — to be confirmed against the actual Dashboard component
before implementation) and replace each with a computation derived from the already-loaded
`orders`/`headers`/`materials`/`workers` state (via `useOperationalData`), reusing
`lib/production-summary.ts` aggregation helpers where the shape matches, rather than
introducing a new parallel query path.

# Files likely affected

- The Dashboard view component (module `/`)
- `lib/production-summary.ts` (if a new aggregation is needed, add it here rather than
  inline in the component)
- `lib/demo-data.ts` (retain only for the Supabase-unconfigured demo-mode fallback, not as
  the always-on source)
- `docs/00-project-overview.md`, `docs/02-current-architecture.md` (update "Known
  limitations" once resolved)

# Risks

- Requires first confirming, by reading the actual Dashboard component, exactly which tiles
  exist and what each is supposed to represent — the docs describe the symptom (demo data)
  but the precise tile definitions must come from the code, not be assumed.
- Must preserve the existing demo-mode behavior (`isSupabaseConfigured === false`) so local
  development without Supabase still shows something reasonable, per
  `docs/06-authentication.md`'s demo-mode design.
- Since all modules stay mounted simultaneously (per `docs/02-current-architecture.md`), a
  new aggregation must not introduce a heavy computation that re-runs on every render across
  the whole app — reuse `useMemo` with correct dependencies as already done elsewhere.

# Acceptance Criteria

- [ ] Every Dashboard KPI tile reflects real data from the currently-loaded operational state
      when Supabase is configured.
- [ ] Demo mode (Supabase unconfigured) still renders a reasonable fallback, not a crash or
      blank tiles.
- [ ] No new remote query is introduced that duplicates data already loaded by
      `useOperationalData` — aggregation happens client-side from existing state.
- [ ] `docs/00-project-overview.md`'s "Known limitations" no longer lists demo KPI tiles as an
      issue.

# Testing Checklist

- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run test` — add unit tests for any new aggregation function in
      `lib/production-summary.ts`.
- [ ] `npm.cmd run build`
- [ ] Manual: with Supabase configured and real data present, confirm each KPI tile matches
      what Nhật ký NVL / Báo cáo hao hụt independently show for the same period.
- [ ] Manual: with Supabase env vars unset (demo mode), confirm the Dashboard still renders
      without errors.

# Estimated Complexity
M
