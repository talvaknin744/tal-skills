# Asynchronous ownership

Use this reference when requests own promises, pool leases, transactions, streams, or cancellation handlers.

For each resource, identify who creates it, who can request cancellation, and who awaits completion. A request that stops waiting still needs an owner for the work it started. Preserve that owner through errors and handoffs.

## Cancellation and deadlines

Pass an `AbortSignal` only to APIs that document support. Check already-aborted signals before starting work. When registering a listener, recheck `signal.aborted`; remove the listener on normal completion as well as cancellation. Share an exact-once cleanup gate between the listener and `finally`.

Derive positive operation budgets from one remaining request deadline. A request timeout may expire before cleanup finishes. Reserve cleanup capacity during draining, retain cleanup promises, and join them before claiming the operation stopped. An uncaught rejection or an unowned `Promise.race` loser is unfinished work, not completed cancellation.

Counterexample: `Promise.race([pool.connect(), aborted])` rejects on abort while the acquisition remains queued. When it later succeeds, its client still needs release. A minimal safe adapter awaits the bounded acquisition, checks the signal again, releases a late client, and only then propagates cancellation. Immediate response cancellation instead requires a supervised owner for that cleanup.

## PostgreSQL with node-postgres

These facts were checked against `pg` 8.23.0 and `pg-pool` 3.14.0. Verify the installed version before copying their mechanics.

- Run a transaction on one checked-out client. Arbitration, business mutation, and retained receipt must share the transaction when claiming atomic repeat safety.
- This `pg` query API ignores a supplied `signal`. In default nonpipeline mode, `query_timeout` can return while the server query continues and commits. Use a server statement budget and an explicit cancellation/retirement adapter; do not release a still-active client for another borrower.
- `connectionTimeoutMillis` bounds queued acquisition. Zero is unbounded. A timed-out later attempt says nothing about an earlier uncertain attempt.
- A checked-out client also emits connection `error` events. The pool idle listener is removed during checkout: retain a lease-owned error listener until settlement/retirement, then remove it before safe idle release. A real lost-COMMIT reply exposed this boundary even with the query rejection awaited.
- `client.release(true)` discards a lease and returns void. Awaiting it does not join cleanup. Keep the query owned; if observing retirement, register the pool's `remove` listener for that client before discarding and dispose the listener after settlement.
- Bound graceful transport retirement too. An idle driver connection can send FIN while a half-open peer withholds completion. If the driver has no bounded forced-close API, retain ownership of its supplied socket, schedule force-close after the cleanup allowance, and still await retirement. A zero pool count alone does not prove transport cleanup.
- Track pre-dispatch, transaction-active, COMMIT-dispatched, and acknowledged-COMMIT phases. Discard after COMMIT dispatch cannot prove rollback. Reconcile an uncertain result with the same retained scoped identity and intent.

A positive PostgreSQL `statement_timeout` limits one server statement; zero disables it. An exhausted remaining request budget must fail locally instead of being rounded to zero. Server timeouts do not include pool waiting.

Connection retirement is a resource policy, not business-effect cancellation. For an operation outside a local transaction, the server may have committed before cancellation arrived. External providers need their own stable effect identity and reconciliation contract.

Completion evidence: duplicate and conflicting intents, cancellation during real blocked work, canceled acquisition, late resource cleanup, unknown COMMIT recovery, and a fresh request through a small pool. Observe actual lock waits; guessed delays do not establish the schedule. Keep unit checks for listener/ownership races and integration checks for driver/database behavior.
