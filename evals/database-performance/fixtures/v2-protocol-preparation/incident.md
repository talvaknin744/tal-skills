# Pool migration and prepared statement errors

This is synthetic incident evidence for a read only review. The API runs on
PostgreSQL 17.6 through PgBouncer 1.23.1. The effective API database pool mode is
transaction and max_prepared_statements is 100. These observations came from
the deployed process, not from a proposed configuration file. The application
driver's captured wire messages use named extended protocol Parse and Bind.
There is no supplied driver compatibility test across backend reassignment.

The driver request path emits repeated SELECT queries. In the same release, a
legacy report path emits these SQL text commands in separate transactions on
one application connection:

```sql
BEGIN;
PREPARE monthly_report(int) AS SELECT total FROM report_totals WHERE tenant_id = $1;
COMMIT;
BEGIN;
EXECUTE monthly_report(42);
```

The legacy report sometimes logs prepared statement monthly_report does not
exist after PgBouncer assigns a different server connection. The named protocol
path has no matching error in the sample, although its concurrency and backend
reassignment coverage are unknown.

Client p99 increased from 180 to 520 ms. Pool assignment wait has increased and
report retries have tripled. The repeated SELECT execution samples remain near
20 ms. The fleet already reserves most of the database connection budget.

One proposal says transaction pooling makes every prepared statement invalid
and disables preparation for all drivers. Another says max_prepared_statements
of 100 makes the legacy SQL path safe and recommends doubling pool size. No
candidate was applied and no schema migration compatibility check was run.
