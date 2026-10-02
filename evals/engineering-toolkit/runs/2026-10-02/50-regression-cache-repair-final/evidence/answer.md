Updated [service.mjs](../final-project/service.mjs) so reads and writes publish through the cache’s atomic revision check. A delayed older result can no longer replace a newer cached value or survive value eviction. The public API, adapters, and verification script are unchanged.

`node verify.mjs` passes **5/5 checks**. An additional controlled check passed with an earlier writer’s cache publication delayed until after a newer writer completed.

Under the supplied adapters, a read invoked after a successful write returns that revision or newer. A read already overlapping the write may return its captured older snapshot. This result relies on the shared revision floor surviving eviction and on database reads capturing the authoritative row at invocation; it does not establish crash recovery, replica freshness, or production multi-process behavior.
