Updated [service.mjs](../final-project/service.mjs). Writes now advance a shared revision floor, and cache fills use `publishIfFresh` so a delayed older read cannot replace a newer value. The public API and adapter implementations are unchanged.

`node verify.mjs` passes all 5 checks. This result covers the supplied model’s successful adapter calls and overlapping operations; it does not establish crash recovery or a transaction across a real database and cache.
