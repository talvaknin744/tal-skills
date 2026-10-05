# Local RabbitMQ acknowledgement probe

Observed on 2026-09-29 at 08:37:32 UTC. An actual local RabbitMQ broker redelivered an unacknowledged message after its consumer disconnected. An atomic SQLite operation claim suppressed the second database effect. A negative control reproduced lost work when acknowledgement preceded the database commit.

This was a bounded research experiment, not a reusable backend implementation. Machine-readable evidence is in [messaging-feasibility.json](messaging-feasibility.json).

## Pinned environment

| Component | Observed value |
| --- | --- |
| Official image | `docker.io/library/rabbitmq:4.3.0` |
| Pulled repository digest | `sha256:46bf0bdf0d2008acae9c5475558001e961297bd0868214c9216bef107d7d2b87` |
| Local platform image ID | `sha256:b0a71b73f29fb2195129a03c78c846801bebf2095e9e814656aa42fad1873247` |
| Broker / Erlang | RabbitMQ 4.3.0 / Erlang/OTP 27.3.4.11 |
| Platform | Linux arm64 container; Docker Engine 29.8.0 |
| Client | Pika 1.3.2, Python 3.14.3 |
| Database | SQLite 3.53.2, WAL, `synchronous=FULL` |

The broker listened only on `127.0.0.1:56729`, using disposable synthetic credentials. The queue was a durable **classic** queue; messages requested persistence and publishers waited for confirms. Consumers acknowledged manually. Each database mutation inserted a stable operation ID and its effect within one transaction. Duplicate IDs skipped the effect. Broker delivery tags were never used as operation IDs.

## Observed scenarios

| Scenario | Fault and observation | Result |
| --- | --- | --- |
| Commit before acknowledgement | Commit the operation claim and effect; close the AMQP connection without ACK. Reconnect and receive the same message with `redelivered=true`. | The second claim inserted no row; effect count remained one. ACK left the queue empty. |
| Independently republished duplicate | Publish the same application operation ID again. This new broker publication arrived with `redelivered=false`. | The durable application claim still suppressed the second effect. |
| Rollback before disconnect | Insert the operation claim and effect, roll back, then disconnect without ACK. | The message was redelivered and committed successfully; final effect count was one. |
| Unsafe ordering control | ACK, perform a synchronous queue-declare round trip, and disconnect before applying the database effect. | Reconnection found no queued message and zero effect. The work was lost to this consumer. |

The synchronous round trip in the negative control matters: it ensures the broker processed the preceding ACK before the consumer disconnected. Database observations used freshly opened SQLite connections. Assertions checked the logical identity, `redelivered` flag, affected-row count, effect count, and queue emptiness.

## Practice supported by this probe

- **Trigger:** a broker consumer changes transactional local state and can receive duplicate attempts.
- **Failure:** ACK before commit can lose work; commit before ACK can repeat attempts.
- **Mechanism:** claim the stable operation ID and apply its local effect atomically, then ACK. Repeated attempts inspect or reuse the existing outcome.
- **Applicability:** claim and effect share a transactional database boundary. Keep identity across republication, and retain the claim for the permitted replay horizon.
- **Counterexample:** an external payment or email does not become atomic with the local ledger. Preserve the external operation identity and reconcile uncertain outcomes separately.
- **Verification:** retain both safe-order tests and the unsafe-order negative control; add external-outcome and crash/failover scenarios when those guarantees are part of the contract.

RabbitMQ documents publisher confirms and consumer acknowledgements as separate mechanisms. This experiment exercises both, with the database commit explicitly placed between delivery and consumer acknowledgement. See the [official acknowledgement documentation](https://www.rabbitmq.com/docs/confirms).

## Limits and cleanup

This was one broker and one local database file. The disconnect was a graceful AMQP connection close, not process death or a network partition. Neither the broker nor laptop was restarted. Durable queue/message settings therefore describe configuration, not an observed disk, restart, quorum, failover, or availability guarantee. No external side effect, inbox expiration, schema evolution, ordering, parallel consumer, prefetch bound, or dead-letter target persistence was tested. [Quorum queue and dead-letter guarantees](https://www.rabbitmq.com/docs/quorum-queues) require separate configuration and experiments.

The queue was deleted. The owned container and its anonymous volumes were removed, and the absence of the container was checked. The pulled image was retained; no global pruning occurred.

Raw local evidence is retained under `/tmp/tal-messaging-research-20260929`: `probe.py`, `results.json`, `probe-output.log`, `broker.log`, image/runtime inspection records, and the SQLite ledger. These temporary paths are research artifacts, not installable dependencies. Script SHA-256: `16834044acb2a62caf91a597877c669b26fe7c324f04e17fc619061f650b1650`.

The implementation phase should turn these four semantic cases into an optional, explicitly invoked broker integration test, while keeping the default examples runnable without Docker. It should describe local transactional duplicate suppression precisely, without naming it a universal exactly-once guarantee.
