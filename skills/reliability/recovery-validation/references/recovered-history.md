# Reconcile recovered history

Read this branch for inconsistent local effects/completion or a snapshot older
than surviving consumers, workers, or effects. Restoring one store rewinds only
that store.

## Local effects and completion

For inconsistent local records, specify repair before recommending replay. A
review proposes the protocol; executing repair requires authorized scope.
Arbitrate attempts under the original operation identity, bound to accepted
payload, using uniqueness or a conditional claim rather than separate existence
checks and writes. Where one transactional store owns effect and completion,
reuse a matching effect or commit the missing effect and corrected completion
together; hold conflicting payloads for resolution. Otherwise identify the
store's supported atomic equivalent or keep resumption closed. Verify repeated
and concurrent replay, including interruption between effect and completion,
preserves one effect and consistent progress. PostgreSQL 18
[transactions](https://www.postgresql.org/docs/18/tutorial-transactions.html) and
[unique-conflict arbitration](https://www.postgresql.org/docs/18/sql-insert.html)
illustrate these mechanisms; they do not make external effects transactional.

## Watches, caches, and projections

For **etcd 3.6**, follow the documented recovery membership and revision procedure.
Watchers or Kubernetes informers may retain revisions newer than a restored
snapshot. A suitably sized revision bump plus marking the restored revision
compacted forces consumers to invalidate the old watch history. Test a surviving
consumer that had observed a later revision, not only a newly started reader.
[etcd disaster recovery](https://etcd.io/docs/v3.6/op-guide/recovery/)

For other stores this is an application inference, not an etcd flag to copy:
inventory checkpoints, versioned cache entries, projections, and live subscriptions.
Choose their product-supported reset, rebuild, or reconciliation procedure and
verify it against recovered authoritative data. An isolated restore with no
surviving consumers does not need an artificial watch-reset step. Blanket cache
flushing cannot restore missing external effects or repair an invalid checkpoint.

## Ownership and external effects

A stale worker may hold an ownership token newer than the restored allocator.
If that risk exists, establish a recovery epoch whose authority survives the
rollback, and enforce it at the protected resource before admission resumes.
Restarting one worker or checking its local lease does not prove stale writes
are rejected. Demonstrate a previously authorized worker failing to mutate after
the recovered owner takes over. The mechanism depends on the application's
resource contract; the PostgreSQL logical example does not execute this scenario.

A payment, notification, or object upload may exist while its local result and
deduplication record were lost. Preserve stable operation identities and consult
the destination's authoritative outcome/retention contract. Reconcile or explicitly
hold an ambiguous effect; automatic replay with new identities can duplicate it.
Also test the inverse: a restored record refers to an external object no longer
present. Pure local data with no surviving effects does not need provider probes.

Acceptance requires evidence for the actual boundary: a previously cached value
is corrected, a projection reaches the intended source position, an old owner is
fenced, or an already executed effect is recognized without repetition. Document
untested branches as pending work rather than borrowing confidence from restore
command success.
