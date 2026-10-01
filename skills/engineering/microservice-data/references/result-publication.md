# Independent results and readiness

Use when parallel workers publish separate derived results for one entity, such
as several reports or processed artifacts, and readers discover them through
completion metadata.

## Remove avoidable shared mutation

Trace each writer and the business invariant before choosing synchronization.
When results are independent, give each fact its own storage identity instead of
having every worker replace one serialized list. Include the tenant, entity,
work item and revision where they determine identity. Two distinct results can
then coexist without a shared read-modify-write decision.

Define what happens when writers target the same result: replacement, conflict,
or recovery of an earlier outcome. Separate addresses do not protect an invariant
spanning results. Independent reservation records still need enforcement of a
shared inventory limit at its owner.

## Publish readiness under the reader's contract

Identify durable result content, its completion pointer and their commit points.
Publish a pointer only after the corresponding content is durable. State how a
reader knows that the pointer and content describe the same generation.

Write order alone does not establish read visibility across tables, stores or
replicas. Verify the actual transaction scope, replication and routing contract.
Where one atomic operation can publish both, use its supported boundary. Otherwise
define how a reader handles a temporarily missing or incompatible result, and
how the responsible worker or reconciler repairs content without a pointer.
Retain the referenced generation for the pointer's supported lifetime.

Keep completion per item separate from completion of a batch: the latter needs
expected membership or an authoritative end condition. A set of observed
pointers does not establish that every required item finished.

## Verify the contract

Force two workers for the same entity to publish different results concurrently;
assert both remain discoverable. Also collide on the same identity and revision,
and observe the declared conflict or replacement outcome. Interrupt after content
commit but before pointer publication, then resume or reconcile without losing the
result. Route the reader through the actual stale/failover path and verify that
it cannot report a missing generation as complete. Test deletion while a pointer
remains valid.

[Spotify's account](https://engineering.atspotify.com/2026/3/inside-the-archive-2025-wrapped)
motivates the disjoint-fact and content-first layout. These reader, collision,
retention and interruption checks are independent applications; the article does
not name its database or prove their guarantees for another system. See
[sources](sources.md) for the current datastore crosscheck.
