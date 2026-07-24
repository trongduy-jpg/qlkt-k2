# Error Handling Rules

Use explicit domain and application errors.

Examples:

- `MaterialNotFoundError`
- `DuplicateMaterialCodeError`
- `InsufficientStockError`
- `UnauthorizedAdjustmentError`

Do not:

- throw plain strings
- silently catch errors
- expose database errors to clients
- use message text as frontend logic
- return `null` for every failure

Every public API error should have a stable code.
