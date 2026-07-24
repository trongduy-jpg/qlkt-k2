# Inventory Rules

The inventory ledger is the source of truth.

Every stock change must create an immutable transaction.

Examples:

- receipt
- issue
- return
- transfer
- adjustment
- scrap
- reversal

Never directly change stock without recording a transaction.

Confirmed transactions must not be deleted. Correct them with reversal transactions.

Inventory writes should record:

- transaction type
- material
- quantity
- unit
- lot
- source location
- destination location
- reference document
- actor
- timestamp
- reason when required

Prevent negative inventory unless explicitly allowed by a documented business rule.
