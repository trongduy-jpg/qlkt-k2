# API Rules

- Use REST under `/api/v1`.
- Keep controllers thin.
- Validate all request input.
- Return stable error codes.
- Use explicit request and response DTOs.
- Do not expose Prisma models directly.
- Keep pagination, filtering, and sorting consistent.
- Avoid breaking API contracts without a migration plan.
- Update OpenAPI documentation when contracts change.

Example error:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Available stock is lower than requested quantity."
  }
}
```
