# Ownership and takeover

Use ownership election when multiple processes may run but only one may perform a particular role. First compare a supervised singleton with failover among multiple candidates. Choose from permitted interruption and deployment downtime, rather than introducing election merely because replicas exist. Name what is exclusive: one global coordinator, one partition, or one specific resource.

When failover is required, use the established coordination service's supported election or lease primitive. Verify its actual consistency, renewal, and failure behavior. Describe acquisition, renewal, loss, release, and takeover as state transitions. Identify the authority's record and the condition that grants ownership; a local belief or read followed by an unconditional write is insufficient.

The source's lease examples expose two different issues: an expired owner may still be running, and its later unlock may release a successor's lock. Condition release and renewal on the exact ownership generation. That protects the coordination record; separately establish what prevents the obsolete process from acting on the protected resource.

Failure checks added by this workflow: pause an owner beyond expiry, allow a successor to acquire, then resume the old process. Where stale actions can violate the invariant, require an enforceable mechanism such as a monotonically increasing token checked by the protected resource, a conditional transaction, or an equivalent proven guard. A watchdog in the paused process is not, by itself, evidence that the resource rejects stale actions. If the resource cannot enforce ownership, state the weaker guarantee and the needed reconciliation or design change.

Also test delayed renewals, coordinator unavailability, and a stale release. Record when a candidate stops initiating work and how in-flight work resolves. Treat repeated external effects as a separate correctness concern where present; election alone is not duplicate suppression.

Finish with the exclusive invariant, transition table, enforcement point, and takeover evidence. Chapter 9 supplies singleton trade-offs, leases, generation-aware release, and downstream owner/version checks. The enforceable protected-write boundary and acceptance procedure extend that basis, as recorded in [sources.md](sources.md).
