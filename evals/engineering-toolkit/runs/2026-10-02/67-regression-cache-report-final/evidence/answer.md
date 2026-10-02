Updated [service.mjs](../final-project/service.mjs) so a successful write raises the shared revision floor before resolving, and a read publishes its database snapshot only if the cache accepts it as fresh. A read invoked after that write must see its revision or newer; an already overlapping read may return its older snapshot, but cannot leave that snapshot cached for later reads.

`node verify.mjs` passed **5/5 checks** (2/5 before the change). Only `service.mjs` changed; the adapters and verification script remain unchanged.

The result covers the supplied authoritative database and shared, atomic cache adapters, including value eviction and two service instances in one process. It does not establish behavior across crashes, adapter failures, floor expiry, replica reads, or independently running processes and hosts; those require checks against the intended production setup.
