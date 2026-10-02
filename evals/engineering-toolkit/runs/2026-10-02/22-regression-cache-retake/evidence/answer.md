Updated [service.mjs](../final-project/service.mjs) so reads and writes use the cache’s atomic `publishIfFresh` operation. This prevents delayed reads or out-of-order write notifications from replacing a newer revision, even after value eviction. The public API and adapter implementations are unchanged.

`node verify.mjs` passed **5/5 checks**. An additional controlled check passed for a delayed earlier write notification arriving after a newer write and eviction.

The result covers the supplied model’s successful adapter calls and shared, persistent revision floors. Reads already overlapping a write may still return their earlier snapshot; crashes between database commit and cache publication and real distributed storage behavior remain outside this model.
