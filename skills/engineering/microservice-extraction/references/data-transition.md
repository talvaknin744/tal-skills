# Move data authority

Use this whenever an extraction separates code from its data or transfers data ownership. Choose a transition supported by the actual datastore and migration tools.

## Discover dependencies

Inventory relevant tables or collections, direct queries, foreign keys, triggers, scheduled writers, reports, caches, and external exports. Distinguish privately owned state from deliberately published data. A reporting consumer is still a consumer even when it bypasses application code.

For each lost database guarantee, name the replacement business behavior. A foreign key crossing the new boundary may need stable identifiers, a retained historical snapshot, a deletion contract, or reconciliation. A transaction split across stores requires a defined business workflow or a revised seam. Preserve strict invariants within one owner when asynchronous repair would violate the requirement.

## Transfer ownership

Describe these points for the chosen mechanism, whether it uses a pause, a durable change stream, or a staged API transition:

- **Baseline:** how the initial copy corresponds to a known source position while concurrent changes continue or are paused.
- **Catch-up:** how changes, deletions, ordering, and failed delivery are applied after that position; how lag and divergence are detected.
- **Handoff:** how old writers are stopped or redirected, in-flight work drains, and the destination becomes authoritative without a gap or competing owners.
- **Recovery:** where writes accepted after handoff can be recovered, and whether the old code can understand their schema and semantics.

Two ordinary writes to different stores are not one atomic operation. If dual writing is proposed, identify the durable evidence and reconciliation process for each partial success. A reliable change-capture mechanism still needs checkpoint, replay, and schema-evolution handling; verify its actual guarantees before relying on it.

Use additive schema changes while old and new code coexist. Retire old columns or readers only after evidence that no supported consumer or rollback path uses them. Shared database infrastructure can remain if ownership and access boundaries are enforceable; independence does not require an arbitrary physical server count.

Completion means representative records, totals or domain invariants, deletes, concurrent updates, and checkpoint recovery have a defined comparison. Row counts alone cannot show that the copied business state is correct. For a plan, specify these checks; for an implemented handoff, report the checks actually executed.
