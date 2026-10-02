# Node stream ownership

Use this for Node.js streams; inspect the installed runtime and stream settings. Web Streams and other TypeScript runtimes need their own contracts.

## Producer feedback

When `write()` returns `false`, pause production until `drain`, while still observing errors and cancellation. A custom readable should stop pushing when `push()` returns `false` and resume when `_read()` requests more. Scheduling unlimited work outside the stream defeats that feedback. [Node backpressure guide](https://nodejs.org/learn/modules/backpressuring-in-streams)

`highWaterMark` is a buffering threshold, not a whole-process memory cap. Account for chunk/object sizes, transform buffers, and application work separately; inspect actual settings. [Buffering contract](https://nodejs.org/download/release/v25.9.0/docs/api/stream.html#buffering)

## Completion and cancellation

Await promise `pipeline()` and its errors. For manual writes, observe `finish` and error/close outcomes; `end()` alone does not establish completion. Abort requests pipeline stream destruction; generator stages must honor their supplied signal. Aborting `finished(stream, {signal})` stops observation only: the stream still needs its owner. [Node 25.9.0 stream API](https://nodejs.org/download/release/v25.9.0/docs/api/stream.html)

Before using pipelines with HTTP or shared sockets, confirm teardown ownership. Errors can destroy the socket before its intended error response. Verify the response-or-close contract. [HTTP pipeline caveat](https://nodejs.org/download/release/v25.9.0/docs/api/stream.html#streampipelinesource-transforms-destination-callback)

Verification: hold a slow sink and observe producer, buffered, and active-work counts independently. Abort at a held stage and await settlement; report unfinished cleanup if a generator does not cooperate. Separately stop only a `finished()` observer and verify that the stream's owner still completes or terminates the stream.
