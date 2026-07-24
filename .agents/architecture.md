# Architecture Rules

## Style

Use a modular monolith.

Organize code by business domain:

- identity
- materials
- inventory
- purchasing
- suppliers
- production
- pricing
- reporting
- auditing

## Layer Direction

Allowed:

```text
presentation -> application -> domain
infrastructure -> application/domain
```

Forbidden:

```text
domain -> infrastructure
domain -> presentation
domain -> Prisma
frontend -> database
```

## Responsibilities

- Presentation: HTTP and UI concerns only.
- Application: use cases, authorization, transactions, coordination.
- Domain: business rules and invariants.
- Infrastructure: Prisma, storage, queues, external services.

## Boundaries

Modules must communicate through public services, interfaces, or events.

Do not import another module's internal repository implementation.

## Abstractions

Create abstractions only for real variation or clear boundaries.

Do not create patterns for hypothetical future needs.
