# Database Rules

- PostgreSQL is the source of persistent data.
- Prisma is used only in infrastructure code.
- All schema changes require migrations.
- Never edit an applied production migration.
- Use foreign keys, unique constraints, check constraints, and indexes.
- Use transactions for multi-step writes.
- Avoid uncontrolled Prisma `include` trees.
- Use explicit `select` when only some fields are needed.

## Decimal Values

Use PostgreSQL `numeric` and Prisma `Decimal` for:

- money
- weight
- quantity
- purity
- unit cost

Do not use JavaScript floating-point calculations for business-critical decimal values.
