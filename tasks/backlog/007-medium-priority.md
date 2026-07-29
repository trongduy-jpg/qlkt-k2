# Goal

Add a real ESLint configuration to the repository so that `npm run lint` actually lints the
code, instead of being a defined-but-non-functional script.

# Business value

`package.json` defines `"lint": "next lint"` and `eslint-config-next` is installed, but no
`.eslintrc*` or `eslint.config.*` file exists anywhere in the repository — so the lint command
currently has nothing to run against. Every convention documented in
`docs/09-coding-standard.md` (naming, layer-import boundaries, `any` avoidance, etc.) is today
enforced only by manual review. Adding a working lint config turns already-written
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

- [ ] `npm.cmd run lint` runs and either passes cleanly or fails with a small, reviewed,
      intentional set of remaining warnings (not silently suppressed).
- [ ] The lint config is committed and applies to the whole repository.
- [ ] `docs/13-definition-of-done.md` lists `lint` as part of the mandatory checklist.
- [ ] `docs/09-coding-standard.md` and `docs/14-known-limitations.md` no longer describe L-12
      as an open issue.

# Testing Checklist

- [ ] `npm.cmd run lint` (new — confirm it actually executes and reports something)
- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd run test`
- [ ] `npm.cmd run build`

# Estimated Complexity
S
