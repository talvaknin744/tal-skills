# Discord message-storage research

The accepted placement extends existing operational-capacity and migration
references, including a narrow coalescing correctness boundary in capacity.
No new skill, agent, or category was created. This lane changed reference
documentation only; it executed no runtime, infrastructure or model evaluation.

Bo Ingram's [How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages)
(Discord, 2023-03-06) was read through its complete accessible main text. The
article describes hot-partition pressure, request coalescing with channel-based
routing, a checkpointed migration, tombstone-heavy ranges blocking completion,
and comparison reads before cutover. Its historical performance results are not
portable guarantees. Embedded schema/diagram/graph images were not independently
inspected. The exact URL had no prior research record; Discord was previously
surveyed for a different Go-to-Rust article. Count **one new deep article**, not
a new publisher. Details are in the [source record](discord-message-storage.json).

## Proposed improvements

**1. Diagnose skew and contain work at the resource that saturates.** Existing
`microservice-operations/references/capacity.md` already covers hot keys, shared
limits, and representative load. The useful refinement is to separate request
rate and concurrent work from partition size, then test one busy key alongside
unrelated traffic. Measure the specific partition/shard owners and queueing
costs; adding frontend replicas can multiply origin work without increasing that
partition's capacity.

Consider coalescing overlapping equivalent reads, per-key admission, and an
aggregate origin budget according to the measured bottleneck. Bound waiting
callers and the number of tracked keys as well as active database calls. These
are proposed engineering controls, not a claim that Discord published a complete
per-key limiter. A high-cardinality workload can defeat coalescing; a single
global queue can let one key delay unrelated traffic. Routing affinity improves
local sharing but must survive owner changes without assuming a distributed
single execution guarantee.

Current [ScyllaDB partition diagnostics](https://docs.scylladb.com/manual/stable/troubleshooting/large-partition-table.html)
are node-local and examine per-SSTable partition data. Version 2026.2 introduced
feature-gated metadata-backed tables whose older SSTables may have no recorded
entries. Thus an empty diagnostic table is not evidence of balanced request
traffic or absence of large logical partitions. Keep this product detail
conditional rather than turning it into a general database instruction.

**2. Treat shared reads as a semantic boundary.** The main new correctness case
is a post-write caller joining a read that began before its acknowledged write.
For example, A starts reading revision 7; B commits revision 8; B's required
read-after-write attaches to A and receives 7. Coalescing has reduced work while
violating the reader's contract.

A safe sharing decision accounts for tenant, query arguments, visibility,
consistency mode, and required revision, or validates authorization/freshness for
each waiter before delivery. Cancellation policy must distinguish abandoning one
waiter from stopping shared origin work. Test first-waiter cancellation, all
waiters leaving, origin error, and cleanup. This is a proposed application
analysis; the Discord article does not specify those contracts.

The official Go [singleflight API](https://pkg.go.dev/golang.org/x/sync@v0.23.0/singleflight)
only suppresses concurrent function calls in a `Group` for a matching key. Its
[`Forget` behavior and implementation](https://github.com/golang/sync/blob/v0.23.0/singleflight/singleflight.go)
allow another call while an earlier one remains in flight. It supplies no cache
freshness, authorization, cross-process uniqueness, or request cancellation
policy. This is a concrete API limit, not a recommendation to change languages.
[Tokio's semaphore](https://docs.rs/tokio/1.53.1/tokio/sync/struct.Semaphore.html)
similarly bounds permit holders, while admission placement and waiter bounds
remain application concerns; its fair queue can have head-of-line blocking when
large multi-permit acquisitions lead the queue.

**3. Prove complete migration coverage and preserved semantics.** Existing
infrastructure rollout and microservice extraction references already require
compatible generations, recoverable copy/catch-up, partial-dual-write handling,
and business comparisons. Add only the missing concrete check: enumerate the
copy ranges, retain unresolved failures, and verify the cold/deleted/TTL-heavy
tail independently of popular sampled reads. Completion percentages and row
counts cannot alone establish correctness.

Define the source position or comparison window, concurrent-write reconciliation,
delete/expiry semantics, and source-of-truth switch. Compare payload and relevant
ordering/expiry metadata under explicit tolerances. The current
[ScyllaDB Migrator validator](https://migrator.docs.scylladb.com/stable/validate.html)
supports write-time and TTL comparison. Its instruction to stop writes on both
sides specifically concerns MySQL-to-ScyllaDB validation; it is not a universal
Cassandra requirement. A live sequential comparison is not automatically one
consistent snapshot.

Tombstone pressure needs engine-specific diagnosis. Current
[Cassandra documentation](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/tombstones.html)
ties deletion safety to grace, older data, compaction and replica repair. Preserve
that deletion evidence: lowering retention or forcing compaction merely to clear
a migration tail can trade latency for resurrected data. No maintenance command
is recommended without the deployed engine's safety and capacity evidence.

## Placement and scope

| Existing skill/reference | Recommendation |
|---|---|
| `microservice-operations/references/capacity.md` | Primary home: skew diagnosis, scoped coalescing, bounded waiters/key count, cold-cache and routing-change load. Keep bulkhead basics in their existing reference. |
| `concurrency-correctness/references/cache-coherence.md` | Existing freshness protocol remains authoritative. The accepted shared-read check stays in operations capacity; this file was not changed. |
| `infrastructure-change-safety/references/rollout.md` | Conditional storage-copy completion: range coverage and semantic comparisons, including deletion and expiry under ongoing writes. |
| `microservice-extraction/references/data-transition.md` | Already covers authority transfer, dual-write gaps, and row-count limits; source corroboration may suffice. |
| `messaging-reliability` | No new rule justified. Chat-message storage is not a broker-delivery protocol; checkpoint/effect rules are already present. |
| `microservice-data` | Avoid broadening its trigger to single-database tuning. Its data-ownership guidance already covers the relevant authority questions. |

Suggested acceptance cases, **not executed**:

- Flood one key and many distinct keys while a cold key has an independent
  latency budget. Assert bounded active origin calls, waiter count, tracked-key
  count, and eventual release after cancellation/error.
- Pause an old shared read, acknowledge a newer write, then attach a strict
  reader and an unauthorized reader. Neither may receive a result that violates
  its own contract. Repeat during routing-owner replacement.
- Mark a synthetic migration nearly complete while one cold range fails; include
  a missing record, deleted record, altered TTL and altered write time. The
  completion gate stays closed until every required range has a documented
  disposition and the comparison detects each relevant semantic mismatch.

The primary-doc cross-check used Go x/sync v0.23.0, Tokio 1.53.1, ScyllaDB manual
2026.3, Migrator 2.1.x, and the Cassandra page displaying 5.0, as accessed on
2026-09-29. These are reading pins, not installed/runtime validation. No claim
about current Discord internals, universal database superiority, or the safety
of its historical storage topology is adopted.
