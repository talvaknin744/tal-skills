# DDIA: faults, ownership, and consistency

Reviewed 2026-09-29. The user supplied the [YZXBiz DDIA mirror](https://github.com/YZXBiz/ddia/tree/157c2b303db17188dc4509c809552fd378e78b25/raw). Its chapter files explicitly identify themselves as an **early-release draft**, with chapter numbers intended for the second edition. This review read the complete substantive text of chapters 9 and 10, through their conclusions; bibliographies were used as pointers, not independently verified in full. It does not establish that the mirror matches the final edition or that the whole book was read.

The local reading copies remain outside this repository. This note contains original synthesis and engineering counterexamples, not copied chapters or book code.

## Reading record

| Source | Text read | SHA-256 of supplied text |
| --- | --- | --- |
| [Chapter 9: The Trouble with Distributed Systems](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter9.md) | Lines 1–677, including networks, clocks, pauses, fencing, system models, and verification | `36bf5ca982c6c1cff7989d9a2b17c0830b7087638db318ac4354e7db538b0a26` |
| [Chapter 10: Consistency and Consensus](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter10.md) | Lines 1–686, including linearizability, ID generators, consensus, and coordination | `e961a7ca0b858dcf28dca3d09a2cbc049b6c540c317cdd45ca07fee24668d74a` |

## What the draft contributes

| Locator in the pinned text | Relevant distinction | Skill implication |
| --- | --- | --- |
| Chapter 9, [“The Limitations of TCP,” line 64](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter9.md#L64), and “Timeouts and Unbounded Delays,” line 123 | Delivery, application completion, and observed completion differ. | An absent response cannot justify spending a fresh effect identity. |
| Chapter 9, [“Monotonic Versus Time-of-Day Clocks,” line 226](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter9.md#L226) | Elapsed duration and cross-host timestamps have different clock requirements. | Specify the time authority for each drain, lease, and persisted job deadline. |
| Chapter 9, [“Fencing off zombies and delayed requests,” line 455](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter9.md#L455) | Requests can outlive their original sender. | Killing the old worker does not remove requests already in flight. |
| Chapter 9, [“Safety and liveness,” line 573](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter9.md#L573) | Preventing corruption and eventually making progress are separate obligations. | Require both effect/ownership protection and visible stalled-job recovery. |
| Chapter 10, [“Linearizability Versus Serializability,” line 108](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter10.md#L108) | Transaction isolation does not by itself specify real-time recency. | Check the requested consistency and isolation contracts separately. |
| Chapter 10, [“Cross-channel timing dependencies,” line 147](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter10.md#L147) | A notification can outrun visibility through a second channel. | Carry the committed revision into dependent reads. |
| Chapter 10, [“ID Generators and Logical Clocks,” line 256](https://github.com/YZXBiz/ddia/blob/157c2b303db17188dc4509c809552fd378e78b25/raw/chapter10.md#L256) | Uniqueness, sortable timestamps, causality, and real-time ordering differ. | Verify the generator's contract before using an ID as an ownership epoch. |

## Gaps versus existing coverage

The reviewed `graceful-draining`, `concurrency-correctness`, and `idempotency` packs already require durable checkpoints, stable effect identity, target-enforced fencing, full-transaction retries, revision-aware reads, bounded failure, and tests that force dangerous interleavings. These findings support those instructions; they do not justify another broad distributed-systems skill.

Three small reference additions would materially improve agent behavior:

1. **Make deadline clock domains explicit.** Measure a process-local drain allowance with the runtime's monotonic elapsed-time API. Represent a durable job deadline using the application's documented shared time authority and uncertainty policy. A raw monotonic value is not a portable timestamp to restore on another host. Python's current documentation confirms that monotonic readings have an undefined reference point and support differences between readings; actual platform suspend behavior still needs checking. [Python time API](https://docs.python.org/3/library/time.html#time.monotonic)
2. **Name the isolation/recency split.** A serializable transaction contract alone does not require real-time transaction ordering; a linearizable operation on one object alone does not protect a multi-row decision. Verify strict serializability or the datastore's equivalent only when the application needs both. Spanner's documentation explicitly distinguishes external consistency from serializability and linearizability. This is a semantics check, not a recommendation to replace the database. [Spanner's consistency guarantees](https://docs.cloud.google.com/spanner/docs/true-time-external-consistency)
3. **Validate ownership-token ordering.** A time-sortable identifier is not automatically an epoch allocated in authoritative claim order. UUIDv7 contains a wall-clock timestamp and optional within-timestamp ordering mechanisms; the format alone supplies no global ownership order. Preserve the allocator's ordering and durability across the failovers that the application supports. [RFC 9562, sections 5.7 and 6.2](https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7)

The current delayed-work reference already correctly limits fencing to what the target has accepted. Keep that nuance: if a target rejects tokens below its highest accepted token, obtaining a new token elsewhere has not yet advanced that target. A handoff requiring an immediate boundary must establish it at every protected target before relying on the stronger claim. A delayed old request remains relevant even after the old pod has definitely exited.

## Counterexamples for evaluations

These schedules are original applications of the preceding distinctions, not examples copied from the book.

- **The clock-adjusted drain:** A worker starts a 40-second drain using wall time. After 20 elapsed seconds its clock steps back two minutes. Its loop now believes it has ample time, while the platform still terminates it on schedule. The check should preserve the elapsed budget; a separate test restores a durable job on a host whose monotonic origin differs. Neither test should reinterpret a new worker's uptime as the original job's age.
- **The ordered-looking token:** A replacement worker receives a token generated from a clock behind its predecessor's clock. String comparison treats the replacement as older, although its ownership claim completed later. Assert that the real allocation protocol supplies the required order, rather than substituting a different timestamp format in the test.
- **The isolated but stale decision:** Service A acknowledges a permissions update. Service B later reads an older, internally consistent snapshot and authorizes an action. A test must check the required dependency or real-time freshness contract, not merely the absence of a serialization error.
- **The request after shutdown:** A sends an unconditional write, which is delayed. A exits; B acquires ownership and writes new state; A's request then reaches the target. Assert rejection at the protected mutation boundary. A process-exit assertion or a pre-send ownership lookup would miss this execution.

These are proposed tests, not executed validation results. Existing barrier-controlled fixtures remain useful, but a modeled datastore cannot prove a real datastore's isolation or failover behavior.

## Current-document boundaries

Book concepts guide the questions; product documentation supplies the actual guarantees. For example, etcd v3.6 documents default KV ordering, a stale-read option named `serializable`, separate watch guarantees, and uncertain client outcomes after a timeout. A watch-fed local ownership view therefore needs revision validation; it does not automatically inherit the KV API's default contract. [etcd API guarantees](https://etcd.io/docs/v3.6/learning/api_guarantees/)

Do not promote draft product examples into current universal rules. Verify the deployed version, read mode, failover policy, token allocator, and protected resource. The supplied mirror's draft status and missing figures also mean this text review establishes conceptual coverage, not an authoritative reproduction of the final book.
