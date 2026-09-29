# Messaging failure boundaries

Run deterministic ordering checks with Python 3.10+ and the standard library:

```sh
python3 examples/messaging/verify.py --report /tmp/tal-messaging-semantics.json
```

Opt into the real broker checks with a working Docker Engine and the pinned Python client:

```sh
python3 -m venv examples/messaging/.venv
examples/messaging/.venv/bin/python -m pip install -r examples/messaging/requirements.txt
examples/messaging/.venv/bin/python examples/messaging/verify.py --broker --report /tmp/tal-messaging-broker.json
```

Commands run from the repository root. The verifier prints JSON and exits nonzero for a failed assertion, unavailable requested capability, or failed cleanup. Run without Python's `-O` flag. Reports include source hashes, observed runtime versions, individual outcomes, and limits; the committed [verification.json](evidence/verification.json) is one observed run, not a guarantee for another machine.

The integration creates a uniquely named RabbitMQ container, binds AMQP to a dynamically assigned loopback port, and uses synthetic random credentials. It pulls the official `rabbitmq:4.3.0` image at digest `sha256:46bf0bdf0d2008acae9c5475558001e961297bd0868214c9216bef107d7d2b87`. The pulled image remains cached. The verifier removes its container, anonymous volumes, and temporary SQLite files in cleanup; it does not prune other resources. If the whole Python process is forcibly killed, automatic cleanup cannot run; identify the container by its `tal-skills.messaging-run` ownership label before removing that specific container with `docker rm --force --volumes <name>`.

## What the checks demonstrate

| Check | Observable contract |
| --- | --- |
| Reordered complete state | Revisions 3, 2, 3 leave revision 3. |
| Tombstone | Deletion at revision 4 rejects a later arrival of revision 3. |
| Missing delta | Quantity 10/revision 1 receives +5 at revision 3 before -3 at revision 2; it buffers, then reaches quantity 12 once. |
| Bounded gap | A full buffer rejects the incoming message before remembering it as accepted; an authoritative snapshot resolves the gap and permits retry. |
| Changed intent | Reusing an event/operation identity with different content is rejected. |
| Baseline-covered identity | An old delta whose effect is already covered still retains its identity, preventing changed-intent reuse at a new revision. |
| Consumer checkpoint | Later completion cannot advance past an unresolved delivered record; numerical gaps in broker offsets are allowed. |
| Commit before ACK | A real broker redelivers after disconnect; an atomic SQLite claim/effect transaction keeps one effect. |
| Independent duplicate | A republished operation arrives with `redelivered=false`; logical operation identity still suppresses its effect. |
| Rollback before disconnect | The broker redelivers and the new transaction completes once. |
| ACK before commit, negative control | The queue is empty while the effect remains absent: the unsafe order loses work. |

The state models represent one aggregate with one revision authority and a known bootstrap baseline. `None` represents a deletion tombstone in complete-state events. The delta model requires a complete, contiguous per-aggregate revision stream. Filtered events or global revision numbers need a predecessor/skip-proof protocol or authoritative reconciliation; this model cannot infer missing required changes from those numeric gaps. Deltas are required arithmetic changes; `reconcile` accepts a caller-verified authoritative complete snapshot. The small verifier supplies that snapshot explicitly. The model does not implement a durable gap store or scheduler: a real consumer must persist projection progress and retained gaps atomically, leave rejected work recoverable, and arrange a deadline/reconciliation path.

The broker example uses a durable **classic** queue, persistent messages, publisher confirms, and manual consumer acknowledgements. SQLite stores the operation claim and local effect in one transaction with WAL and `synchronous=FULL`. The fixture is single-tenant with one operation namespace and retains all receipts for its lifetime. A production key scope, authorization policy, receipt retention, and external-provider reconciliation require their own contracts.

## Boundaries of the evidence

The seven semantic checks run in one Python process. They do not prove multi-consumer atomicity or broker ordering. The five integration cases run on one local broker and SQLite file. Connection closure is graceful; the broker and host are not crashed or restarted. Durable settings are configuration, not an observed disk, HA, quorum, failover, or restart-survival guarantee. No dead-letter target, external side effect, retained-history expiry, or schema registry is exercised.

[cleanup-fault.json](evidence/cleanup-fault.json) records a separate review experiment: the temporary-directory context was made to raise before removing its files. The real broker cases still ran, its container was removed, and the report correctly kept `temporary_ledger_removed=false` with a failed overall status. The experiment then removed its retained directory. This injection is separate from the normal verifier command and does not count as another broker-delivery guarantee.

For actual acknowledgement and consumer-position contracts, use [RabbitMQ acknowledgements](https://www.rabbitmq.com/docs/confirms) and the [Kafka consumer API](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html). The accompanying `messaging-reliability` skill routes to versioned source records and additional failure scenarios.
