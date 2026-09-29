# Storage review of messaging guarantees and PostgreSQL feasibility

Reviewed 2026-09-29. This is an independent review of
[messaging research](lanes/messaging.md) and its source records, plus an executed
storage experiment. It does not report a broker deployment or completed backend
example. The [backend contract review](backend-contract-review.md) remains the
more complete implementation proposal.

## Messaging review

The four principal articles were independently opened and their technical
narrative, examples, and caveats checked. Current documentation was read for the
specific guarantees below; entire documentation sites were not read. No material
contradiction was found in the lane's scoped recommendations. Preserve these
conditions when turning the research into runnable instructions:

| Article | Independent finding and implementation consequence |
| --- | --- |
| [Confluent, error handling patterns, 2021](https://www.confluent.io/blog/error-handling-patterns-in-kafka/) | The retry/redirect design preserves order for related messages by routing subsequent work behind the failed item and reconstructing routing state. It is a design sketch, not a complete atomicity/rebalance protocol. The lane correctly retains that limitation. Test a crash between each state publication and offset decision before using this sketch. |
| [RabbitMQ, at-least-once dead lettering, 2022](https://www.rabbitmq.com/blog/2022/03/29/at-least-once-dead-lettering) | The historical example targets RabbitMQ 3.10. Source retention lasts until all routed targets confirm. Target restart survival also depends on the target and original delivery mode; the example explicitly publishes persistent messages. Preserve the lane's distinction between safe transfer, possible duplicates, and backpressure. |
| [NATS, per-subject discard, 2022](https://nats.io/blog/new-per-subject-discard-policy/) | The example needs `DiscardNew`, per-subject rejection, and one retained message per subject. It demonstrates that deleting the retained entry permits the same identity again. Rejection is not a saved business response or payload-conflict check. The lane correctly rejects an unqualified infinite/end-to-end exactly-once promise. |
| [Temporal, automated versioning, 2026](https://temporal.io/blog/automated-worker-versioning-with-github-actions) | Pinned executions retain compatible worker capacity until they drain; traffic rollback does not move already pinned work. The lane correctly distinguishes this from recovery of bad pinned executions and from replay-safe auto-upgrade. The example automation was read, not executed. |

Concrete refinements for the implementation:

1. **Kafka isolation belongs in the acceptance criteria.** For the documented
   Kafka-to-Kafka transactional path, configure downstream reads appropriately
   (`read_committed`), disable automatic consumed-offset commits, and include the
   offset and outputs in the transaction. Otherwise aborted output can become
   visible. Test an abort followed by restart and a committed replay; do not
   extend this guarantee to an external database or email provider. These are
   Kafka 4.3 documentation checks, not installed-client validation.
   [Kafka transactional processing](https://kafka.apache.org/43/design/design/)
2. **A durable source does not establish a durable target.** Current RabbitMQ
   4.3 documentation preserves original message delivery mode during dead
   lettering. Check target durability/persistence as well as source quorum
   policy, all-target confirms, and overflow mode. A target restart after source
   deletion is a separate useful test from an unavailable target before transfer.
   [Quorum-queue dead lettering](https://www.rabbitmq.com/docs/quorum-queues)
3. **Keep the storage acknowledgement configuration-specific.** Current NATS
   stream API documentation includes `persist_mode=async`, which can acknowledge
   before storage. Do not describe every PubAck as proof of a disk flush. Check
   whether the deployed server supports this option and record its actual
   persistence, replication, and retention settings. A publish timeout still
   permits a successful write; retry identity must survive it. No NATS server was
   run for this review. [Stream API](https://docs.nats.io/reference/jetstream/api/stream/create),
   [publish outcomes](https://docs.nats.io/learn/jetstream/publishing)

Other checked claims were supported: publisher confirms and consumer
acknowledgements cover different links; non-transitive schema compatibility does
not cover every replay era; current Temporal Worker Versioning requires compatible
deployment and SDK/server versions. A worker version label does not independently
make a long external Activity's side effects repeat-safe.
[RabbitMQ acknowledgements](https://www.rabbitmq.com/docs/confirms),
[Schema Registry history](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html),
[Temporal versioning and Activity guidance](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning)

## Executed PostgreSQL experiment

The original scratch probe ran successfully at 07:52 UTC, using PostgreSQL 18.6
on an ARM64 Alpine container, Python 3.14.3, Psycopg 3.3.3, and libpq 18.0.
`fsync` and `synchronous_commit` were both `on`. The unique disposable container
bound only to loopback and used synthetic data. It has been stopped and removed;
the original script remains outside the repository for implementation work.
[Sanitized observations and execution metadata](storage-probe-results.json)

This experiment used an original three-table fixture: a scoped receipt ledger,
an effect table, and counters. It did **not** implement or execute the proposed
inventory-reservation example. Event barriers plus observed PostgreSQL lock waits
controlled the competing transactions; short deadline-bounded polling observed
state rather than guessing when a transaction had progressed.

| Executed schedule | Observed result |
| --- | --- |
| A holds an uncommitted receipt; B uses an insert-or-select CTE in one statement; A commits after B waits on the unique index | B returns no row. B's next separate statement sees A's receipt. |
| A holds a receipt and effect before commit; B submits the same scoped key | B waits; both receive the same receipt; one effect remains. |
| Reuse a committed key with changed command | Conflict is raised before a new effect. |
| Use the same textual key in a second tenant | Two independently scoped effects exist. |
| TCP proxy receives PostgreSQL `CommandComplete(COMMIT)` and suppresses it, then closes both sockets | Client receives `OperationalError` with no SQLSTATE; observer sees one committed effect. |
| Reconnect and retry that uncertain operation with its original key | Saved receipt is returned; effect count remains one. |
| Raise an exception before commit | Context cleanup rolls back both receipt and effect. |
| Two conflicting Repeatable Read transactions | Losing write returns `40001`; only the winning increment remains. |
| Cancel an actual sleeping server query before commit | Query returns `57014`; context cleanup leaves no receipt or effect. |
| Finish the probe | No remaining probe database sessions; proxy worker has stopped. |

The TCP test is stronger than throwing an exception at an application response
seam: it suppressed an actual PostgreSQL protocol message. It remains deliberate
local fault injection. It does not establish power-loss durability, recovery after
a database crash, replica failover, an RPO, external-effect atomicity, TLS proxy
behavior, pool cleanup, or TypeScript/Go driver behavior.

Execution evidence uses scratch-directory-relative commands so it contains no
local user paths or connection credentials:

```sh
./venv/bin/python probe.py > results.json
docker stop tal-storage-probe-20260929
docker ps -a --filter label=tal-skills.research=storage-commit-20260929 --format '{{.Names}}'
```

The probe command exited successfully and produced the recorded JSON. The last
command produced no container names. The exact script SHA-256 and image digest
are retained in the JSON. These are an execution record, not a runnable public
installation recipe: the scratch script uses its disposable instance's connection
settings and creates fresh tables, so rerunning it needs a fresh fixture.

## Minimum SQL/API contract supported by the experiment

Adopt the shared inventory proposal rather than add a competing public example.
The experiment supports its key mechanisms, not every proposed acceptance case:

- Use a unique `(trusted tenant, operation namespace, request key)` identity and
  compare validated intent on replay. Keep the business mutation and immutable
  receipt in the same local transaction, using one acquired connection.
- At Read Committed, arbitrate ownership with a scoped `INSERT ... ON CONFLICT
  DO NOTHING RETURNING`. Resolve a conflict using a **separate statement**. The
  executed empty-CTE result is consistent with PostgreSQL's documented snapshot
  rule; do not replace the two statements without testing the new protocol.
  [Read Committed conflict visibility](https://www.postgresql.org/docs/18/transaction-iso.html),
  [INSERT/RETURNING contract](https://www.postgresql.org/docs/18/sql-insert.html)
- Distinguish a confirmed transaction abort from missing commit acknowledgement.
  A selected `40001` retry reruns the complete decision transaction within a
  bounded budget. Unknown commit retains the original logical identity and
  reconciles through the same scoped protocol. An absent lookup while another
  attempt is in flight is not proof of abort.
  [PostgreSQL transaction retry](https://www.postgresql.org/docs/18/mvcc-serialization-failure-handling.html)
- Distinguish cancellation before commit, uncertain completion after COMMIT is
  sent, and cancellation after acknowledged commit. A dispatched cancellation
  cannot prove that work was undone. The returned error and durable state are
  the oracle, not successful delivery of the cancel request.
  [PostgreSQL cancellation](https://www.postgresql.org/docs/18/libpq-cancel.html)
- Retain receipts through the supported replay horizon; define no deletion in
  the small fixture. Preserve cancellation/cleanup ownership even on commit
  failure. Psycopg 3.3.3's source calls `commit()` before its context manager's
  later `close()`; a commit exception can skip that explicit close. Our broken
  socket happened to leave no server session, which is not proof for every
  failure or pool. Use explicit outer finalization and test it in each adapter.
  [Pinned Psycopg implementation](https://raw.githubusercontent.com/psycopg/psycopg/3.3.3/psycopg/psycopg/connection.py)

Before calling the examples equivalent, run the backend contract's complete suite
against the same PostgreSQL schema in all three languages. Minimum acceptance is
one durable effect for concurrent or uncertain duplicates, a conflict for changed
intent, independent tenant scope, preserved business invariants for different
keys, confirmed rollback before commit, same-key recovery after lost success, and
no stranded connection/task after native cancellation. Record each driver's
actual versions and cancellation mechanism. The Python scratch results are
feasibility evidence, not a substitute for those runs.
