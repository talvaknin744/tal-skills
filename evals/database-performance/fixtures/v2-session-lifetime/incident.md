# Pool waits after switching to transaction mode

This is synthetic incident evidence for a read only review. PostgreSQL 17.6 and
PgBouncer 1.23.1 serve the API. The effective mode changed from session to
transaction. App connections remain open for many requests but recorded backend
process IDs change after commit. Useful throughput decreased while retries and
pool assignment waits increased. No query plan regression is in this packet.

The request path executes SET app.tenant_id at connection creation, expecting
it to apply to all later tenant queries. app.tenant_id is a custom parameter and
is not reported through ParameterStatus. Each tenant query belongs to one
explicit transaction, and the invariant requires the correct tenant context for
every statement of that transaction. A tenant request for 42 has observed the
prior request's value 17 after backend reuse.

A scratch computation creates a temporary table with default ON COMMIT PRESERVE
ROWS, commits, then consumes it in the next transaction. Its caller requires
the computation result but does not require a commit between creation and use.
A separate export workflow uses pg_advisory_lock(9), commits several batches,
calls an external service, then unlocks. That lock intentionally protects the
entire workflow across all batches. A failed batch rolls back but the workflow
expects to retain ownership until explicit unlock or session end.

A dedicated notification listener uses LISTEN export_ready and then waits across
transactions on its application connection. Publishers use NOTIFY export_ready
within their own transactions. The listener's events became intermittent after
the mode change. There is no owned test environment running in this packet.

Proposals include replacing every session lock with pg_advisory_xact_lock,
adding RESET after each request, keeping the same application connection open,
and doubling pool size. Assess a bounded repair that preserves each stated
lifetime. Deployment and database mutations are outside this review request.
