# Inventory reservation contract

Runtime: Python 3.10+ standard library and SQLite. All data in this project is
synthetic. No network, remote account, or HTTP server is involved.

Keep `initialize(path)`, `stock(path, tenant, sku)`, and
`reserve(path, authenticated_tenant, request_key, body)`. The caller has already
authenticated and authorized `authenticated_tenant`; this function does not parse
credentials. `body` is a dictionary with `sku` and `quantity`. Some legacy clients
also send `tenant`, but that field has no authority and is not part of the intended
reservation. Other extra fields are invalid. Trusted tenant, key, and SKU must be
nonempty strings; quantity must be an exact built-in `int` greater than zero.

One successful operation reserves `quantity` of the tenant's SKU, records one
reservation, and returns a dictionary with `reservation_id`, `tenant`, `sku`,
`quantity`, and `remaining`. The receipt's values and types are stable on replay.
Reservations are durable across connections and service-object lifetimes.

Request keys are scoped to the trusted tenant. Within that scope, the same key and
same `(sku, quantity)` intent return the original complete receipt and cause one
stock decrement. The same key with different valid intent raises
`ReservationConflict`, with no further effect. The same key is independently usable
by another tenant. Current stock may have changed since the original receipt.

Validate input before effects. Malformed input raises `ValueError`. Unknown stock
or insufficient stock raises `InsufficientStock`; rejected attempts consume neither
stock nor the operation key. The service may receive overlapping calls from separate
connections. A lost client response after `reserve` returns does not remove its
committed result; a later identical retry still returns that result.

`initialize` prepares the schema and seeds these synthetic inventory rows once:
tenant-a/gear=5, tenant-a/bolt=8, tenant-b/gear=7. Existing inventory must survive
subsequent initialization. Existing reservations are in the `reservations` table;
new storage may be added. A production migration is outside this local fixture.

Acceptance uses actual disposable SQLite files and separate calls/connections.
It establishes the supplied local database behavior, not remote-provider effects,
process kill recovery under every SQLite setting, or production authorization.
