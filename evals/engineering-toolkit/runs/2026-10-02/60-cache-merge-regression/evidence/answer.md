Updated [service.mjs](../final-project/service.mjs) to publish database reads only when their revision is fresh and to raise the shared revision floor before a write resolves. The public API, adapters, and verification script are unchanged.

`node verify.mjs` passed **5/5 checks**; the original service passed 2/5. Under the supplied adapters, a read invoked after a write resolves returns that revision or newer. A read already overlapping the write may return its earlier snapshot, but cannot put that snapshot back into the cache.

The result covers two service instances sharing the supplied database, cache, and persistent revision floors in one process. It does not establish behavior for replicas, adapter failures, floor loss, crashes between database and cache updates, or production storage implementations.
