# Ownership and takeover

Use ownership election when multiple processes may run but only one may perform a particular role. First compare a supervised singleton with failover among multiple candidates. Choose from permitted interruption and deployment downtime, rather than introducing election merely because replicas exist. Name what is exclusive: one global coordinator, one partition, or one specific resource.

When failover is required, use the established coordination service's supported election or lease primitive. Verify its actual consistency, renewal, and failure behavior. Describe acquisition, renewal, loss, release, and takeover as state transitions. Identify the authority's record and the condition that grants ownership; a local belief or read followed by an unconditional write is insufficient.

The source's lease examples expose two different issues: an expired owner may still be running, and its later unlock may release a successor's lock. Condition release and renewal on the exact ownership generation. That protects the coordination record; separately establish what prevents the obsolete process from acting on the protected resource.

Failure checks added by this workflow: pause an owner beyond expiry, allow a successor to acquire, then resume the old process. Where stale actions can violate the invariant, require an enforceable mechanism such as a monotonically increasing token checked by the protected resource, a conditional transaction, or an equivalent proven guard. A watchdog in the paused process is not, by itself, evidence that the resource rejects stale actions. If the resource cannot enforce ownership, state the weaker guarantee and the needed reconciliation or design change.

Also test delayed renewals, coordinator unavailability, and a stale release. Record when a candidate stops initiating work and how in-flight work resolves. Treat repeated external effects as a separate correctness concern where present; election alone is not duplicate suppression.

Finish with the exclusive invariant, transition table, enforcement point, and takeover evidence. Chapter 9 supplies singleton trade-offs, leases, generation-aware release, and downstream owner/version checks. The enforceable protected-write boundary and acceptance procedure extend that basis, as recorded in [sources.md](sources.md).

## Asynchronous finalization and ownership transfer

Use this branch when retries or recovery can overlap background finalization. Enumerate every durable-write path, including delayed flushers. An ownership record protects those writes only when the write authority checks the current owner atomically with each mutation. Unguarded external effects need their own conditional operation or reconciliation contract.

For voluntary transfer, stop admitting work under the old owner and resolve its pending commits before handing ownership to a successor. Distinguish a known abort from an unknown commit result: a timeout or canceled wait can leave an already-dispatched commit successful. Reconcile that result using durable operation identity; waiting for a fixed duration is not proof that transfer is safe.

For recovery takeover, establish the authoritative condition permitting a successor to claim ownership. A durable death record can participate in a conditional claim; a missed heartbeat alone does not prove the previous worker or its writes have stopped. Keep owner acquisition, effect protection, and death detection separate.

Verify a delayed background write during transfer, an unknown commit, and competing recovery claims. Observe accepted mutations at the protected resource and the successor's progress. Report unresolved effect boundaries and the actual recovery evidence. The Snowflake execution-anchor account and FoundationDB commit semantics are scoped in [sources.md](sources.md).
