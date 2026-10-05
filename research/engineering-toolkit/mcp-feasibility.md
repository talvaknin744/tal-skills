# MCP 2026-07-28: executed feasibility research

Verified 2026-09-29. **26 baseline checks passed across two real cross-language HTTP pairs:** Python client → TypeScript server and Go client → TypeScript server. A separate synthetic authorization/cache fixture added **16 passing checks**, for 42 total. This supports the planned `mcp-engineering` skill's baseline examples. It is a bounded feasibility result, not protocol certification or a production-readiness claim. Detailed results, versions, wire observations and artifact hashes are in [the evidence ledger](mcp-feasibility.json).

## Installed versions and callable interfaces

All probes used deterministic tools on `127.0.0.1`, an ephemeral port and no production credentials. Dependencies and probe sources were placed under `/tmp/tal-mcp-research-20260929`; package managers also used their normal caches. No repository application dependency was changed.

| Component | Actually installed and exercised |
| --- | --- |
| TypeScript server | `@modelcontextprotocol/server` 2.2.0; `@modelcontextprotocol/node` 2.1.0; transitive core 2.2.0; Zod 4.2.0; Node v25.9.0 |
| Python client | `mcp` 2.2.0; `mcp-types` 2.2.0; Python 3.14.3 |
| Raw HTTP observer | `httpx2` 2.13.1 |
| Go client | `github.com/modelcontextprotocol/go-sdk` v1.8.0; Go 1.27.1, Darwin ARM64 |
| Installed but not exercised | `@modelcontextprotocol/client` 2.2.0 |

The TypeScript server used `McpServer.registerTool`, `createMcpHandler(() => freshServer, {responseMode: 'sse'})`, `toNodeHandler`, and explicit localhost host/origin middleware. Its cancellation handler watched `context.mcpReq.signal`, cleared its pending timer and emitted progress through `context.mcpReq.notify`. These interfaces were verified in the installed packages and exercised by the probes. [HTTP serving API](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.2.0/docs/serving/http.md), [progress and cancellation API](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.2.0/docs/servers/logging-progress-cancellation.md).

Python used `from mcp import Client`, async client contexts, `list_tools`, `call_tool` and `progress_callback`. Both `mode='auto'` and `mode='2026-07-28'` successfully used the intended revision. `read_timeout_seconds` is per underlying call round; it is not a substitute for an application-wide deadline when continuations occur. [Pinned client implementation](https://github.com/modelcontextprotocol/python-sdk/blob/v2.2.0/src/mcp/client/client.py).

Go used `mcp.NewClient`, `StreamableClientTransport`, `Client.Connect`, `ClientSession.ListTools`, `CallTool` and a progress notification callback. `ClientSessionOptions.ProtocolVersion` requests a revision but permits negotiation. The probe therefore separately asserted `session.InitializeResult().ProtocolVersion == "2026-07-28"`. Reconnect retries were disabled with `MaxRetries: -1`. [Pinned client API](https://github.com/modelcontextprotocol/go-sdk/blob/v1.8.0/mcp/client.go), [transport options](https://github.com/modelcontextprotocol/go-sdk/blob/v1.8.0/mcp/streamable.go).

## Executed checks

The server exposed three original fixtures: bounded integer addition with a structured output schema, a deliberate business rejection, and a slow operation with progress plus a simulated effect flag. Each harness started and stopped its own server process.

| Run | Checks | Observed result |
| --- | --- | --- |
| Python SDK plus raw HTTP | 14/14 | Discovery/list/call; explicit revision; invalid argument and business errors; unsupported version; version/method/name header mismatch; missing required metadata; unknown tool; raw SSE disconnect before/after effect; rejected calls did not increment the addition handler's effect counter; no initialize/session header |
| Go SDK | 10/10 | Negotiated revision; list/call; invalid input; business rejection; unknown tool; context cancellation before/after effect; rejected inputs did not execute addition; no initialize/session header |
| Python SDK cancellation | 2/2 | `asyncio.Task.cancel()` after a progress event produced `CancelledError` and stopped the unfinished server handler, both before and after the simulated effect |
| Synthetic authorization/cache, raw HTTP | 16/16 | Credential rejection; owned-handle effects; forged claims ignored; per-request identity; private cache isolated by caller and token; scope checked before cache lookup |

The unsupported revision returned HTTP 400 with JSON-RPC `-32022`. Header/body mismatches returned HTTP 400 with `-32020`. Missing mandatory metadata returned HTTP 400 with `-32602`. Invalid tool arguments and a business rejection arrived as successful protocol exchanges containing `isError: true`. An unknown tool returned HTTP 200 carrying JSON-RPC `-32602`.

That last case corrected an initial harness mistake: the first run expected HTTP 400 for an unknown tool and reported 13/14 passing. Inspection of the pinned transport established that HTTP status depends on where the error originated and whether the response stream has begun. The oracle was corrected; the server's error behavior was unchanged. The initial result is preserved in scratch and identified by hash. Validate the transport, JSON-RPC envelope and tool result independently. [Transport error mapping](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.2.0/packages/server/src/server/perRequestTransport.ts).

## Cancellation evidence and its limits

Every cancellation probe waited for a progress event before interrupting the request. The server then recorded `aborted: true`, `finished: false`. With an effect recorded before the interruption, `committed` remained true. With no prior effect, it remained false. This demonstrates cooperative cleanup and the absence of automatic rollback in these fixtures; the flag is not a durable transaction or an external payment.

For this protocol revision, closing the HTTP SSE response signals cancellation. The raw HTTP probe independently tested that behavior. Python cancellation closed the response stream without a cancellation notification in the observed trace. Go context cancellation closed the stream and additionally sent `notifications/cancelled` as HTTP POST; the TypeScript server accepted those notifications with HTTP 202. The extra Go request is an SDK observation, not a required application step. The specification says that no such notification is required or expected for HTTP. [Cancellation specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation), [Go cancellation implementation](https://github.com/modelcontextprotocol/go-sdk/blob/v1.8.0/mcp/transport.go).

Do not turn the measured local observation intervals into latency promises. A real handler must propagate cancellation into its own resource use and separately reconcile uncertain external outcomes. All current-version exchanges used per-request metadata and no initialization message or MCP session ID. The SDK's `ClientSession` name did not imply a wire session. [HTTP transport contract](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http).

## Supplementary identity and private-cache probe

A second server used a fixed, public credential lookup to represent Alice and Bob. **This is not OAuth/JWT verification or conformance.** Middleware attached the lookup result as `req.auth` before invoking `toNodeHandler`. The adapter forwarded it to the factory as `authInfo` and to callbacks as `ctx.http.authInfo`; it did not authenticate the credential itself. The user identity lived in `extra.principalId`. Both users deliberately shared the same `clientId`, demonstrating that the OAuth application identity is not the end-user identity. [Node adapter](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.2.0/packages/middleware/node/src/toNodeHandler.ts), [AuthInfo fields](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.2.0/packages/core-internal/src/types/types.ts).

Missing or unknown credentials returned 401 before the factory ran. Alice could modify her handle; Bob could not modify that same handle, including with forged principal claims in arguments, `_meta` and `X-Principal`. Alice's verified identity remained Alice when the untrusted hints said Bob. Bob could modify his own handle. Exactly three authorized effects were recorded; denied calls added none. Permission checks included tenant, owner and scope before mutation.

For the same `private://self` URI, alternating Alice/Bob requests returned only their own private payloads. The application cache key included verified tenant, principal, authorization version, scopes, a credential fingerprint, method and URI. Two repeat requests hit separate entries; rotating Alice's token created a third entry. Bob's reduced-scope token was denied before any cache lookup. The server emitted `cacheScope: private` and `ttlMs: 30000` using `registerResource(..., {cacheHint}, callback)`. Private scope requires authorization-context separation, including a changed token; the hint itself does not enforce access control. [Caching contract](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching), [SDK cache-hint options](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.2.0/packages/server/src/server/server.ts).

Two scratch mistakes were corrected transparently: `ResourceNotFoundError` is exported by the server package, and raw `resources/read` needs `Mcp-Name` matching `params.uri`. Omitting that header correctly produced HTTP 400/`-32020` before dispatch. The corrected fixture passed 16/16; initial evidence remains in scratch. This fixture also exercised JSON-only responses. It did not test SDK client caches, token revocation, distributed cache behavior or authorization changes under the same token.

## Remaining verification

The final implementation should retain small deterministic probes while adding only scenarios required by its actual contract. These results leave the following work unverified:

- Other client/server directions, stdio and earlier protocol revisions.
- Real authentication and authorization policy, token audiences/revocation, browser-origin rejection and TLS/proxy behavior.
- MRTR integrity/replay, optional tasks, subscriptions, real client/gateway cache separation and capability mismatch.
- Durable storage, effects across process failure, retry after response loss, multi-process shutdown and handlers that ignore cancellation.
- A2A execution, full upstream conformance, load behavior and deployment-specific recovery.

The scratch commands can replay the retained local probes: run `.venv/bin/python probe.py`, `python3 run-go.py`, `.venv/bin/python python-cancel.py`, and `.venv/bin/python auth-probe.py` from the scratch directory. The JSON ledger preserves evidence after scratch deletion, but its source hashes alone do not constitute a complete reproduction bundle. Final repository examples still need their own checked-in source, locks and automated execution.
