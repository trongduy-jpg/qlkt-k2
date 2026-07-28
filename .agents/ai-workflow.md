## Multi-Agent Collaboration

- Each task has exactly one implementation owner.
- Claude and Codex must work on separate branches and worktrees.
- Before editing, read the assigned task and confirm the allowed paths.
- Do not modify files owned by another active task.
- Do not work directly on `main` or `develop`.
- Do not merge or deploy unless explicitly instructed by the user.
- Commit only changes related to the assigned task.
- If two tasks require the same file, stop and report the conflict before editing.

### Roles

Claude primarily handles:

- business-rule analysis
- architecture and domain design
- complex business logic
- domain correctness review

Codex primarily handles:

- implementation
- Supabase and API integration
- automated tests
- TypeScript, lint, build, and technical review

### Completion Report

Every agent must report:

- task completed
- files changed
- tests and commands executed
- assumptions
- known risks
- commit hash