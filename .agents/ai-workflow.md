# AI Workflow Rules

Before editing:

1. Read relevant code and tests.
2. Identify the affected module and layer.
3. Read only the relevant rule files.
4. State assumptions when requirements are unclear.
5. Plan the smallest complete change.

During editing:

- follow existing patterns
- avoid unrelated refactors
- avoid unnecessary new files
- add tests with implementation
- preserve public contracts unless change is required

After editing:

1. Review the diff.
2. Remove debug code.
3. Run relevant tests.
4. Run lint and type checking.
5. Report files changed, commands run, assumptions, and risks.

Do not invent files, APIs, fields, or business rules without checking the repository.
