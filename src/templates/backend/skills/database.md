# Database Patterns

## Query Safety
- Always use parameterized queries — never string interpolation for user input.
- Use the ORM's query builder for dynamic filters instead of raw SQL concatenation.
- Set query timeouts to prevent long-running queries from blocking the pool.

## Schema Design
- Use UUIDs or ULIDs as primary keys for distributed systems.
- Add `created_at` and `updated_at` timestamps to every table.
- Use soft deletes (`deleted_at`) for data that might need recovery.
- Define foreign key constraints for referential integrity.
- Add CHECK constraints for enum-like columns.

## Migrations
- One migration per logical change.
- Migrations must be reversible (include both `up` and `down`).
- Never modify a migration that has been applied to production.
- Test migrations against a copy of production data when possible.

## Indexing
- Add indexes for columns used in WHERE clauses and JOINs.
- Use composite indexes for multi-column queries (most selective column first).
- Add unique indexes to enforce business rules (email, username).
- Monitor slow queries and add indexes based on actual query patterns.

## Connection Pooling
- Use connection pooling (pg-pool, HikariCP, etc.) — never open/close per request.
- Set pool size based on: `connections = (cpu_cores * 2) + disk_spindles`.
- Handle pool exhaustion gracefully with timeouts and retries.

## Transactions
- Use transactions for operations that modify multiple rows/tables.
- Keep transactions short — don't include API calls or file I/O inside a transaction.
- Use the appropriate isolation level (READ COMMITTED for most cases).
