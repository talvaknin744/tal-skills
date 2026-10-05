# DDIA replication and transactions: targeted reading

Research date: 2026-09-29. This note records a full prose reading of Chapters 6 and 8 in the user-supplied DDIA mirror and compares their relevant lessons with the draft `concurrency-correctness` skill. Recommendations and test histories below are original synthesis. They are proposals, not evidence that the proposed checks have run.

## Source identity and coverage

The source is the user-supplied [YZXBiz/ddia mirror](https://github.com/YZXBiz/ddia/tree/157c2b303db17188dc4509c809552fd378e78b25/raw), pinned to commit `157c2b303db17188dc4509c809552fd378e78b25`. Both chapters identify themselves as **early-release second-edition drafts**. The mirror's authenticity and correspondence with the final published edition have not been established. Treat its prose as research material; validate implementation claims against the product documentation.

| File | Reading coverage | SHA-256 of retrieved file |
| --- | --- | --- |
| [Chapter 6: Replication](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter6.md#L2) | Main prose through the summary, lines 2–746; bibliography not independently verified | `491e4509a25e43e272e6c2d5548555c48538316a9334427501cd2e07e9488574` |
| [Chapter 8: Transactions](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter8.md#L2) | Main prose through the summary, lines 2–1049; bibliography not independently verified | `090f475ccaba9853aa00e4030cb75ef2be301b1ee7a2885973739e68a5faf754` |

The source files contain plaintext section labels rather than Markdown headings. Line anchors identify the pinned passages more reliably than guessed heading anchors. No chapter text or figures are redistributed here.

## Reading findings

**Replication:** reader guarantees differ: seeing one's own write, avoiding regression after an earlier read, and preserving causal dependencies solve different failures. Independent writers also require a conflict policy; convergence alone does not preserve every accepted update. A scalar version is meaningful only within its ordering domain. Quorum arithmetic alone is not a complete consistency proof. Relevant locators: [Reading Your Own Writes](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter6.md#L214), [Monotonic Reads](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter6.md#L246), [Consistent Prefix Reads](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter6.md#L257), [Conflicting Writes](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter6.md#L399), [Quorum Limitations](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter6.md#L552), and [Version Vectors](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter6.md#L686).

**Transactions:** protection must cover the decision's full read/write set. A consistent snapshot supports coherent observation but need not prevent write skew. Aborted and ambiguously completed transactions require different recovery. Distributed atomicity covers only participating effects; keeping a transaction open across a long business process has operational costs. Relevant locators: [Errors and Aborts](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter8.md#L190), [Snapshot Isolation](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter8.md#L275), [Lost Updates](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter8.md#L357), [Write Skew and Phantoms](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter8.md#L436), [Interactive Transactions](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter8.md#L570), and [Distributed Transactions](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter8.md#L774).

These lessons support focused refinements to the existing skill. They do not justify creating one skill per chapter.

## Prioritized gaps against the skill

### 1. Make lock timing and snapshot timing explicit

The transaction reference already names shared lock targets, absent-row predicates, write skew, and whole-transaction retries. Its `postgres-write-skew` evaluation already expects a guard-row solution to avoid a stale Repeatable Read snapshot. The instructions should teach that expectation explicitly.

PostgreSQL 18 warns that a Repeatable Read snapshot established before a lock can exclude changes committed before the lock was acquired. Waiting for a lock does not refresh that snapshot. A row lock also protects only returned rows. **Recommended refinement:** verify both the synchronization protocol and the visibility of the decision read; for a cooperating guard-row protocol, Read Committed with the decision after lock acquisition is one candidate. A suitably scoped constraint or Serializable transaction is another. Do not advertise merely adding a lock as sufficient. [PostgreSQL application-level consistency, §13.4.2](https://www.postgresql.org/docs/18/applevel-consistency.html#NON-SERIALIZABLE-CONSISTENCY).

**Extend the existing evaluation rather than duplicate it:** A locks an unchanged ward guard row. B begins Repeatable Read and performs an unrelated query, fixing its snapshot. B waits on the guard. A changes a staff row and commits. B acquires the guard and counts staff against its earlier snapshot. The review must explain why mutual exclusion of the decision code did not provide a fresh decision input. A real PostgreSQL check is needed to validate any SQL repair.

### 2. Preserve progress from reads as well as writes

The replica reference carries an acknowledged write dependency, but does not explicitly cover a reader that has never written. Add a monotonic-read branch: preserve the reader's observed progress within a defined consistency domain, including rerouting after a replica failure. MongoDB documents monotonic reads separately from read-own-writes and ties causal guarantees to sessions and concern settings; a generic connection pin is not equivalent. [MongoDB causal guarantees](https://www.mongodb.com/docs/manual/core/causal-consistency-read-write-concerns/).

**New evaluation candidate:** service A returns document revision 18 from replica R1. R1 fails. The next request reaches service B, whose cache and R2 contain revision 16. This caller made no write. Require revision 18 or later, or the specified bounded pending/failure behavior. The fixture should also require a fresh unrelated session to retain its deliberately weaker contract. An entity revision must not be presented as an ordering token for unrelated entities.

### 3. Distinguish a confirmed abort from an unknown commit

The transaction reference already retries a complete serialization failure and keeps external effects out of freely retried bodies. Add the adjacent branch: transport loss around COMMIT is not itself evidence of rollback. PostgreSQL documents that a cancellation may arrive too late, and that a command outside an explicit transaction can commit before a disconnect is noticed. [PostgreSQL message flow, §§54.2.8–54.2.9](https://www.postgresql.org/docs/18/protocol-flow.html#PROTOCOL-FLOW-CANCELING-REQUESTS).

**Recommended refinement:** classify a known abort separately from an unknown outcome. For uncertainty, retain logical operation identity and establish the committed outcome or use a repeat-safe mutation. A negative read from a lagging replica is insufficient proof that the first attempt failed. Keep the detailed retention and duplicate-effect design in the existing `idempotency` skill.

**New evaluation candidate:** a transfer and its operation record commit; the response is dropped. A reconnecting client queries a lagging replica, sees no operation record, and tries again. Acceptable recovery must prevent a second transfer and explain why the absent replica result cannot establish failure. Contrast this with a returned serialization-abort error, where the complete transaction is rerun using fresh decision reads. [PostgreSQL serialization failure handling](https://www.postgresql.org/docs/18/mvcc-serialization-failure-handling.html).

### 4. Define the input view of a resumable job

The drain reference records input/checkpoint schemas and committed positions. Add the identity or rule defining the source view: immutable dataset version, supported snapshot, bounded cutoff with stable ordering, or explicitly live semantics. A cursor is not by itself a coherent snapshot. PostgreSQL Read Committed uses a new snapshot for each ordinary statement; Repeatable Read supplies a transaction snapshot, with different lifetime and recovery implications. [PostgreSQL isolation, §§13.2.1–13.2.2](https://www.postgresql.org/docs/18/transaction-iso.html).

**Original evaluation candidate:** an export orders records by mutable `updated_at`. After one page commits, a processed record moves ahead of the cursor and an unprocessed record moves behind it. Restart from the stored cursor. Require either the defined stable dataset result or explicitly permitted live semantics, accounting for duplicates and omissions. Fencing the worker and saving its cursor are necessary ownership/progress measures but do not settle this input contract. Keep database transactions short where possible; do not turn a 24-hour job into a 24-hour write transaction as a default repair.

### 5. Verify the scope of conditional writes in multi-region designs

The skill already requires an authority and consistency domain. A short concrete example would help prevent applying single-region CAS reasoning to independent writers. Current DynamoDB MREC global tables evaluate conditions regionally and reconcile concurrent updates with last-writer-wins. MRSC evaluates conditions against the latest item and has different capabilities; its documentation currently excludes transaction operations. MREC transaction writes are atomic only in their originating region. Thus, inspect the actual consistency mode and operation before selecting a repair. [DynamoDB global table modes and transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html).

**Optional evaluation candidate:** two regions read version 7 and each successfully perform a regional conditional write to version 8. The contract requires preserving both accepted changes. Identify that two locally successful CAS operations do not establish a global order under the supplied topology. Require an explicit coordination, ownership, or merge policy and its availability tradeoff. Avoid creating a general CRDT manual inside this skill.

## Draft statements that need qualification

The draft's [Exactly-once message processing revisited](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter8.md#L940) removes the processed-message record after successful acknowledgement. That step depends on the broker and replay contract. Amazon SQS Standard explicitly permits a message to reappear after successful deletion. Preserve deduplication evidence for the actual duplicate/replay horizon; immediate deletion is not a portable rule. [SQS DeleteMessage](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_DeleteMessage.html).

Similarly, use live product semantics over edition-level lists of isolation implementations or replication features. PostgreSQL Serializable uses dependency detection rather than ordinary blocking predicate locks; an exclusion constraint can reject overlapping reservations, whereas uniqueness of identical interval endpoints would not. [PostgreSQL Serializable isolation](https://www.postgresql.org/docs/18/transaction-iso.html#XACT-SERIALIZABLE), [range constraints](https://www.postgresql.org/docs/18/rangetypes.html#RANGETYPES-CONSTRAINT).

## Integration recommendation

Refine `transactions.md` for snapshot/lock interaction and ambiguous commit recovery, `replica-reads.md` for monotonic observations and topology-specific scope, and `durable-handoff.md` for input-view identity. Keep the common skill workflow compact. The existing suite already covers lost updates, write skew, cache-fill ordering, and read-your-writes; prioritize the distinct monotonic-reader and moving-input histories if adding further behavioral coverage.

This note reviewed documentation and fixture definitions. It did not execute a database, broker, multi-region deployment, or the proposed schedules.
