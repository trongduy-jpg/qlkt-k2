> **STATUS: ✅ COMPLETED — CLOSED.** All acceptance criteria satisfied; lint is clean
> (0 errors, 0 warnings) and is now a mandatory gate in `docs/13-definition-of-done.md`.
> See "Task status" below for the full verification record. The "Goal", "Business value", and
> "Current implementation" sections below describe the **pre-task baseline**, not the current
> state.

# Goal

Add a real ESLint configuration to the repository so that `npm run lint` actually lints the
code, instead of being a defined-but-non-functional script.

# Business value

*(Historical — this describes the pre-task problem, which no longer exists. See the STATUS
banner above for the current state.)*

At the time this task was written, `package.json` defined `"lint": "next lint"` and
`eslint-config-next` was installed, but **no** `.eslintrc*` or `eslint.config.*` file existed
anywhere in the repository — so the lint command had nothing to run against. Every convention
documented in `docs/09-coding-standard.md` (naming, layer-import boundaries, `any` avoidance,
etc.) was enforced only by manual review. Adding a working lint config turns already-written
conventions into an automatically-checkable gate, catching regressions before they reach
review — a low-cost, high-leverage quality investment.

# Current implementation

- `package.json` → `"lint": "next lint"`.
- `eslint-config-next` is present in `package.json` dependencies.
- No `.eslintrc.json`, `.eslintrc.js`, or `eslint.config.mjs` exists in the repo root.
- Documented as `L-12` in `docs/14-known-limitations.md` and `docs/09-coding-standard.md`.
- `docs/13-definition-of-done.md`'s completion gate currently lists `typecheck`, `test`, and
  `build` as mandatory — `lint` is notably absent because it does not currently do anything.

# Proposed improvement

1. Add `eslint.config.mjs` extending `next/core-web-vitals` (matching the installed
   `eslint-config-next` version and the flat-config format Next.js 15 expects).
2. Run `npm.cmd run lint` once the config exists and fix (or explicitly, narrowly suppress
   with justification) whatever it surfaces — do not silently disable rules wholesale just to
   get a clean pass.
3. Add the `lint` command to the mandatory checklist in `docs/13-definition-of-done.md`
   alongside `typecheck`/`test`/`build`.

# Files likely affected

- New file: `eslint.config.mjs`
- Any source files with newly-surfaced lint violations (expected to be minor — the codebase
  already follows most of its own documented conventions per `docs/09-coding-standard.md`)
- `docs/09-coding-standard.md` (remove/update L-12)
- `docs/13-definition-of-done.md` (add `lint` to the mandatory checklist)
- `docs/14-known-limitations.md` (remove L-12)

# Risks

- Low risk in isolation, but the *number* of violations surfaced on first run is unknown until
  the config exists — this could reveal a non-trivial cleanup pass if the codebase has drifted
  more than expected from Next.js's default recommended rules.
- Must not introduce a lint config so strict that it blocks unrelated future work with
  unrelated warnings; start from `next/core-web-vitals` (the standard baseline for this stack)
  rather than a custom strict ruleset.
- Adding `lint` to the Definition of Done gate raises the bar for every future task — confirm
  this is acceptable before making it mandatory rather than advisory.

# Acceptance Criteria

- [x] **`npm.cmd run lint` runs and either passes cleanly or fails with a small, reviewed,
      intentional set of remaining warnings (not silently suppressed).** `eslint.config.mjs`
      exists and `npm.cmd run lint` passes **completely clean — 0 errors, 0 warnings**.
- [x] **The lint config is committed and applies to the whole repository.** `eslint.config.mjs`
      at the repo root uses `FlatCompat` + `next/core-web-vitals` only, with no path/file
      exclusions narrowing its scope.
- [x] **`docs/13-definition-of-done.md` lists `lint` as part of the mandatory checklist.**
      `npm.cmd run lint` is now the first step in the gate flowchart and a mandatory checklist
      item, recording the clean 0-error/0-warning baseline so that any new warning reads as a
      regression introduced by that change.
- [x] **`docs/09-coding-standard.md` and `docs/14-known-limitations.md` no longer describe L-12
      as an open issue.** L-12 is marked **RESOLVED (narrow sense)** in
      `14-known-limitations.md` (both the register entry and the severity diagram), and
      `09-coding-standard.md` gained a "Linting" section documenting the clean baseline, the
      mandatory gate, and the full suppression inventory. `10-testing.md` was also updated to
      stop describing lint as non-functional.

### Warnings — both resolved

| # | File | Rule | Resolution |
|---|---|---|---|
| 1 | `components/auth-context.tsx` | (stale suppression) | **Removed** the dead `eslint-disable-next-line react-hooks/exhaustive-deps` comment above the auth-session mount-only effect. Comment-only change, no behavior change. |
| 2 | `components/material-dashboard.tsx` | `react-hooks/exhaustive-deps` | **Targeted suppression added** on the mount-only data-load `useEffect`, with a comment explaining the effect must run exactly once per session. Analysis established that `reloadOperationalData` is recreated on every render (not memoized), so adding the reported dependencies would refire the effect on nearly every render — repeated Supabase loads, loading-state flicker, and overwriting the in-progress movement draft. Comment-only change, no behavior change. |

Both follow the pattern already documented in `docs/09-coding-standard.md` (React patterns):
mount-once effects use `[]` plus a rule-specific `eslint-disable-next-line` with a stated
reason. No dependency array, `useCallback`, hook structure, or blanket suppression was
introduced.

### Scope note — suppressions this task did *not* touch

This task added **exactly one** new suppression (the `material-dashboard.tsx` mount-only effect
above) and removed one dead one. It did **not** audit the rest.

The repository currently has **7 active `eslint-disable-next-line react-hooks/exhaustive-deps`
suppressions across 5 files**: `material-dashboard.tsx` ×3, `material-movement-drawer.tsx`,
`use-local-storage-persistence.ts`, `use-selected-production-order.ts`, `worker-box-view.tsx`.
**6 of those 7 predate this task**, are all bare with no explanatory comment, and were neither
reviewed nor justified here — the clean 0-warning baseline depends on them, so removing any one
re-surfaces a real warning.

Auditing those 6 is deliberately **out of scope** for this task and is recorded as residual
technical debt in `docs/14-known-limitations.md` (L-12). Do not read this task's closure as an
endorsement of them.

### Final verified command results

| Command | Result |
|---|---|
| `npm.cmd run lint` | **0 errors, 0 warnings** — "✔ No ESLint warnings or errors" |
| `npm.cmd run typecheck` | **pass** — `tsc --noEmit`, zero errors |
| `npm.cmd run test` | **pass — 85 tests**, 4 test files |
| `npm.cmd run build` | **pass** — `next build` exit 0, all 10 routes generated, no lint output |

### Task status: **Completed — closed**

All four acceptance criteria are satisfied: the ESLint config exists and applies repo-wide,
`npm.cmd run lint` passes with a fully clean baseline, `lint` is a mandatory gate in
`13-definition-of-done.md`, and L-12 is marked resolved in `14-known-limitations.md`. No
remaining work and no deferred decisions belong to this task.

Deliberately **not** claimed by this task: ESLint enforces only the `next/core-web-vitals`
baseline, so it does not check this repo's naming, layer-import, or `any`-avoidance conventions.
That was never in scope here and remains a separate improvement idea recorded in
`09-coding-standard.md`'s "Future improvements".

# Testing Checklist

- [x] `npm.cmd run lint` — passes, 0 errors and 0 warnings.
- [x] `npm.cmd run typecheck` — passes.
- [x] `npm.cmd run test` — passes, 85 tests.
- [x] `npm.cmd run build` — passes.

# Estimated Complexity
S
