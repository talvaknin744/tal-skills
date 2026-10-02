# Transaction outcomes and pgx cleanup

## Phase and ownership

Track request cancellation, durable outcome, and cleanup independently. At minimum preserve these phases:

| Phase | Meaning after interruption |
| --- | --- |
| Not dispatched | This attempt caused no effect; earlier uncertain attempts remain uncertain. |
| Transaction active, before COMMIT | Stop business SQL and finalize through acknowledged rollback or safe connection retirement. |
| COMMIT dispatched | Without a definitive server result, retain an unknown outcome even if local cancellation or connection closure succeeds. |
| COMMIT acknowledged | The effect remains committed after response cancellation or loss. |

Keep `context.Canceled` or `context.DeadlineExceeded` inspectable while retaining phase/outcome metadata in the project's error or result model. A cleanup error must not erase the primary error or turn an uncertain commit into a confirmed rollback.

Use one connection for one transaction; `pgx.Conn` is not safe for concurrent use. `pgxpool.BeginTx` returns a transaction whose Commit/Rollback releases its pool lease. If explicitly acquiring a connection and then beginning a transaction, the caller also owns release after finalization. Trace the chosen API to one release path rather than mixing ownership models.

## Fresh rollback budget

The context passed to `Begin`/`BeginTx` governs beginning the transaction; its later cancellation does not automatically roll back. Install explicit deferred finalization after successful begin. Create a fresh bounded cleanup context **inside the deferred rollback**, when cleanup starts, then invoke its cancel function. Creating this allowance at request entry can leave it expired before rollback begins.

Use a usable cleanup parent independent of the canceled request, with the project's shutdown/cleanup policy. Attempt rollback with this fresh context first. In the pinned pgx version, first attempting rollback with an already canceled context can close the transaction and retire the connection; retrying rollback with a fresh context cannot restore it. Treat `pgx.ErrTxClosed` after successful finalization as the documented already-closed state; surface other cleanup failures separately.

In-flight cancellation may already have retired the connection. A fresh rollback context helps only when the connection remains usable. Closed status can precede network cleanup; inspect `PgConn.CleanupDone` where the installed driver's retirement-completion boundary matters, and join owned application goroutines. Pool acquisition cancellation may leave connection construction owned by the pool; account for connect and shutdown budgets instead of equating caller return with all pool work stopping.

Derive statement limits from the remaining request allowance. PostgreSQL interprets a zero `statement_timeout` or `lock_timeout` as disabled; an exhausted budget must fail locally rather than truncate to zero. Bound pool waiting and cleanup separately from server statement time.

## Preserve the storage contract

Keep the established isolation level, operation identity, constraints, and result retention. For a retained local effect-and-receipt protocol, resolve uncertainty with the original trusted scope, operation namespace, key, and validated intent on a usable connection. A missing lookup row can mean an in-flight attempt; it does not by itself prove abort. External effects need their own explicit protocol.

If the contract uses PostgreSQL Read Committed `INSERT ... ON CONFLICT DO NOTHING RETURNING`, an empty result can lose to a row invisible to that statement's snapshot. Read the winner in a separate statement when the protocol requires a fresh snapshot. Combining both into one CTE can lose that property. Keep the SQL protocol's concurrency tests when refactoring language plumbing.

## Evidence for changed paths

Use a disposable real PostgreSQL instance, native context cancellation, and explicit transaction gates. For contention, observe the database lock wait with a bounded deadline; a gate requiring a blocked contender to pass the held lock deadlocks the test.

For affected paths, observe the effect count and stored result from a fresh connection, await cleanup, and prove a new request completes with a pool of one. Cover pre-COMMIT cancellation and post-commit response loss separately. Label suppression of application response delivery after real commit as **fault-injected response loss**; it does not establish a dropped PostgreSQL COMMIT packet. Add a transport fault only when that stronger claim is required.

The recorded probes and their untested boundaries are in [sources and limits](sources.md); they are not evidence that a new adapter passes these checks.
