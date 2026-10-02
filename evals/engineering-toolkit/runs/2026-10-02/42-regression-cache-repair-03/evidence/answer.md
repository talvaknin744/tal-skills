Updated [service.mjs](../final-project/service.mjs) so writes raise the shared revision floor before resolving, and cache misses publish their database result only if it is still fresh. The public API and adapter implementations are unchanged.

`node verify.mjs` passed **5/5 checks**. An additional controlled check confirmed that an earlier writer finishing late cannot lower the floor or replace a newer cached value.

This establishes the requested behavior for overlapping reads and writes under the supplied, successful adapter calls. A read already in progress may still return its earlier snapshot. Crashes, adapter failures, floor expiry, replica reads, and production database/cache atomicity remain outside this result.
