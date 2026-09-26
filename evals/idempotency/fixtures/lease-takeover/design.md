# Inventory reservation workers

Queue delivery is at least once. Messages contain a stable `reservationId` and
SKU/quantity. The database has `jobs(reservation_id UNIQUE, owner, lease_until,
state)` and `stock(sku PRIMARY KEY, available)`. There is no separate reservation
table or uniqueness constraint on the stock adjustment. Every worker has a
different owner ID. `reserve_stock` decrements inventory in its own transaction.

The claim update is atomic and succeeds for exactly one claimant while the
lease is live. A worker can pause for more than the 30-second lease because of
process suspension. The queue redelivers after 40 seconds. A worker that
resumes after its lease expires is not stopped by the runtime. The system
must reserve at most once and recover abandoned jobs. All effects here are in
the same SQL database; there is no external provider.
