# Task ID

REL-3

# Title

Stop silently degrading movement writes on ambiguous "missing column" errors

# Goal

Make the fallback path in `lib/material-movements-service.ts` trigger only on unambiguous schema-cache/missing-column errors (not on any error message that merely contains the word "column"), and surface a visible warning whenever a save actually goes through the reduced-field fallback, so operators are never silently left with a movement record missing ~25 business fields.

# Scope

- Only `lib/material-movements-service.ts`: tighten `isMissingColumnError` to classify based on the Supabase/Postgres error `code` (e.g. PostgREST `PGRST204`, Postgres `42703` undefined_column / schema-cache-related codes) rather than a free-text substring match on `error.message`. Keep the substring match only as a narrowly-scoped last-resort fallback if no reliable `code` is available, clearly commented as such.
- `createMaterialMovement` and `updateMaterialMovement` must report back (via return value or a side-channel) whether the fallback path was used for that save, so the caller can warn the user. Do not change what data those functions write on the non-fallback (normal) path.
- In `components/use-material-movements.ts`, `persistMovement` may need a small addition to receive this "used fallback" signal and pass a warning into the existing `setSavedMovementNotice` / `setRemoteError` channel. Keep this minimal — do not restructure `persistMovement`'s control flow beyond what's needed to plumb this one signal through.
- Do NOT change `buildMovementRow`, `buildMovementRowBaseOnly`, `mergeMovementResult`, `MOVEMENT_SELECT_COLUMNS`, or `MOVEMENT_SELECT_COLUMNS_FALLBACK` field lists themselves — the set of fields written/dropped is unchanged; only the trigger condition and user visibility change.
- Do NOT touch `loadProductionOrders`'s own fallback branch behavior beyond reusing the same tightened `isMissingColumnError` check (it currently shares the function).
- Do NOT change validation (`validateMovementDraft`), business rules (`production-business-rules.ts`), delete/restore logic (`removeOrder`), or any RLS/migration file.
- Do NOT implement UX-1 in full (the drawer-side visual styling of the warning) — only wire the signal through to the existing error/notice state so a follow-up UX task can style it; a plain-text warning message via the existing channel is sufficient here.

# Acceptance Criteria

- A genuine schema-cache/missing-column error from Supabase (real `PGRST204`/`42703`-style code) still triggers the reduced-column fallback and the save still succeeds with base fields only, same as today.
- A hypothetical validation/constraint error whose message happens to contain the word "column" (e.g. a check-constraint violation mentioning a column name) is **not** misclassified as a schema-cache error — it propagates as a normal save failure (existing `setRemoteError` error path), not a silent degraded "success".
- When a save actually uses the fallback path, the user sees a distinct message via the existing notice/error mechanism indicating that only base fields were saved (e.g. mentioning that a Supabase migration/schema reload is needed) — this must not be the same text as the normal "Đã lưu/Đã cập nhật" success notice.
- When a save uses the full column set (the common case), no fallback warning appears — behavior identical to before this change.
- No change to the actual set of columns written or selected in either path.
- No change to `validateMovementDraft`, `applyProductionBusinessRules`, `shouldForceDirectCharge`, or the `isClosedStatus` delete guard.

# Files allowed to modify

- `lib/material-movements-service.ts`
- `components/use-material-movements.ts` (only the minimal plumbing described above)

# Files forbidden to modify

- `components/material-movement-drawer.tsx`
- `components/material-journal-view.tsx`
- `components/use-operational-data.ts`
- `lib/materials-service.ts`
- `lib/production-helpers.ts`
- `lib/production-business-rules.ts`
- `lib/production-mappers.ts`
- `lib/supabase-mappers.ts`
- `lib/supabase.ts`
- Any file under `supabase/migrations/`
- Any file under `tasks/`

# Test plan

Manual verification (no existing automated coverage for this path yet — see backlog item TEST-3 for follow-up test coverage):

1. **Normal save (no fallback):** Create and update a movement with Supabase configured and schema fully migrated. Confirm save succeeds, no fallback warning shown, all fields persist as before.
2. **Genuine schema-cache/missing-column error:** Simulate by temporarily renaming/removing a column locally against a test database (not committed), or by inspecting the actual `error.code` Supabase-js returns for a missing-column select/insert in this project's Supabase version, and confirm the fallback still triggers and the save "succeeds" with base fields only, with the new warning now visible to the user.
3. **False-positive guard:** Construct or mock an error object whose `message` contains the word "column" but whose `code` is unrelated (e.g. a check constraint violation) and confirm it is now surfaced as a normal error via `setRemoteError`, not silently swallowed into the fallback path.
4. **UI check:** Confirm the fallback-warning message and the normal success notice are visibly distinct in the drawer (even if only distinguished by text content at this stage — full styling is deferred to UX-1).
5. Run `tsc`/build to confirm no type errors introduced.
