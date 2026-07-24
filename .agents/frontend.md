# Frontend Rules

This app is a client-side SPA on purpose: there is no backend service, only
Supabase (Postgres + Auth) accessed with the anon key directly from the
browser. `app/*/page.tsx` files are intentionally empty (`return null`) —
routing exists only so the URL/sidebar stays in sync; all real UI lives in
`MaterialDashboard`, mounted once in `app/layout.tsx`. Row Level Security in
Supabase is the actual authorization boundary, not the frontend.

- Keep React components focused on display and interaction; put business
  rules in `lib/production-*.ts` and other `lib/` modules, not inline in
  components.
- Do not duplicate Supabase RLS/authorization logic in the frontend — treat
  RLS as the source of truth for who can read/write what.
- Data fetching happens client-side via hooks (`use-operational-data.ts`,
  etc.) calling `lib/material-service.ts` — there are no Server Components
  and no server-side data loading. Do not introduce Server Components for
  data fetching; it would conflict with this app's draft/cache/local-storage
  patterns and the anon-key-only Supabase setup.
- Show loading, empty, and error states (`isLoadingRemote`, `remoteError`,
  "Chưa có dữ liệu" style empty states).
- Reuse validation schemas when appropriate (e.g. `validateMovementDraft`).
- Keep `app/*/page.tsx` files as thin route placeholders; real screens are
  components under `components/`.
- Use accessible components and labels: icon-only buttons need `aria-label`
  (mirroring `title` when present); filter/search inputs need `aria-label`
  when there's no visible `<label>` text.
- The frontend does access Supabase directly (anon key, RLS-gated) — this is
  the accepted architecture for this project, not a violation to fix.

Frontend validation improves usability but never replaces backend
validation (RLS policies + Supabase constraints).
