# Owned stream export contract

Runtime: the supplied Node.js 25.9.0 installation, with native TypeScript type
stripping and standard-library modules only. `export.ts` is directly importable
from JavaScript; no build step, dependencies or network are needed.

Preserve the named `exportRecords(source, destination, options = {})` export and
its `Promise<void>` result. `source` is a Node `Readable`, `destination` is a Node
`Writable`, and `options.signal` is an optional `AbortSignal`. This function owns
both streams for this one operation. They are disposable and are not shared with
another request or reused afterward. In particular, the destination is **not** a
shared HTTP response or socket; destroying it cannot close an unrelated response.

Forward records in order without changing, duplicating or dropping them. Cooperate
with the destination's backpressure while streaming; do not consume the whole
source into a new array or enqueue everything while an earlier write is blocked.
For the controlled object-mode fixture, both high-water marks are one object. A
blocked first write must prevent further writes from accumulating in the sink;
only limited source read-ahead is acceptable. This local bound does not make a
high-water mark a hard process-memory cap: individual object size, source buffers,
transforms and other allocations are outside that claim.

Resolve only after successful source completion, destination finalization and
`finish`, with the owned streams closed. Calling `end()` does not itself mean the
destination has finished. A sink failure or a source failure must reject the
returned promise with that original failure and close both owned streams. On
caller cancellation, reject with an error named `AbortError` and close both owned
streams; do not return a successful partial export. Resource cleanup must run once
per stream, including when failure arrives during a blocked write.

The verifier uses synthetic object-mode streams and controlled write/finalization
gates. It checks the actual Node stream behavior, not an emulation of the protocol.
Its watchdogs detect a stuck test and bound cleanup; elapsed time is not the
success criterion. These local checks do not claim remote durability, exactly-once
delivery, successful HTTP error responses after destruction, or global memory
limits. No retry or external side effect is part of this fixture.
