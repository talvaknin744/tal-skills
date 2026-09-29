# Cross-service reads and projections

Use this reference for service joins, reporting databases, caches, or materialized views.

## Pick a read contract

Name the question the reader must answer, acceptable age of data, required latency, expected volume, and behavior when a contributing service is unavailable. Direct service calls can suffice for small reads needing current data. Inspect fan-out and repeated lookups before replacing a database join with many network calls; batching or an owned aggregation endpoint may suffice.

A projection stores a derived view and can isolate readers from source availability, at the cost of lag and synchronization work. Give it an explicit schema and owner. Keep the source service authoritative for business writes; a copied reporting row is not authority to approve a transaction. If several fields must represent one consistent point in time, specify how that snapshot is obtained or disclose that the read can combine different moments.

## Populate and maintain the view

Compare supported bulk exports, a source-owned data pump, and public events. A pump that knows private storage structure should evolve with the source service. Consumers depending directly on its tables bind themselves to that implementation. An intentionally published reporting schema is a separate interface with compatibility obligations.

For an event-fed view, identify the committed fact, entity identity, relevant version or ordering, and the rule for repeated or late events. Account for the gap between committing source state and publishing its update. Persist processing progress consistently with the view update or use an equivalent replay-safe mechanism.

Explain how initial data and continuing updates meet without a gap. Specify required history, deletion handling, replay retention, and reconciliation with the authority. A rebuild must not accidentally reissue business side effects; constructing a read model and rerunning a business workflow are different operations. Observe lag and failed updates, and assign repair ownership.

## Keep the concepts separate

CQRS separates read and write models. Event sourcing derives state from a history of events. Either may be used without the other, and an event-fed reporting database requires neither an event-sourced write model nor a system-wide CQRS conversion. Justify the additional machinery against the actual query need and keep internal storage choices behind the service interface.

For implementation, check normal updates and the relevant late, repeated, missing, deleted, or replayed data cases. Verify user-visible staleness behavior and the intended repair result. For a design, record those checks as validation work rather than implying they ran.
