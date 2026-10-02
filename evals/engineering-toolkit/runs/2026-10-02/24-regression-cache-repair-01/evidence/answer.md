Updated [service.mjs](../final-project/service.mjs). Writes now raise the shared revision floor before resolving. Reads publish database results only when the cache accepts their revision; a rejected stale result triggers a retry. The public API is unchanged.

`node verify.mjs` passes all 5 checks. An additional controlled check passed for reordered write notifications followed by eviction. The result covers successful calls with the supplied shared cache and authoritative database adapters; it does not establish crash recovery or guarantees for production storage implementations.
