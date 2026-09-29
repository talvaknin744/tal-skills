# Errors, interruption and effects

Interpret three layers independently: HTTP status, JSON-RPC result/error, and a tool result's `isError`. A handler-level JSON-RPC error can arrive inside HTTP 200, especially after an SSE response has started. Invalid tool arguments can be represented as a tool error without invoking the business handler. Check actual SDK behavior before asserting one universal status mapping.

For MCP 2026-07-28 Streamable HTTP, closing a request's SSE response signals cancellation. A cooperative handler propagates its request signal into owned work and releases resources. Stdio uses a cancellation notification because it has no per-request stream to close. Keep a maximum operation deadline even when progress extends an inactivity timeout; Python's per-round timeout is not an overall MRTR deadline.

Cancellation is a request to stop work, not evidence that an external effect rolled back. Distinguish:

| Observation | Application conclusion |
| --- | --- |
| Effect never started, handler cleanup confirmed | Safe to report stopped before effect |
| Effect committed before interruption | Preserve the committed result; reconcile delivery separately |
| Connection lost while effect outcome is unknown | Query/reconcile by stable operation identity before retrying |

A JSON-RPC request ID correlates an exchange; it is not automatically a durable business deduplication key. Mutating tools need their application's retry identity and effect contract. Retry only within the requested operation's budget and stop when ownership or outcome cannot be resolved safely.

Test with a progress barrier, then interrupt before and after a controlled effect. Check handler cleanup and authoritative effect state, not just the client's exception. An in-memory flag proves only the local fixture; database/provider effects need their own observation. Go v1.8.0 additionally emits a best-effort HTTP cancellation notification when its context is canceled; do not make that SDK detail an application requirement.
