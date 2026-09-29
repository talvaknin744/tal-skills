# Python reservation example

Python 3.11+ and pinned Psycopg 3.3.6 / psycopg-pool 3.3.3 implement a small
library-level inventory operation against the shared PostgreSQL schema.
`verify.py` is explicitly launched integration coverage; ordinary repository test
discovery does not start a database.

Create an isolated environment and install its dependencies:

```sh
python3 -m venv /tmp/tal-backend-python
/tmp/tal-backend-python/bin/python -m pip install -r examples/backend/python/requirements.txt
```

The common disposable launcher supplies database and COMMIT-reply-loss proxy
URLs, then cleans both resources. From the repository root, execute:

```sh
python3 examples/backend/run.py -- /tmp/tal-backend-python/bin/python examples/backend/python/verify.py
```

Set `TAL_EXAMPLE_REPORT` to write a machine-readable observation report. The
verifier creates unique synthetic tenant IDs and removes only its own fixtures;
it never truncates the database. Run against the disposable fixture, not a live
service database.

`ReservationService.reserve(trusted_tenant, key, command)` validates exactly
`sku` and `quantity`, with visible ASCII identifiers and finite integral numeric
quantities. `1.0` means one; booleans and numeric strings are invalid. The caller
supplies authenticated tenant context separately. The fixture does not implement
authentication.

One explicit Read Committed transaction arbitrates the scoped key, decrements
inventory conditionally, and retains an immutable receipt. A repeated key with
changed intent raises `IntentConflict`. Successful keys remain retained; an
unavailable-inventory rejection writes no reservation and can be explicitly
submitted again later. There is no automatic retry or expiration policy.

`lookup` returning `None` means `NotObserved`, including when another transaction
is still in flight. An unacknowledged COMMIT raises `UnknownOutcome`. Reconcile
with the original tenant, key, and intent. Native `CancelledError` and
`TimeoutError` retain their identities and carry `operation_outcome` plus
`operation_identity`; `unknown` and `committed` must not be interpreted as a
rolled-back effect.

The service owns its pool; callers await all requests before closing it. Each
operation owns a lease, transaction, and cursor. Deadlines cover acquisition and
work, and remaining budgets become positive server statement limits. Abnormal
transaction exits deliberately close the connection locally before the driver
can start another rollback wait after the request timer has expired. The pool
context is still awaited to return the lease. This trades connection reuse after
rejections/aborts for a simple retirement path; normal successes reuse connections.
Native cancellation of active driver I/O can still take longer than the response
deadline. Repeated cancellation and all broken cancellation-channel schedules
remain outside the observed coverage.

The tests use awaited phase gates and observed PostgreSQL lock waits, including a
size-one pool recovery check. Application-response loss after acknowledged COMMIT
and actual transport loss of its reply are distinct observations. The example
establishes only the tested local transactional effects on one authoritative
PostgreSQL instance. It makes no external-provider, replication, failover,
power-loss, backup-recovery, or exactly-once network delivery guarantee.
