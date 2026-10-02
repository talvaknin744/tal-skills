Updated [service.mjs](../final-project/service.mjs). Writes now raise a shared revision floor before resolving. Cache misses publish their database result only if it is still fresh; a rejected fill retries. This prevents a delayed older read from making later reads regress, including after value eviction. The public API is unchanged, and the adapters and verification script were untouched.

`node verify.mjs`: **5/5 checks passed** (3/5 before the fix).

| Boundary | Scope of the result |
|---|---|
| Source and adapters | Verified with the supplied database snapshot and atomic cache operations; replica and production adapter behavior remain unverified. |
| Write acknowledgement | The guarantee starts after the cache floor update succeeds. Crashes or adapter failures between database commit and that update are outside the model. |
| Metadata lifetime | Value eviction is covered; floor expiry and restart recovery are not. |
| Topology | Checks use two service instances sharing adapters in one process; separate processes or hosts were not tested. |
