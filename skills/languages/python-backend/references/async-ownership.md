# Async ownership

Read this when work can outlive its caller or acquire a resource that must be released.

Assign each task an owner that awaits its completion. Use `TaskGroup` for related child work when supported; its failure and sibling-cancellation behavior must match the use case. A task reference or `create_task` call is not an ownership policy. A timeout requests cancellation and can take longer to return while cleanup finishes.

Acquire connections, cursors, locks, and asynchronous generators inside scopes that release them on success, error, and cancellation. Use `aclosing` when early exit from asynchronous iteration requires deterministic generator closure. One independent concurrent transaction needs its own connection or ORM session. Multiple cursors on one connection still share transaction state.

Let `CancelledError` propagate after awaited cleanup. If cancellation overlaps an irreversible effect or COMMIT, preserve the uncertain/committed business outcome separately; cancellation is not evidence of rollback. A shielded cleanup task still needs a lifetime owner and a completion join. Bound cleanup independently when the request budget has expired, preserve the original exception, and record secondary cleanup errors.

Pass cancellation only through APIs that support it. Blocking work moved to a thread does not acquire cooperative cancellation merely because its awaiter is canceled. Keep blocking driver calls off the event loop. Free-threaded builds and the GIL do not substitute for synchronization of a multi-step application invariant.

Verification: choose the relevant ownership boundaries—before resource acquisition completes, during work, and after an effect may have completed. Exercise reachable cases with explicit gates; identify any uncovered boundary. Await canceled work, then check effect state and resource recovery. With a pool of one, complete a fresh operation afterward. A momentary queued-waiter count is not a final leak verdict; inspect state after the held lease returns and owned cleanup completes.

Sources: [Python task cancellation](https://docs.python.org/3/library/asyncio-task.html#task-cancellation), [contextlib](https://docs.python.org/3/library/contextlib.html), [Psycopg concurrent operations](https://www.psycopg.org/psycopg3/docs/advanced/async.html), [free-threading guide](https://docs.python.org/3/howto/free-threading-python.html).
