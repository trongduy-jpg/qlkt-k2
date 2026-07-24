# Backend Rules

## Controllers

Controllers may:

- parse requests
- call validation
- call use cases
- return responses

Controllers must not:

- access Prisma
- calculate stock or prices
- contain workflows
- enforce domain invariants

## Use Cases

One use case should represent one action.

Examples:

- `CreateMaterialUseCase`
- `ReceiveInventoryUseCase`
- `TransferInventoryUseCase`

A use case should coordinate authorization, domain logic, persistence, audit logs, and events.

## Repositories

Repository interfaces belong to domain or application boundaries.

Prisma implementations belong to infrastructure.

Do not expose Prisma-generated types outside infrastructure.
