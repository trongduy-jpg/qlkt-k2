# Legacy Documentation — Not Authoritative

Everything under `docs/legacy/` predates the current database and domain layer (all 26
Supabase migrations landed *after* these documents were written) and is retained only as
historical business-analysis input — original scope, permission-matrix proposals, formulas
not yet implemented, and the Google Sheets origin analysis.

**The official documentation is `docs/00-project-overview.md` through `docs/15-future-roadmap.md`.**
If anything here disagrees with those 16 files or with the source code, the code wins.

## Migration table

| Legacy file | Action taken | Superseded by |
|---|---|---|
| `00-mvp-scope.md` | Archived | `00-project-overview.md`, `14-known-limitations.md` |
| `01-tong-quan-nghiep-vu.md` | Archived (merged) | `00-project-overview.md` |
| `02-vai-tro-va-phan-quyen.md` | Archived | `06-authentication.md`, `15-future-roadmap.md` (R-8) |
| ~~`03-quy-trinh-nghiep-vu.md`~~ | **Deleted** — byte-identical duplicate of `02-vai-tro-va-phan-quyen.md` | — |
| `04-quy-trinh-trang-thai-van-hanh.md` | Archived | `01-business-rules.md` |
| `05-cau-truc-du-lieu-va-doi-tuong.md` | Archived (replaced) | `04-domain-model.md`, `05-database.md` |
| `06-mo-hinh-du-lieu.md` | Archived (replaced) | `04-domain-model.md`, `05-database.md` |
| `07-yeu-cau-chuc-nang-srs.md` | Archived | `01-business-rules.md`, `15-future-roadmap.md` (R-13) |
| `08-bao-cao-dashboard-canh-bao.md` | Archived | `01-business-rules.md`, `15-future-roadmap.md` (R-13) |
| `09-kien-truc-giao-dien-ui.md` | Archived (replaced) | `07-ui-navigation.md` |
| `10-kien-truc-he-thong.md` | Archived (replaced) | `02-current-architecture.md` |
| `11-phan-tich-google-sheets.md` | Archived (kept as-is, still factually valid) | referenced by `15-future-roadmap.md` |
| `12-thiet-ke-truong-thong-tin-webapp.md` | Archived | `05-database.md` (explains the dead-schema origin) |
| `13-ke-hoach-xay-dung-webapp-tu-google-sheets.md` | Archived | `15-future-roadmap.md` |
| `ImproveFeature.md` | Archived (merged) | `01-business-rules.md`, `14-known-limitations.md`, `15-future-roadmap.md` |
| ~~`00-phan-tich-tai-lieu.md`~~ | **Deleted** — stale meta-audit of a doc set that no longer exists | — |
| `ai/README.md` | Archived (replaced) | `00-project-overview.md`, `12-ai-development-workflow.md` |
| `ai/glossary.md` | Archived (merged) | `04-domain-model.md` |
| `ai/01-business/system-overview.md` | Archived (merged) | `00-project-overview.md` |
| `ai/01-business/modules-overview.md` | Archived (replaced) | `00-project-overview.md`, `07-ui-navigation.md` |
| `ai/02-data-model/data-dictionary-lsx.md` | Archived (merged) | `04-domain-model.md` |
| `ai/02-data-model/data-dictionary-nk-nvl.md` | Archived (merged) | `04-domain-model.md` |
| `ai/02-data-model/data-dictionary-hao-hut.md` | Archived (replaced) | `04-domain-model.md` |
| `ai/02-data-model/data-dictionary-ton-hop-tho.md` | Archived (merged) | `04-domain-model.md` |
| `ai/02-data-model/domain-model.md` | Archived (replaced) | `04-domain-model.md` |
| `ai/03-workflows/core-workflows.md` | Archived (replaced) | `02-current-architecture.md`, `01-business-rules.md` |
| `ai/03-workflows/workflow-lsx-to-nknvl.md` | Archived (merged) | `01-business-rules.md` |
| `ai/03-workflows/workflow-hao-hut.md` | Archived (replaced) | `01-business-rules.md` |
| `ai/03-workflows/workflow-ton-hop-tho.md` | Archived | `14-known-limitations.md` (L-10), `15-future-roadmap.md` (R-12) |
| `ai/04-architecture/code-architecture.md` | Archived (replaced) | `02-current-architecture.md`, `03-folder-structure.md` |
| `ai/04-architecture/coding-standards.md` | Archived (merged) | `09-coding-standard.md` |
| `ai/04-architecture/file-ownership.md` | Archived (replaced) | `03-folder-structure.md` |
| `ai/05-frontend/ui-rules.md` | Archived (merged) | `07-ui-navigation.md` |
| `ai/05-frontend/form-rules.md` | Archived (merged) | `07-ui-navigation.md` |
| `ai/05-frontend/table-rules.md` | Archived (merged) | `07-ui-navigation.md` |
| `ai/06-backend/database-rules.md` | Archived (replaced) | `05-database.md` |
| `ai/06-backend/supabase-schema-guide.md` | Archived (replaced) | `05-database.md` |
| `ai/06-backend/sync-rules.md` | Archived (merged) | `02-current-architecture.md` |
| `ai/07-rules/business-rules.md` | Archived (merged) | `01-business-rules.md` |
| `ai/07-rules/status-machine.md` | Archived (replaced) | `01-business-rules.md` |
| `ai/07-rules/validation-rules.md` | Archived (replaced) | `01-business-rules.md` |
| `ai/08-delivery/definition-of-done.md` | Archived (replaced) | `13-definition-of-done.md` |
| `ai/08-delivery/task-execution-protocol.md` | Archived (replaced) | `12-ai-development-workflow.md` |
| `ai/08-delivery/testing-checklist.md` | Archived (merged) | `10-testing.md` |
| `ai/09-prompts/agent-prompts.md` | Archived (replaced) | `12-ai-development-workflow.md` |
| `ai/09-prompts/bugfix-prompt.md` | Archived (replaced) | `12-ai-development-workflow.md` |
| `ai/09-prompts/feature-prompt.md` | Archived (replaced) | `12-ai-development-workflow.md` |

Not yet migrated (outside `docs/`, unchanged by this pass): `.agents/**` (13 of 14 files
describe an architecture that was never built), `.ai/**` (dead scripts, duplicated prompts,
an unused state file). See `15-future-roadmap.md` (R-26).
