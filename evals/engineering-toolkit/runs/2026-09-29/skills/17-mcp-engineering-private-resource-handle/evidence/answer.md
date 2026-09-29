The adapter violates the supplied **MCP 2026-07-28** contract in three places.

1. **[P1] Private cache results bypass authorization** — [adapter.pseudo:2](/tmp/tal-skill-trials-20260929/17-mcp-engineering-private-resource-handle/workspace/project/adapter.pseudo:2). Once Alice’s `h7` is cached, Bob’s r2 receives its contents immediately. Dispatch cannot enforce ownership because it never runs. Authorize the current caller against the handle before returning cached content. Partition cached results by authorization context, operation and relevant parameters; handle secrecy is insufficient.

2. **[P1] Connection reuse carries Alice’s authority into Bob’s requests** — [adapter.pseudo:1](/tmp/tal-skill-trials-20260929/17-mcp-engineering-private-resource-handle/workspace/project/adapter.pseudo:1). On a cache miss, Bob’s request dispatches with Alice’s retained principal. Resolve identity from each request’s trusted `authenticatedPrincipal`. Fixing the cache alone leaves this defect exploitable.

3. **[P1] Conflicting HTTP metadata reaches dispatch** — [adapter.pseudo:4](/tmp/tal-skill-trials-20260929/17-mcp-engineering-private-resource-handle/workspace/project/adapter.pseudo:4). The third request advertises `tools/call` but dispatches `resources/read`, defeating routing or policy decisions based on the header. Validate version, method and applicable name/URI header agreement before either cache access or dispatch.

The minimum checks for this version are:

| Boundary | Required check and expected result |
|---|---|
| Caller and ownership | Run Alice’s r1 followed by Bob’s r2 on the same connection, with cache hits and misses. Bob must receive no Alice-owned payload and cause no unauthorized effect. Confirm Alice’s authorized read still succeeds. |
| Changing authorization | Alternate principals and capabilities per request; rotate credentials, reduce permissions and revoke access after caching. Revalidate or invalidate stale entries. Forged identity hints and tool annotations must grant no authority. A principal-only cache key is insufficient. |
| Current request contract | Exercise missing, malformed, unsupported and conflicting version/method/name metadata, including the supplied third request. Reject invalid requests before protected work. Evaluate capabilities per request; a legacy initialization handshake does not establish this revision’s contract. |
| Message and tool contracts | Validate JSON-RPC envelopes and tool arguments before execution, and structured results against advertised output schemas. Observe HTTP status, JSON-RPC errors and tool `isError` separately; do not assume one universal error mapping. |
| HTTP deployment | For Streamable HTTP, reject a present, disallowed `Origin` with HTTP 403 before invoking the handler. For localhost deployment, check host headers and bind explicitly to loopback. |
| Interruption, if streaming/effects are supported | Close the request’s SSE response before and after a controlled effect. Verify cancellation propagation, cleanup and authoritative effect state. Cancellation does not prove rollback; an unknown outcome requires reconciliation before retry. |

Compatibility evidence is limited:

| Client | Server | Revision | Evidence |
|---|---|---|---|
| Synthetic authenticated test adapter | Supplied pseudocode | 2026-07-28, as specified | Static review and in-memory reproduction |
| Actual SDK client | Actual SDK server | SDK pin asserted, artifacts absent | Interoperability untested |

The project contains no lockfile or executable SDK implementation. A minimum integration check must therefore verify the actual SDK pins and effective revision with a deterministic local peer. The synthetic authentication fixture establishes caller routing, **not OAuth verification**; legacy revisions and optional extensions remain unverified.

An in-memory translation reproduced the cache disclosure, stale-principal dispatch and method mismatch. Both supplied files retain their original hashes. No external services were used.
