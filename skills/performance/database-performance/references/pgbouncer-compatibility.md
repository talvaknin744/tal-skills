# PgBouncer mode and application compatibility

Use this branch when PgBouncer is deployed and a pool mode change or stateful
client behavior affects the incident. Inspect the installed PgBouncer,
PostgreSQL and driver versions, effective database/user pool mode and actual
wire protocol. Session pooling retains a server for the client session.
Transaction pooling releases it at transaction end. Statement pooling also
disallows multiple statement transactions. An application connection staying
open does not establish backend session affinity in transaction mode.

## Prepared statements

Distinguish driver protocol preparation from SQL `PREPARE`, `EXECUTE` and
`DEALLOCATE`. PgBouncer supports named protocol prepared statements in transaction
pooling from version 1.21 when `max_prepared_statements` is nonzero. Verify driver
compatibility and the effective setting on the deployed version. The pooler can
prepare the statement on a newly assigned backend. SQL preparation commands do
not receive that tracking, apart from documented clearing commands such as
`DEALLOCATE ALL`. Inventory both paths before disabling all preparation or
claiming a nonzero setting makes every prepared statement compatible. Include
backend reassignment and relevant schema changes in an authorized verification.

## State lifetime

Inventory the lifetime each operation actually requires. `LISTEN`, session
advisory locks, cursors held across commits and temporary tables preserved across
transactions depend on session state. Keep those paths on a budgeted session
connection or redesign their ownership before moving them to transaction mode.
`NOTIFY` and a temporary table created and consumed within one transaction with
`ON COMMIT DROP` have different lifetimes.

For state needed only within one transaction, consider `SET LOCAL` and transaction
advisory locks inside the same explicit transaction. Confirm that the shorter
lifetime preserves the invariant. A lock protecting work across several
transactions cannot simply become a transaction lock. Session advisory locks
survive rollback, while transaction advisory locks release at transaction end.
Generic session `SET` and later `RESET` assumptions are not portable across
backend reassignment. Verify any documented parameter tracking against both
installed versions rather than assuming every parameter is tracked.

Verify reassignment, commit, rollback, cancellation and subsequent client reuse
in the authorized environment. Observe state isolation, prepared statement
behavior, listener/lock ownership and pool waits alongside useful throughput.
Report proposals separately from executed compatibility checks. Larger pools
can conceal reassignment during a toy run without restoring the lifetime contract.
