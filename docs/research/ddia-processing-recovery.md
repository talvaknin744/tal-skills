# DDIA: processing, recovery, and derived-state correctness

Research date: 2026-09-29. This note reads selected sections of the user-supplied DDIA mirror at commit [`157c2b303db17188dc4509c809552fd378e78b25`](https://github.com/YZXBiz/ddia/tree/157c2b303db17188dc4509c809552fd378e78b25/raw). These files identify themselves as **early-release drafts for the second edition**. They are not evidence that the final published edition has identical wording, examples, or chapter numbers. The mirror is a reading artifact supplied by the user, not the authority for current platform contracts. No book text or executable examples are bundled here.

## Reading scope and locators

The titles and line locators below refer to that exact mirror revision. The relevant sections were read for the user's 12–24 hour recovery and cross-service consistency examples; this note does not claim a complete reading of the book.

| Chapter | Sections examined closely | Main contribution |
| --- | --- | --- |
| [11: Batch Processing](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter11.md#L199-L343) | Distributed Job Orchestration; Scheduling Workflows; Handling Faults; Dataflow Engines | Distinguishes an entire logical computation from a retryable task. Durable intermediates, recomputation, and snapshots represent different recovery costs. |
| [12: Stream Processing](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter12.md#L205-L350) | Keeping Systems in Sync; Change Data Capture; Initial Snapshot; Concurrency Control | Independent dual writes can diverge without an error. A source change order can govern a derived view, while asynchronous propagation still permits stale reads. Snapshot bootstrap needs a corresponding log position. |
| [12: time and recovery](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter12.md#L462-L636) | Reasoning About Time; Stream Joins; Time-dependence of Joins; Fault Tolerance; Atomic Commit Revisited; Idempotence; Rebuilding State After a Failure | Reprocessing can change results when windows use processing time or enrichment consults mutable state. Restoring internal state does not retract effects already committed elsewhere. |
| [13: A Philosophy of Streaming Systems](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter13.md#L20-L130) | Reasoning About Dataflows; Derived Data versus Distributed Transactions; Limits of Total Ordering; Ordering Events to Capture Causality; Reprocessing Data for Application Evolution | Defines which representation is authoritative, how dependencies cross ordering domains, and how independently derived versions can support gradual migration. |
| [13: observable state and integrity](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter13.md#L279-L636) | Observing Derived State; End-to-End Argument for Databases; Timeliness and Integrity; Trust, but Verify; Designing for Auditability | Separates delayed observation from permanent corruption. End-to-end identities, reproducible derivations, and independent integrity checks address failures that component-level guarantees cannot eliminate. |

Local reading-file SHA-256 fingerprints:

- Chapter 11: `43f7e4bf8d20962627ba5011cc51a045e0a10c08eddfa23b4b7b2f30a35ed309`
- Chapter 12: `d067149bfeffdfc341709d44f0b1a5e3d912f2a01679d498546d08b4d8ec2445`
- Chapter 13: `14bea2113fbf4eaa78c57b0a8568b25a7c2f04ecd148a12de1f6427b7c14269b`

## Application to the repository

These are engineering recommendations from the reading and repository comparison, not quotations or automatic framework guarantees.

### Strengthen the checkpoint contract

The highest-value addition to [graceful-draining](../../skills/engineering/graceful-draining/SKILL.md) is **reproducible input**, within its existing durable-handoff reference. Its current contract already identifies a reproducible step, cursor, effects, schema compatibility, and ownership. Make the condition explicit: identify the immutable input manifest or snapshot, code/configuration version, and any lookup versions necessary to continue the same logical computation. A cursor into a mutable query result is insufficient when inserted, removed, or reordered rows can change what the cursor means.

For each mutable dependency, choose whether recovery must preserve the originally selected value or intentionally resolve a new value at a documented boundary. Either can be valid; silently switching makes “resumed successfully” ambiguous. Keep the required source history, checkpoint files, and effect evidence for the entire permitted recovery/redrive interval. A checkpoint that references unavailable input is not recoverable.

For pure transformations, bounded independent work units and an explicit publication decision can reduce how much computation must be repeated. That does not authorize deletion of outputs with externally visible effects. Identify what is staged, what is committed, and who can publish; test a crash at that boundary. These extensions fit the existing skill better than a separate generic “DDIA” skill.

### Separate convergence from freshness and repair

[Concurrency-correctness](../../skills/engineering/concurrency-correctness/SKILL.md) already distinguishes mutation invariants from reader freshness, rejects simplistic outbox guarantees, and covers revisions, deltas, tombstones, gaps, and stale owners. Its delayed-work branch could make **projection bootstrap and rebuild** explicit: establish a consistent snapshot/log boundary, replay the retained suffix, and verify deletes and gaps before making the new view eligible for reads.

A derived view can be internally correct yet too far behind for a dependent action. Conversely, a view with little measured lag can be permanently wrong because a dual write was lost or applied out of order. Review lag and integrity separately. For operations with dependencies across entities or streams, a per-entity revision is not proof that every required dependency has arrived. Record the dependency needed by the action, or consult an authority that can enforce the prerequisite before an irreversible effect.

Time-window and historical-enrichment work deserves a conditional test rather than mandatory streaming advice in every concurrency task: declare event-time versus processing-time behavior, late-event treatment, and which historical lookup version a replay must use. A rollout pause followed by rapid catch-up should not quietly change the intended business result.

### Preserve existing boundaries

- [Idempotency](../../skills/engineering/idempotency/SKILL.md) already owns stable logical operation identity, atomic local deduplication, outbox publication, unknown provider outcomes, and evidence retention. The reading reinforces that coverage; it does not justify copying it into a new skill.
- [Temporal reliability](../../skills/temporal/temporal-reliability/SKILL.md) already covers Activity effects, persisted heartbeat progress, duplicate protection across business lifetimes, and timeouts. Framework replay and external effect safety remain separate contracts.
- [Temporal safe deployments](../../skills/temporal/temporal-safe-deployments/SKILL.md) already carries configuration/schema versions, unfinished messages, and deduplication references through continuation. General job recovery should apply comparable input discipline without implying that Temporal replay rules apply to every batch engine.

## Current primary-source checks

Checked against official documentation on 2026-09-29. Verify the actual deployed version before recommending concrete settings.

1. **Kafka 4.3:** transactions can commit Kafka output records and consumed offsets together; transactional readers need `read_committed`. An external sink needs cooperation to coordinate its output with the consumed position. An aborted transaction also requires resetting application state and consumer position before reprocessing. These are bounded transaction semantics, not a guarantee for arbitrary HTTP effects. [Kafka design: delivery semantics and transactions](https://kafka.apache.org/43/design/design/).
2. **Kafka consumer recovery:** fetched position and committed restart position differ. Partitions define the ordering domain, and parallel application processing can change completion order. A checkpoint must not advance beyond unfinished earlier work merely because a later record completed. [KafkaConsumer API](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html), [partition ordering](https://kafka.apache.org/43/getting-started/introduction/).
3. **Flink stable documentation, identified as 2.3.0 during review:** recovery requires replayable input and durable checkpoint storage. Its state guarantee can involve replaying records. End-to-end guarantees additionally require appropriate transactional or idempotent sinks. [Checkpointing](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/checkpointing/), [fault tolerance](https://nightlies.apache.org/flink/flink-docs-stable/docs/learn-flink/fault_tolerance/).
4. **Flink planned migration:** stable operator identities help map restored state. Intermediate savepoints do not automatically become recovery points or commit side effects; coordinated stopping is a separate operation. Required state files, restore compatibility, and snapshot ownership matter. A generic instruction to “take a snapshot and restart” omits these contracts. [Savepoints](https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/savepoints/).

## Proposed verification scenarios

These are candidate regression cases, not checks executed by this research task. Use the workload's real storage/engine where its guarantees matter.

| Schedule | Observable acceptance condition |
| --- | --- |
| Pause after checkpoint; mutate input membership/order or a referenced lookup; resume on another binary | Continue against the promised input/version, explicitly migrate, or reject incompatibility; do not silently skip or recompute a different business result. |
| Commit output; crash before saving cursor; resume twice | Repeated computation preserves the intended visible output/effect count; unresolved provider outcomes remain discoverable. |
| Finish later partition work before earlier work; stop the consumer | Committed progress leaves no unfinished earlier input permanently skipped. |
| Bootstrap a projection while an update and deletion cross its snapshot/log boundary | The rebuilt view contains the correct live records and deletions exactly under its declared semantics. |
| Delay events during deployment; replay quickly after recovery | Window membership and enrichment match the chosen time/version policy; late events produce the documented correction or rejection. |
| Corrupt one derived record while consumer lag stays low | An independent integrity comparison detects divergence; ordinary lag monitoring alone is not reported as validation. |

The immediate improvements are small additions to existing checkpoint and delayed-work references plus focused cases. A separate data-pipeline recovery skill becomes justified only when bootstrap, backfill, temporal joins, and output publication form a repeated task of their own.
