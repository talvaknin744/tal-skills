# Adversarial review of the shared backend example

Research and acceptance proposal, 2026-09-29. This document follows the
[backend](lanes/backend.md), [storage](lanes/storage.md), and
[quality](lanes/quality.md) lane findings. It is an original implementation
contract for the proposed TypeScript, Python, and Go examples, not an executed
integration test or a protocol supplied by a book.

## Recommended minimal example

Use a **tenant-scoped inventory reservation entirely inside one PostgreSQL
transaction**. It demonstrates a real business invariant and repeat safety with
two tables, without implying that an external charge or message send can join a
local transaction. All three implementations expose equivalent behavior and use
the same schema and scenario data. HTTP servers are optional; the core operation
can be exercised directly through a language-native API.

Conceptual interface:

```text
reserve(trustedTenant, requestKey, {sku, quantity}, cancellation)
  -> Receipt {reservationId, sku, quantity}
  | InvalidInput | IntentConflict | UnavailableInventory
  | DatabaseFailure | UnknownOutcome
  | native cancellation/deadline error

lookup(trustedTenant, requestKey, cancellation)
  -> Receipt | NotObserved
```

`trustedTenant` comes from the caller's authenticated context, not a tenant field
inside the untrusted command. The fixture supplies that context explicitly; this
does not claim to implement a complete authentication system. Both creation and
lookup enforce the scope. Keep the operation namespace fixed as `reserve-v1`
across ordinary deployments. A new release or response representation must not
silently make outstanding keys look unused.

Accept a request key and SKU of 1–128 visible ASCII characters (`0x21..0x7e`,
excluding whitespace and control characters). This is a deliberately narrow
example contract, not a general rule for product identifiers. The command has
exactly `sku` and `quantity`; reject missing or unexpected fields. Accept a finite
numeric integral quantity in `1..1_000_000`, normalized to an integer. Parsed
numeric `1.0` and `1e0` therefore mean quantity one; booleans, fractions, NaN,
infinity, and numeric strings do not. Match these semantics in each language's
JSON boundary instead of depending on Python's bool/int relationship or Go's
zero-value decoding. Compare the explicit validated `sku` and
`quantity` fields on replay. Arbitrary JSON canonicalization and hashing add no
value to this small contract. The UUID receipt is an identifier, not an ordering
or fencing token.

The retained contract covers **successful reservations for the lifetime of the
database records**. Do not add automatic expiry or a cleanup endpoint. A
validation or unavailable-inventory rejection commits no reservation and changes
no stock; an explicit later submission may be evaluated again against current
inventory. Such rejection is not an automatically retried transient error. This
is an intentional success-only retention policy, not Stripe's result policy.
Production retention, privacy deletion, and tombstone design are separate work.

## SQL and transaction boundary

The shared schema needs the following constraints; application SQL uses bound
parameters, not string interpolation:

```sql
CREATE TABLE inventory (
  tenant_id text NOT NULL,
  sku text NOT NULL,
  available integer NOT NULL CHECK (available >= 0),
  PRIMARY KEY (tenant_id, sku)
);

CREATE TABLE reservations (
  tenant_id text NOT NULL,
  operation_type text NOT NULL CHECK (operation_type = 'reserve-v1'),
  request_key text NOT NULL,
  reservation_id uuid NOT NULL,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 1000000),
  PRIMARY KEY (tenant_id, operation_type, request_key),
  UNIQUE (tenant_id, reservation_id),
  FOREIGN KEY (tenant_id, sku) REFERENCES inventory (tenant_id, sku)
);
```

The example service never updates or deletes a committed reservation. Fixture
setup/reset has separate ownership and operates only on the disposable test
database. The foreign key prevents a reservation pointing outside its tenant's
inventory. Missing inventory is mapped to the documented pre-effect rejection;
do not expose raw database details to an external caller.

On **one acquired connection**, run this sequence with explicit Read Committed
isolation:

1. Check cancellation, validate the command, and begin the transaction. Generate
   one candidate receipt ID for this attempt.
2. `INSERT INTO reservations (...) VALUES (...)
   ON CONFLICT (tenant_id, operation_type, request_key) DO NOTHING
   RETURNING reservation_id, sku, quantity`.
3. If inserted, decrement stock with
   `UPDATE inventory SET available = available - $quantity
   WHERE tenant_id = $tenant AND sku = $sku AND available >= $quantity
   RETURNING available`. Exactly one returned row permits commit. Zero rows
   means rollback and `UnavailableInventory`. Returning from the function before
   commit would expose an uncommitted success.
4. If the insertion returned zero rows, issue a **separate SQL statement** to
   select the committed reservation by the complete scoped key. Compare its
   intent before returning its saved receipt. Mismatch means `IntentConflict`
   with no mutation. A missing row violates this example's no-deletion assumption;
   return an explicit failure, not a newly fabricated receipt or an unbounded
   retry loop. End the read transaction before release.
5. Once COMMIT is acknowledged, return the saved receipt. If the acknowledgement
   is lost, preserve `UnknownOutcome` and the caller's original identity. A new
   invocation with the same scope, key, and intent may safely re-enter this exact
   local protocol: uniqueness resolves whether the original committed. A generic
   transaction-body retry rule does not establish this safety for other effects.

PostgreSQL documents that `DO NOTHING` can lose to a row not visible in the
statement snapshot; `RETURNING` includes only inserted/updated rows. Therefore a
single CTE that tries to insert and then reads the existing row using that same
statement snapshot can yield no receipt during contention. The separate Read
Committed statement is deliberate. A dummy `DO UPDATE` is not a free substitute:
it changes update/trigger behavior. [INSERT contract](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT),
[Read Committed semantics](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED)

No automatic transaction retry is needed for the first example. Surface confirmed
database aborts distinctly from uncertain completion. If a later version adds
serialization/deadlock retries, bound them and rerun the correct unit; never
retry constraint violations or cancellation merely because they are exceptions.
[PostgreSQL retry classification](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html)

`NotObserved` from lookup is intentionally weaker than “aborted”: another
transaction may still be in flight. A caller must not turn absence into a new
operation key. Reads go to the same authoritative database in this example;
replica/failover and disaster-recovery guarantees remain outside this test.

## Dangerous histories the contract excludes

| Tempting shortcut | Counterexample | Required behavior |
| --- | --- | --- |
| Same key always returns success | Tenant A reserves SKU X, then repeats the key for Y | Compare retained intent and reject the conflict before any second mutation |
| One globally unique client key is sufficient | Tenants A and B both legitimately choose `checkout-1` | Independent scoped identities; neither can retrieve the other's receipt |
| New payload hash or API version gives a fresh key namespace | Old worker commits under normalization v1; a deployment looks only in v2 | Preserve existing identity lookup and interpretation for outstanding requests |
| Expiring the ledger is ordinary cache cleanup | Reservation remains applied after its key is forgotten | This fixture retains the ledger; broader retention needs a separate proven replay policy |
| Lost COMMIT reply means rollback | Database commits and the connection disappears before acknowledgement | Keep unknown outcome, reconnect, and resolve using the original identity |
| A later pool timeout proves the logical request never ran | Attempt 1 is uncertain; attempt 2 never acquires a connection | Attempt 2 adds no effect but cannot erase attempt 1's uncertainty |
| Existence check then insert chooses one owner | Both workers observe no row, then both mutate stock | The unique scoped insert arbitrates before stock mutation |
| A primary read prevents over-reservation | Different keys concurrently read one available item | The conditional stock mutation enforces the invariant |
| Local transaction also covers external notification | Email succeeds, then the database transaction aborts | No email in this example; an extension needs a durable handoff and its own effect identity |
| More current response fields improve replay | Inventory changes after the first reservation | Return the immutable receipt; current availability is a different read |

The retention counterexample is a contract boundary supported by real provider
behavior: Stripe can treat a key as new once the retained record is pruned. That
does not make this PostgreSQL example a Stripe implementation.
[Stripe key retention](https://docs.stripe.com/api/idempotent_requests)

## Cancellation and resource ownership

Cancellation is a request to stop, not a durable outcome. PostgreSQL explicitly
warns that a dispatched cancellation can arrive after completion. Preserve the
request phase—before dispatch, transaction active, COMMIT sent, commit
acknowledged—so reporting does not equate every cancellation with rollback.
[PostgreSQL cancellation](https://www.postgresql.org/docs/current/libpq-cancel.html)

- **Before dispatch:** a first attempt known not to have begun work has no
  effect. Release an acquired connection or arrange cleanup if a queued
  acquisition completes later. Earlier uncertain attempts remain uncertain.
- **Before COMMIT:** await rollback or otherwise retire the connection safely.
  Stop issuing business SQL. Cancellation cleanup has its own short bounded
  allowance; do not return an open or failed transaction to a pool.
- **COMMIT sent:** if success is not known, retain uncertainty even if local
  cancellation or connection closure succeeds. Reconcile on a usable connection.
- **Commit acknowledged:** local response cancellation cannot undo the reservation.
  The client may not receive a receipt, but a later same-key retry finds it.
- **After every path:** join owned tasks, finish or discard the transaction,
  release/discard the connection exactly once, remove listeners and timers, and
  preserve the original exception/cancellation without replacing it with a
  secondary cleanup error. Report cleanup failure separately.

The service receives one end-to-end deadline. Derive per-statement limits from
its remaining budget; do not restart the whole allowance at every await. Positive
PostgreSQL `statement_timeout`/`lock_timeout` provide a server-side bound where
appropriate. An exhausted millisecond budget must fail locally rather than become
zero, which disables the corresponding PostgreSQL timeout. These server limits
do not include local pool waiting. [PostgreSQL timeout settings](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-STATEMENT-TIMEOUT)

| Language | Required implementation check |
| --- | --- |
| Python | `try/finally` or async context ownership survives `CancelledError`; cleanup completes and cancellation propagates. Join child work with an owned task group if children exist. Psycopg cancellation requests database cancellation but does not guarantee noncompletion. |
| TypeScript | Pass the signal only to APIs that support it. An `AbortSignal` or `Promise.race` alone does not cancel SQL or a queued `pool.connect()`. Own late acquisition and in-flight completion; safely discard a connection that cannot be returned. Check an already aborted signal, use a one-shot listener, and remove listeners on ordinary completion too. |
| Go | Propagate context to acquisition and database calls and invoke every derived cancel function. Waiting for work to stop is separate from canceling it. With pgxpool, canceling the context used for Begin/BeginTx does not automatically roll back the transaction; explicitly finalize it, using bounded cleanup context when the request context is already canceled. |

These checks follow the official [asyncio cancellation](https://docs.python.org/3/library/asyncio-task.html#task-cancellation),
[Psycopg async interruption](https://www.psycopg.org/psycopg3/docs/advanced/async.html#interrupting-async-operations),
[Node AbortSignal](https://nodejs.org/api/globals.html#class-abortsignal),
[node-postgres transaction](https://node-postgres.com/features/transactions),
[node-postgres pool](https://node-postgres.com/apis/pool),
[Go context](https://pkg.go.dev/context), and
[pgxpool transaction](https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool#Pool.BeginTx)
contracts. Pin actual driver versions and inspect their cancellation mechanism
before writing adapters. This review does not assert that the libraries expose
equivalent cancellation APIs. The fetched Psycopg page labels itself a development
build; verify the same behavior in the selected released driver.

## Real PostgreSQL acceptance suite

Start an isolated disposable PostgreSQL instance with a recorded server version
and ordinary durability settings. Bind locally, use only synthetic fixtures, and
give each run a unique database/schema and connection `application_name`. Use
real connections and the same schema for all languages; mocks cannot establish
unique arbitration or statement-snapshot behavior. Record the runtime, driver,
commands, and observed results. Tests below are proposed, not passed checks.

| Scenario | Controlled schedule and oracle |
| --- | --- |
| Sequential duplicate | Reserve two from five; replay unchanged intent. Same receipt, one reservation row, available three |
| Legitimate repeat purchase | Two different keys with the same fields. Two receipt IDs and stock decremented twice |
| Concurrent duplicate | Hold A after its successful insert. Dispatch B's insert on a second connection and observe its lock wait; commit A, then release B. Both return A's receipt, one decrement |
| Conflicting concurrent intent | Same schedule with B requesting another quantity. A succeeds, B conflicts, stock reflects only A |
| Cross-tenant identity | Same textual key and SKU in two tenant fixtures. Each returns its own receipt and changes only its inventory; scoped lookup cannot disclose the other receipt |
| Last available item | Two distinct keys contend for one unit. One succeeds, one is unavailable; one row and zero stock remain |
| Failure before mutation | Abort after ledger insertion, before decrement. No committed reservation and unchanged inventory; later same-key request succeeds |
| Failure before commit | Decrement, then interrupt at a test gate before COMMIT. After confirmed rollback both table changes are absent; the connection is reusable or explicitly discarded |
| Commit/response uncertainty | Commit for real, then suppress delivery of the success at the adapter's response seam. A fresh client repeats the original command and gets the one saved receipt; effect count remains one |
| Missing-record observation | Keep A uncommitted; a separate lookup returns `NotObserved`. It must not be classified as confirmed abort; same-key arbitration still waits for A's resolution |
| Native cancellation | Cancel each language's actual cancellation primitive while a query or acquisition is blocked. Await cleanup; no held connection, active test transaction, or unjoined task remains |
| Resource recovery | With pool size one when pooling is used, repeat cancellation/failure and immediately execute a fresh request. Complete within the test deadline without increasing held resources |
| Runtime validation | Reject booleans, fractions, numeric strings, oversized keys, malformed commands, and quantity limits before mutation, with matching semantic outcomes in all three languages |

Use explicit barriers and database-observed lock waits rather than a guessed
sleep. A barrier requiring B to pass A's held unique lock deadlocks the test
itself. Bound polling by a deadline and preserve failure diagnostics. Keep a
fresh observer connection outside a size-one application pool where needed.

The commit/response-seam fault is honest evidence of application recovery after a
real commit; label it **fault-injected response loss**, not a demonstrated TCP
failure at the PostgreSQL COMMIT packet. A transport proxy can add that stronger
test later. Closing and reopening clients proves independence from process-local
memory; it does not establish crash durability, failover behavior, or an RPO.

## Cleanup-agent rejection tests

The cleanup agent must retain code whose apparently redundant work carries this
contract. Reject a cleanup that removes the tenant predicate, changes the scoped
key namespace, merges the two conflict-resolution statements, drops input
validation because static types compile, deletes rollback/finalization, or
converts an uncertain commit into a generic automatic retry with a new key.

Likewise preserve a short comment explaining the fresh-snapshot requirement or
an incident-driven retention boundary. Remove a comment only when its meaning is
already clear or demonstrably stale; verbosity alone does not prove redundancy.
Reject `Promise.race` simplifications that lose late resources, Python cleanup
that swallows cancellation, and Go cleanup that reuses an already canceled
context without proving transaction finalization.

A cleanup passes only when it addresses a named maintenance burden, preserves the
accepted histories and public outcomes, and leaves the ownership path easier to
trace. Typechecking, formatting, and a sequential happy-path test alone cannot
establish that result. These are original safeguards derived from the reviewed
failure contracts and the quality lane's behavior-comparison evidence.
