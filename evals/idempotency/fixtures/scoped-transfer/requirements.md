# Transfer API

The service authenticates every request. `req.actor.tenantId` comes from the
verified session, not the JSON body. A user may transfer only from a wallet
belonging to that tenant. Wallet IDs are globally unique. `authorizeWallet`
performs that ownership check, and `moveMoney` durably creates a transfer in the
tenant's ledger. The response contains the destination and amount.

Clients supply an `Idempotency-Key` and retry after connection loss. The cache
is shared by all tenants and API routes. The same tenant may deliberately make
two equal transfers using different keys. A previous session may be revoked
between attempts. The code below is the complete relevant handler; no upstream
middleware scopes the cache or compares the request body.
