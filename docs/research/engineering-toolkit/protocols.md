# MCP and A2A engineering specialists

Verified 2026-09-29. This research inspected official release metadata, pinned source archives, schemas, SDK implementation files and examples. Package-registry metadata independently confirmed Python and TypeScript artifacts. It did not execute SDK conformance or cross-language tests. Recommendations and failure fixtures below are original engineering synthesis.

## Decisions

Add `mcp-engineering` and `a2a-engineering` skills, selected by native `tal-mcp` and `tal-a2a` profiles in implement or review mode. MCP integrates tools/context; A2A exposes independent agent capabilities and work. These profiles help build protocol integrations; they do not require using A2A to orchestrate the repository's coding agents. Reuse the existing idempotency, concurrency-correctness and graceful-draining skills for effects, ownership and recovery instead of repeating their instructions.

Each specialist receives the target code, requested behavior, installed SDK, peer versions, transport and effect guarantee. It returns a patch or evidence-backed findings, a compatibility statement, executed checks, and explicit limitations. Native configuration syntax belongs to the separate platform-adapter research.

## Versions and actual SDK interfaces

Pin **MCP 2026-07-28**, whose stable release tag resolves to `5f5440bb26a62e2cf3440b92da5a667efa03b267`. Its current model carries version/capabilities per request rather than retaining an initialization session; application state uses explicit handles. Keep earlier handshake revisions in an explicitly tested migration path. [Release](https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28), [schema](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/2026-07-28/schema/2026-07-28/schema.ts).

Pin **A2A specification 1.0.1**, source commit `3303592588e388e62e0f69f701af531d2f4e3991`. The website's “latest” banner and SDK READMEs still mention 1.0.0, but GitHub publishes the patch release. The wire version is **`1.0`**, not `1.0.1`; patch numbers do not participate in compatibility negotiation. [Release](https://github.com/a2aproject/A2A/releases/tag/v1.0.1), [version rules](https://a2a-protocol.org/v1.0.1/specification/#36-versioning).

| SDK pin | Source-verified interface and constraint |
| --- | --- |
| MCP TypeScript 2.2.0 | Split `@modelcontextprotocol/client` and `server` packages; `McpServer.registerTool`, factory-based `createMcpHandler`, `serveStdio`, `Client.callTool`. Node ≥20. Node middleware has a separate 2.1.0 version. [Server factory](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.2.0/examples/dual-era/server.ts), [package](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.2.0/packages/middleware/node/package.json) |
| MCP Python 2.2.0 | `mcp.server.MCPServer`, typed `@tool`, `mcp.Client`, `call_tool`; Python ≥3.10. Tasks extension, DPoP and JWT-bearer grant remain unsupported. [README](https://github.com/modelcontextprotocol/python-sdk/blob/v2.2.0/README.md), [expected failures](https://github.com/modelcontextprotocol/python-sdk/blob/v2.2.0/.github/actions/conformance/expected-failures.yml) |
| MCP Go 1.8.0 | `mcp.NewServer`, `mcp.AddTool`, `Client.Connect`, `ClientSession.CallTool`; Go ≥1.25. SDK “session” types do not imply a wire session in the current revision. [Protocol API](https://github.com/modelcontextprotocol/go-sdk/blob/v1.8.0/docs/protocol.md), [module](https://github.com/modelcontextprotocol/go-sdk/blob/v1.8.0/go.mod) |
| A2A TypeScript 1.2.1 | `@a2a-js/sdk`; `ClientFactory`, `DefaultRequestHandler`, executor `execute`/`cancelTask`; JSON-RPC, REST and Node-only gRPC. [README](https://github.com/a2aproject/a2a-js/blob/v1.2.1/README.md), [executor](https://github.com/a2aproject/a2a-js/blob/v1.2.1/src/server/agent_execution/agent_executor.ts) |
| A2A Python 1.1.5 | `ClientFactory`; executor `execute`/`cancel`; `TaskStore`; three standard bindings with explicit 0.3 compatibility. Python ≥3.10; HTTP/gRPC extras are separate. [README](https://github.com/a2aproject/a2a-python/blob/v1.1.5/README.md), [executor](https://github.com/a2aproject/a2a-python/blob/v1.1.5/src/a2a/server/agent_execution/agent_executor.py) |
| A2A Go 2.6.0 | Module `github.com/a2aproject/a2a-go/v2`; `a2asrv.NewHandler`, `a2aclient.NewFromCard`; three standard bindings. **Go ≥1.26**, despite README saying 1.25. [Module](https://github.com/a2aproject/a2a-go/blob/v2.6.0/go.mod), [server](https://github.com/a2aproject/a2a-go/blob/v2.6.0/examples/helloworld/server/jsonrpc/main.go) |

The JSON ledger records complete commit pins, source paths and SDK limitations. Lock examples to these artifacts; verify a real project's existing version before proposing migration.

## MCP contracts worth teaching

Validate both the envelope and the business result. HTTP version, method and name headers must agree with the corresponding body values. Carry identity/capabilities per request; never infer one user's authority from a previous connection. [Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http).

Tool input/output schemas describe the public contract. Separate protocol failures from execution results marked `isError`. Metadata annotations are untrusted hints, not authorization or a proof that retrying a mutation is safe. [Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools).

Multi round-trip continuation is not an ordinary blind retry. Bind integrity-protected state to principal, operation and expiry; enforce single consumption separately when required. A MAC alone does not stop replay. [MRTR](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr).

Current HTTP SSE disconnect cancels that request; stdio uses a cancellation notification. Neither proves an already-started effect was rolled back. Keep an absolute operation deadline even if progress extends an inactivity timeout. [Cancellation](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation).

Authenticate every protected request and validate token audience/issuer. Authorize application handles against the verified caller. Test discovery redirects, resource references and URL fetches at the network boundary. [Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), [security guidance](https://modelcontextprotocol.io/specification/2026-07-28/basic/security_best_practices).

A private cache result must remain scoped to authorization context; TTL is only a freshness hint. Continued MRTR results are not cacheable. A gateway cache must not turn authenticated resource data into shared data. [Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching).

## A2A contracts worth teaching

Keep message identity, task identity and conversation context separate. Interrupted tasks can receive more input; terminal tasks do not restart. Preserve outputs as artifacts and reconcile task state after stream loss. [Task lifecycle](https://a2a-protocol.org/v1.0.1/topics/life-of-a-task/), [streaming](https://a2a-protocol.org/v1.0.1/topics/streaming-and-async/).

A2A streams are observations of work: closing one does not cancel the task or other streams. `SendMessage` deduplication is optional, whereas cancellation is an idempotent operation with a potentially unsuccessful outcome. Authenticate and scope every task operation; never treat knowledge of an ID as access. [Specification](https://a2a-protocol.org/v1.0.1/specification/).

The Go handler defaults to in-memory task/event storage unless configured otherwise. A saved Task object also does not by itself preserve the executing program. Durable work needs an explicit checkpoint/ownership/recovery design; use the existing durability/draining guidance. [Handler source](https://github.com/a2aproject/a2a-go/blob/v2.6.0/a2asrv/handler.go).

## Proposed interoperability checks

Start with local deterministic peers, no LLM or external paid service. Exercise three pairs: TypeScript client → Python server, Python client → Go server, and Go client → TypeScript server. Record each pair separately. Use HTTP MCP and JSON-RPC A2A for the baseline. Add same-language probes to distinguish adapter bugs from application mistakes.

| Fixture | Required observation |
| --- | --- |
| MCP contract tool | Valid structured result; schema error; execution failure; unsupported version/capability and header mismatch |
| MCP continuation | Route round two to another process; tampered, expired, wrong-principal and replayed state cannot cause an extra effect |
| MCP cancellation | Interrupt before/after effect commit; cleanup occurs and unknown outcome is reconciled, without claiming rollback |
| MCP private cache | Alternate callers and tokens; no cross-principal response reuse |
| A2A lifecycle | New task, input-required continuation, artifact and terminal state; terminal task-ID follow-up is rejected; a deliberate new initial message can create a distinct task |
| A2A two observers | Disconnect one stream; the second still observes progress; reconnecting retrieves authoritative task state |
| A2A cancel race | Race completion and cancellation, including repeated cancellation; result remains a valid final state |
| A2A authorization | Another caller cannot get/list/cancel/subscribe to the task or modify its notification configuration |
| A2A notification/restart | Duplicate delivery causes one application transition; restart behavior matches the declared storage/recovery contract |

Gate MRTR/extension-specific cases on actual SDK support. Both TypeScript and Python explicitly exclude the tasks runtime from their passing conformance baseline. Go also excludes several optional OAuth client mechanisms, including client credentials and DPoP. A green upstream run can therefore contain expected failures. [TypeScript baseline](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.2.0/test/conformance/expected-failures.yaml), [Go baseline](https://github.com/modelcontextprotocol/go-sdk/blob/v1.8.0/conformance/baseline.yml). Test legacy migration separately from the current baseline and reject silent fallback when required semantics would disappear.

## Source conflicts and limits

A2A's protobuf HTTP annotation uses GET for `SubscribeToTask`, while specification prose says POST. All three pinned SDK servers accept both; the TypeScript client sends POST. Include both paths in REST compatibility tests and prefer JSON-RPC for the first portable example. [Normative proto](https://github.com/a2aproject/A2A/blob/v1.0.1/specification/a2a.proto), [TypeScript reconciliation](https://github.com/a2aproject/a2a-js/blob/v1.2.1/src/server/express/rest_handler.ts#L370), [Python routes](https://github.com/a2aproject/a2a-python/blob/v1.1.5/src/a2a/server/routes/rest_routes.py#L75), [Go routes](https://github.com/a2aproject/a2a-go/blob/v2.6.0/a2asrv/rest.go#L54).

Some guide snippets retain old enum spellings or incomplete envelopes. Verify against the pinned normative schema and actual SDK serializers; do not hand-copy a tutorial as a protocol fixture. Full sources were accessible, but inspection is not a passed interoperability run. Native adapter configuration, deployment security and persistent-store recovery must still be verified in their target environments.
