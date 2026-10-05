# Backend driver feasibility: cancellation and ownership

Research completed 2026-09-29 against released driver versions, with disposable
PostgreSQL probes. The proposed [shared backend contract](backend-contract-review.md)
is feasible, but its three language implementations must use different cancellation
and cleanup mechanisms. **Request cancellation, transaction outcome, and resource
cleanup are separate observations.**

The [machine-readable record](backend-runtime-feasibility.json) contains pins,
source locators, captured outcomes, artifact hashes, and limitations. These are
research fixtures, not the final inventory service or its acceptance suite.

## Pinned environment and observed results

All database probes used a pool of one and a loopback PostgreSQL 18.6 container
with `fsync` and `synchronous_commit` enabled. The image was pinned by digest.
Application names, fixtures, and schemas were synthetic and isolated.

| Runtime and libraries | Executed observation | Implementation consequence |
| --- | --- | --- |
| Node 25.9.0; `pg` 8.23.0; `pg-pool` 3.14.0 | Both an already-aborted query `signal` and one aborted during an observed server sleep were ignored. | Do not invent driver AbortSignal support. |
| Same Node versions, default nonpipeline mode | `query_timeout` returned `Query read timeout` while PostgreSQL remained active; the synthetic autocommit insertion subsequently committed. | Client result timeout does not stop SQL or establish safe connection reuse. |
| Same Node versions | Racing acquisition against abort left a queued acquire; releasing the held connection handed a client to the losing promise. | Retain ownership until the underlying acquire settles and release a late client. |
| Same Node versions | Pool acquisition timeout removed the waiter. Discard during a pre-COMMIT transaction, followed by awaited query settlement and observed backend removal, left zero effects and permitted a fresh request. | Bound acquisition; use explicit ownership and retirement for cancellation. |
| Python 3.14.3; `psycopg`/`psycopg-binary` 3.3.6; `psycopg_pool` 3.3.3; libpq 18.6 | Native task cancellation during an observed database sleep propagated `CancelledError`, rolled back, and reused the same IDLE connection. | Await transaction and pool context exits. |
| Same Python versions | A canceled pool waiter remained counted until the held client returned; it was then skipped and the pool recovered. A separate 30 ms `wait_for` with deliberately delayed cleanup took 132 ms. | An intermediate waiter count is not a leak verdict; response timeout and cleanup completion differ. |
| Go 1.27.1; `pgx` 5.11.0 | Canceling the context after BEGIN and mutation left the connection acquired and PostgreSQL idle in transaction. | Explicit transaction finalization remains required. |
| Same Go versions | Rollback with the canceled context returned an error and retired/released the connection. A fresh three-second cleanup context acknowledged rollback and preserved the connection. | Avoid unnecessary connection retirement; do not claim this pinned canceled-context path permanently leaks the pool. |
| Same Go versions | Three cancellations after observed database lock waits returned `context.Canceled`, retired the connections, completed cleanup, and allowed fresh requests in 8–12 ms. | A fresh cleanup context cannot restore an already-retired connection. |

Timings describe this local run, not production guarantees. Source inspection
also found cases the probes did not execute; those are identified below.

## TypeScript: make ownership explicit

The pinned query constructor does not consume `signal`. Its nonpipeline
`query_timeout` handler reports failure without canceling an already-dispatched
query. Pipeline mode has different behavior and was not tested. Passing a signal
or awaiting that client timeout therefore cannot establish cancellation of the
underlying operation. [Query configuration](https://github.com/brianc/node-postgres/blob/df274d1ba9ad9d11a8f1079314faeafde7208207/packages/pg/lib/query.js#L8-L28),
[timeout implementation](https://github.com/brianc/node-postgres/blob/df274d1ba9ad9d11a8f1079314faeafde7208207/packages/pg/lib/client.js#L702-L731)

A minimal safe acquisition shape deliberately waits for its bounded acquire to
settle. It needs no acquisition abort listener:

```text
check signal before acquisition
client = await pool.connect()         # keep this promise owned
if signal is now aborted:
    release the late client exactly once
    propagate cancellation
transfer ownership to the transaction scope
```

Configure a finite `connectionTimeoutMillis`; its queue timeout actually removes
the pending waiter. Cancellation may be reported after this acquisition boundary
rather than immediately. An immediate response-abort design needs a separate,
supervised cleanup promise that remains owned and is joined during drain. A bare
`Promise.race` cannot provide that ownership. [Pinned pool acquisition](https://github.com/brianc/node-postgres/blob/544b1ce8152bc280e398dc1e8a66920abe6a640e/packages/pg-pool/index.js#L190-L235)

For an acquired client, create one idempotent release/discard gate shared by the
abort handler and `finally`. Register the abort listener, immediately recheck
`signal.aborted`, and check cancellation before issuing SQL. An abort that
happened before listener registration does not replay its event. Remove the
listener on normal completion, failure, and cancellation; `{once: true}` alone
does not remove a listener when no abort occurs. Seven scratch ownership
assertions covered pre-abort, late acquisition, acquisition success/error,
already-aborted registration, normal listener disposal, and exact-once release.
These used a fake pool; database behavior was probed separately.
[AbortSignal API](https://nodejs.org/api/globals.html#class-abortsignal)

On active cancellation, documented `client.release(true)` can retire the lease.
It returns **void**, so awaiting that call is not a cleanup join. Keep awaiting
the owned query. If retirement completion is needed, subscribe before discard
to the pool's `remove` event for that exact client and clean up that listener.
The pinned pool emits removal from the connection-end callback. This subscription
shape is source-derived; the live probe observed removal and the backend's
absence rather than implementing a reusable retirement helper. Positive server
statement budgets bound SQL that continues after disconnect. Never hand the
client back merely because `query_timeout` settled.
[Pool API](https://node-postgres.com/apis/pool),
[removal implementation](https://github.com/brianc/node-postgres/blob/544b1ce8152bc280e398dc1e8a66920abe6a640e/packages/pg-pool/index.js#L172-L187)

## Python: preserve native cancellation through awaited contexts

Use an application-owned `AsyncConnectionPool`, await its readiness, and use one
checked-out connection per concurrent transaction. The tested shape used
`autocommit=True`, `async with pool.connection()`, and an explicit
`async with conn.transaction()`. After canceling an owned task, await that task
through context cleanup; preserve `CancelledError`. Do not detach cleanup behind
an unowned shielded task or translate cancellation into success.

In the pinned driver, cancellation of an active operation initiates cancellation
with a five-second allowance, then allows a further five seconds for its result.
The connection closes if it cannot finish. These internal allowances do not form
a complete end-to-end bound. The healthy local cleanup took 11 ms, but broken
cancellation channels and repeated cancellation during rollback were not tested.
[Cancellation implementation](https://github.com/psycopg/psycopg/blob/a67654d1e7afbf9b3a619557838f62de1c790e7c/psycopg/psycopg/connection_async.py#L516-L553)

Pool context exit returns the connection; pool reset rolls back open/failed
transactions and closes active or unresettable connections. Prefer this ownership
path over manual `getconn` without a corresponding `putconn`. `wait_for` can
exceed its requested timeout while cancellation finishes. Budget shutdown and
cleanup separately. [Pool ownership](https://github.com/psycopg/psycopg/blob/ab5646af17be1e90fb9b8a6a86ae17cfd2d10a22/psycopg_pool/psycopg_pool/pool_async.py#L206-L229),
[reset rules](https://github.com/psycopg/psycopg/blob/ab5646af17be1e90fb9b8a6a86ae17cfd2d10a22/psycopg_pool/psycopg_pool/pool_async.py#L871-L898),
[asyncio timeout semantics](https://docs.python.org/3/library/asyncio-task.html#asyncio.wait_for)

## Go: create the rollback budget when cleanup starts

`pgxpool.BeginTx` does not automatically roll back a returned transaction when
its context is canceled. Use the request context for acquisition and work, then
create a fresh bounded cleanup context **inside** deferred rollback. Call the
cleanup context's cancel function and retain the primary request error separately
from cleanup errors. A budget created at request entry may have expired before
cleanup begins. [BEGIN context scope](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/pgxpool/pool.go#L811-L837)

Do not first attempt rollback with the canceled context and then retry it with a
fresh one. The failed first rollback closes the transaction and kills the
connection; the pool wrapper still releases it. This is why a blanket “deferred
rollback with a canceled context leaks the connection” claim would be wrong for
this pin, although it needlessly loses a usable connection between commands.
[Transaction rollback](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/tx.go#L216-L234),
[pool transaction release](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/pgxpool/tx.go#L21-L44)

Default in-flight cancellation commonly retires the connection using socket
deadlines. Closed status can precede network cleanup; `CleanupDone` exposes the
completion boundary, with an internal 15-second allowance. Join owned goroutines
and account for driver cleanup. Separately, source inspection shows acquisition
cancellation can leave connection construction owned by the pool; the default
connection timeout is two minutes. That construction path was not fault-injected.
[Cleanup implementation](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/pgconn/pgconn.go#L768-L813),
[connection construction](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/pgxpool/pool.go#L277-L280),
[late-acquire ownership](https://github.com/jackc/puddle/blob/bd09d14bd4018b6d65a9d7770e2f3ddf8b00af1c/pool.go#L411-L468)

## Shared outcome and cleanup acceptance

Track `not-dispatched`, `transaction-active`, `commit-dispatched`, and
`commit-acknowledged` independently from cancellation. **Discarding a connection
after COMMIT dispatch leaves the business outcome unknown**, even when the socket
is closed. Acknowledged COMMIT is still committed if the caller then disconnects.
Native cancellation should retain its identity without silently discarding this
business-outcome information. For Python's implicit commit on transaction-context
exit, mark that boundary conservatively before exit; precise instrumentation
remains implementation work. Successful cancellation dispatch itself cannot
establish what the target command did. [PostgreSQL cancellation contract](https://www.postgresql.org/docs/current/libpq-cancel.html)

The earlier [storage probe](storage-probe-results.json) actually suppressed a
COMMIT acknowledgement and recovered the original receipt with one effect. It is
separate synchronous Python evidence, not equivalent native coverage in all
three languages. The final implementations must repeat that scenario using the
same trusted tenant, fixed namespace, original key, validated intent, and retained
ledger. Changed payloads, tenants, expired records, or external effects invalidate
a generic “same key means safe” claim.

Cleanup review must preserve late-acquire ownership, cancellation propagation,
listener disposal, exact-once release, transaction exits, fresh cleanup contexts,
owned task joins, and COMMIT phase tracking. Reject simplifications that replace
these with fire-and-forget work or unconditional release. Set positive SQL budgets;
converting an exhausted budget to zero would disable `statement_timeout`.
[Server timeout semantics](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-STATEMENT-TIMEOUT)

All owned application tasks were awaited. Final probe sessions and schemas were
zero; the owned container was stopped and its label-filtered inventory was empty.
No repository package files changed. This does not prove every cancellation race,
network failure, or production shutdown schedule; those remain explicit limits
in the machine-readable record.
