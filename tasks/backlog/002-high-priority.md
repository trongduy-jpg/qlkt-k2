# Goal

Stop exposing every user's email, full name, and role to any anonymous caller holding the
public Supabase anon key.

# Business value

The app's authorization model depends entirely on Postgres RLS (there is no application
server). The current `app_users` read policy defeats that model for the one table that lists
every authorized user — anyone with the anon key (which ships in the browser bundle) can
enumerate the full user directory without ever logging in. This is a straightforward
confidentiality leak with a narrow, low-risk fix.

# Current implementation

- Migration `supabase/migrations/0009_*.sql` creates:
  `create policy app_users_select_all on app_users for select using (true);`
- This policy has no `WHERE` restriction — `using (true)` means every row is readable by
  every request, authenticated or not.
- Migration `0011` fixed a *different* recursion bug in `app_users_admin_write`, but did not
  touch `app_users_select_all`.
- Documented as `L-02` in `docs/14-known-limitations.md` and in `docs/06-authentication.md`.
- The app's own client code only ever needs: (a) the whitelist check by email during login
  (`lib/auth-service.ts` → `isEmailAllowed`), (b) the current user's own role/name after login
  (`loadAppUserByEmail`), and (c) the full list for the admin-only Cấu hình → Users tab
  (`loadAppUsers`, gated client-side on `role === "admin"`).

# Proposed improvement

Replace the `using (true)` policy with one that only allows a row to be read when the
requester is the row's own user or an admin:

```sql
drop policy app_users_select_all on app_users;
create policy app_users_select_self_or_admin on app_users
  for select
  using (email = auth.jwt() ->> 'email' or is_admin_user());
```

This preserves every current legitimate use:
- Login's whitelist check does not depend on this policy — `isEmailAllowed` runs before a
  session exists it needs unauthenticated visibility for exactly the email being checked, so
  this requires either keeping a narrowly-scoped anonymous check or moving that check behind
  a `SECURITY DEFINER` function (mirroring the existing `is_whitelisted_user()` /
  `is_admin_user()` pattern already used for other policies).
- An authenticated user reading their own row still works (`email = auth.jwt() ->> 'email'`).
- An admin reading the full list for the Cấu hình → Users tab still works
  (`is_admin_user()`).

# Files likely affected

- New file: `supabase/migrations/00NN_restrict_app_users_select.sql`
- `lib/auth-service.ts` — only if `isEmailAllowed`'s anonymous pre-login check needs to be
  re-routed through a `SECURITY DEFINER` function rather than a direct table read
- `docs/05-database.md`, `docs/06-authentication.md`, `docs/14-known-limitations.md`
  (remove/update L-02)

# Risks

- If the anonymous whitelist check (`isEmailAllowed`, used before a session/JWT exists) is not
  preserved via a `SECURITY DEFINER` function, login breaks for legitimate users — this is the
  main thing to verify carefully before considering the change safe.
- Requires the user to run the migration manually in the Supabase SQL editor plus
  `notify pgrst, 'reload schema';` — cannot be verified end-to-end without that step.
- Any other code path relying on reading `app_users` pre-authentication (grep for
  `.from("app_users")` before changing) must be re-checked against the new policy.

# Acceptance Criteria

- [ ] `app_users_select_all using (true)` no longer exists.
- [ ] An anonymous request (no JWT) can no longer read arbitrary rows from `app_users`.
- [ ] Login via magic link still succeeds end-to-end for a whitelisted email.
- [ ] A non-admin authenticated user can read their own `app_users` row but not others'.
- [ ] An admin authenticated user can still read the full `app_users` list (Cấu hình → Users
      tab continues to work).

# Testing Checklist

- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run test`
- [ ] `npm.cmd run build`
- [ ] Manual: attempt an unauthenticated `select * from app_users` (e.g. via `curl` with only
      the anon key, no session) and confirm it returns 0 rows.
- [ ] Manual: log in as a whitelisted `nhan_vien` user and confirm login succeeds and only
      their own row is visible if queried directly.
- [ ] Manual: log in as `admin` and confirm the Cấu hình → Users tab still lists all users.
- [ ] Confirm the migration was run via the Supabase SQL editor and
      `notify pgrst, 'reload schema';` was executed.

# Estimated Complexity
S
