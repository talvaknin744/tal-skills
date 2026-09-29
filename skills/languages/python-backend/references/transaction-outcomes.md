# Transaction outcomes

Read this when a Python operation changes database state or may be retried after an interrupted response.

Use one transaction owner for the writes that must commit together. A session context can close resources without defining the transaction semantics you need; inspect the actual API. Name the isolation level and the database authority enforcing each invariant. Use the database's uniqueness or conditional mutation at the conflict point rather than inferring safety from an earlier read.

Track at least: work not dispatched, transaction active, COMMIT possibly dispatched, and COMMIT acknowledged. Before COMMIT, stop business SQL and await rollback or retire the connection. After COMMIT dispatch, lost acknowledgement means the outcome is unknown until reconciled; closing the socket does not establish rollback. After acknowledgement, caller cancellation cannot undo the committed effect.

For retryable local operations, retain the original authenticated scope, stable operation identity, semantic request fields, and replayable result. Reject changed intent under an existing identity. The durable identity and effect must share a transaction where that is the chosen design. External payments and messages require their own protocols; a local transaction does not include them. A missing lookup result can mean an earlier attempt is still in flight.

Use one end-to-end deadline, including pool wait. Derive positive statement limits from its remaining budget; a PostgreSQL timeout of zero disables the timeout. Surface confirmed failures, native cancellation, and unknown outcomes distinctly. Retry only when the whole operation's contract establishes safety and the retry budget is explicit.

Verify on the target engine: concurrent duplicate requests, conflicting intent, a business-invariant race, interruption before commit, and a lost commit reply. Use controlled gates or observed database waits. Inspect committed state from a separate connection and show resource recovery. In-memory models cannot establish persistence or restart recovery.

Sources: [Architecture Patterns with Python, Chapter 6](https://www.cosmicpython.com/book/chapter_06_uow), [Chapter 7](https://www.cosmicpython.com/book/chapter_07_aggregate), [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [Psycopg transaction management](https://www.psycopg.org/psycopg3/docs/basic/transactions.html).
