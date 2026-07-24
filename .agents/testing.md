# Testing Rules

Test observable behavior, not implementation details.

## Unit Tests

Use for:

- domain rules
- calculations
- value objects
- permission policies

## Integration Tests

Use for:

- repositories
- Prisma queries
- transactions
- API validation
- database constraints

## End-to-End Tests

Use for critical workflows:

- create material
- receive stock
- issue stock
- transfer stock
- adjust stock
- approve adjustment

Each business rule should include success, failure, and boundary cases.

Never claim tests passed unless they were executed.
