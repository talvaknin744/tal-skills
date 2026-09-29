# TypeScript reservation example

A tenant-scoped inventory reservation with an immutable receipt in one PostgreSQL
transaction. The same retained key and intent return the original receipt;
a different intent conflicts. Two requests cannot reserve the last unit twice.
The service uses a unique-key insert followed by a separate Read Committed query
when another transaction wins.

From the repository root:

```sh
npm --prefix examples/backend/typescript ci
npm --prefix examples/backend/typescript run typecheck
python3 examples/backend/run.py --report examples/backend/typescript/verification.json -- npm --prefix examples/backend/typescript test
```

Docker, Node, npm, and Python are required. The common runner provisions a fresh
local database, installs the shared schema, starts the COMMIT-reply fault proxy,
and removes its resources afterward. The verifier only inserts unique synthetic
tenants. It never resets or drops an arbitrary database. Dependency versions are
pinned in the package files; `tsx` execution and `tsc --noEmit` are separate checks.

## API and ownership

`ReservationService.reserve(trustedTenant, key, command, options)` returns
`{reservationId, sku, quantity}`. `lookup(trustedTenant, key, options)` returns
that receipt or `null`, which means **not observed**, including while another
transaction remains in flight.

The tenant comes from the authenticated caller; this example does not implement
authentication. Tenant, key, and SKU use 1–128 visible ASCII characters as an
example fixture constraint. A command has exactly `sku` and `quantity`.
Quantities are finite numeric integers in `1..1_000_000`; parsed `1.0` and `1e0`
are equivalent, while booleans, strings, and fractions are rejected.

Use the exported `createPool` factory: it retains an owned socket for bounded
retirement without reaching through private driver fields. The caller owns this
pool and waits for every service operation before calling
`pool.end()`. `options.signal` supports native request cancellation;
`options.timeoutMs` defaults to five seconds and supplies one end-to-end budget.
Acquisition stays owned until its bounded promise settles, so a canceled request
can release a late client. Cancellation after acquisition retires the connection
and awaits both the query and client retirement. If graceful retirement stalls,
the owned socket is destroyed after the cleanup allowance (one second by default).
This timer assumes the event loop remains responsive. A lease owns its abort listener
and connection error listener until safe release or retirement.

A confirmed pre-COMMIT failure rolls back both tables. Native cancellation before
COMMIT propagates the original signal reason. A failure after COMMIT dispatch
throws `UnknownOutcome`, retaining the original identity and error/cancellation
in `cause`; it does not claim rollback. Reconcile on a usable direct connection
with the **same** tenant, key, and command. Confirmed serialization/deadlock aborts
remain `DatabaseFailure`. There are no automatic transaction retries.

Successful receipts have no expiry in this example. Rejected validation or
unavailable stock leaves no receipt; an explicit later submission can be evaluated
against current inventory. External charges and message sends cannot join this
local transaction. `TestHooks` are cooperative fixture gates for controlled real
transaction schedules, not a production plugin API.

## Executed evidence

[verification.json](verification.json) records the executed runtime and outcomes:
all 14 shared scenarios, final resource closure, and a stalled idle-retirement
regression. That additional case uses a real half-open loopback socket and
PostgreSQL startup, with SQL responses stubbed; it proves transport cleanup, not
SQL behavior. Contention and query
cancellation wait for `pg_stat_activity` lock observations. The unknown outcome
case drops the actual PostgreSQL COMMIT completion message, observes one committed
reservation, and recovers its receipt through a separate direct connection.

[verification-attempts.json](verification-attempts.json) retains two earlier
run failures and an independently reproduced retirement defect. The transport test first exposed an unhandled checked-out client error:
awaiting the rejected query did not replace a connection error listener. A later
final-session assertion observed the server's asynchronous disconnect cleanup;
the corrected oracle waits for a bounded, observable zero-session condition.
Independent review then demonstrated an idle peer withholding shutdown: the
operation remained pending despite zero pool capacity. Owned socket retirement
now force-closes that peer boundary and awaits completion.

Limits: one local PostgreSQL instance, plaintext loopback proxy, and nonpipeline
`pg`; no crash durability, TLS, replication, failover, restore, HTTP disconnect
adapter, or external-provider atomicity claim. Cleanup after a deadline can take
longer than the response budget. Confirmed COMMIT-abort classification is present
but was not separately fault-injected. The run does not exhaust every cancellation
schedule or connection failure. Bounded force-close covers request-lease
retirement; caller-owned `pool.end()` retains the driver's ordinary graceful
shutdown behavior, so this example does not claim a hard process-wide shutdown
deadline.
