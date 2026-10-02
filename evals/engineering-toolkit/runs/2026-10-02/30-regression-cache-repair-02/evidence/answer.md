Updated [service.mjs](../final-project/service.mjs). Writes now raise a shared revision floor before returning; reads publish through the cache’s atomic freshness check and retry if an older fill is rejected. The public API, adapters, and verification script are unchanged.

`node verify.mjs` passes **5/5 checks**. An additional controlled check passed for a stale read retry and a delayed older write notification.

The guarantee covers overlapping operations with the supplied adapters: a read started after an acknowledged write returns that revision or newer, while a read already in progress may return its earlier snapshot. It relies on authoritative database reads, successful adapter calls, and revision floors surviving eviction and outstanding readers. Crash recovery, adapter failures, floor expiry, replicas, and production cross-store atomicity remain outside this result.
