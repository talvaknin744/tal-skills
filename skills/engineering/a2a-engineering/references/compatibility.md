# Compatibility and concrete APIs

Use this when selecting a peer interface, changing SDK versions, or porting a
snippet. Verified baseline: 2026-09-29. Read the target project's lockfiles first.

| Component | Pin | Verified entrypoints |
| --- | --- | --- |
| A2A specification | 1.0.1, commit `3303592588e388e62e0f69f701af531d2f4e3991` | JSON-RPC wire version `1.0` |
| TypeScript | `@a2a-js/sdk@1.2.1` | `ClientFactory`, `JsonRpcTransportFactory`, exported request codecs |
| Python | `a2a-sdk[http-server]==1.1.5` | `create_jsonrpc_routes`, `create_agent_card_routes`, `DefaultRequestHandler`, `AgentExecutor.execute/cancel` |
| Go | `github.com/a2aproject/a2a-go/v2@v2.6.0` | `a2asrv.NewHandler`, `NewJSONRPCHandler`, `a2aclient.NewFromCard`; Go ≥1.26 |

The spec patch identifies source; negotiation uses major/minor. Select an
advertised transport and supported capabilities. An SDK advertising version 1.0
does not establish conformance to every requirement in the pinned patch. Keep
legacy conversion explicit and test information loss before using it.
[Version contract](https://a2a-protocol.org/v1.0.1/specification/#36-versioning)

TypeScript's protobuf-derived SDK objects differ from wire JSON. `Role` and
`TaskState` are numeric enums; a Part uses `content: {$case: "text", value: ...}`.
`SendMessageRequest.fromJSON(...)` accepts the wire-shaped representation and
supplies defaults; it does not establish domain validity. `ListTasksRequest`
also needs its SDK defaults. Read stream events through `event.payload.$case`
and `event.payload.value`. Compile against the exact installed package and
inspect a real request rather than copying pre-1.0 examples.
[TypeScript SDK](https://github.com/a2aproject/a2a-js/blob/v1.2.1/README.md)

Python's exported `DefaultRequestHandler` is V2. Construct it with an executor,
task store, and Agent Card; close it with `await handler.aclose()` during ASGI
shutdown. Its accepted `queue_manager` parameter is ignored in this version;
active task streaming remains process-local. Older `a2a.server.apps` imports are
not the API used by this baseline.
[Handler implementation](https://github.com/a2aproject/a2a-python/blob/v1.1.5/src/a2a/server/request_handlers/default_request_handler_v2.py)

Go executors return `iter.Seq2[a2a.Event, error]` from `Execute` and `Cancel`.
The module requires Go 1.26 even though its README describes an older minimum.
[Executor](https://github.com/a2aproject/a2a-go/blob/v2.6.0/a2asrv/agentexec.go),
[module](https://github.com/a2aproject/a2a-go/blob/v2.6.0/go.mod)

The repository probes execute TS → Python, Go → Python, and Go → Go over
JSON-RPC/SSE. REST and gRPC need their own evidence. In this spec, the REST
`SubscribeToTask` prose and protobuf HTTP annotation disagree on POST versus GET;
verify the selected peer's routes when implementing REST.
[Normative proto](https://github.com/a2aproject/A2A/blob/v1.0.1/specification/a2a.proto)

Terminal-followup rejection also differs in these SDKs: the stock Python 1.1.5
probe returned `INVALID_PARAMS`; Go 2.6.0 returned `UnsupportedOperation`. The
application-authored guard uses the specification's `UnsupportedOperationError`. Record the
actual error classification while checking the common invariant: no new execution
under the terminal task ID. This is another reason interoperability is narrower
than a full conformance claim.

The packaged probes also exposed pending event-dispatcher warnings on some Python
terminal rejection paths. The example checks caller-scoped terminal state before
send, cancel, or subscribe reaches the V2 registry, and closes handlers explicitly.
Those preflights removed the warnings in its bounded run. Source inspection points
to queue allocation before failed task startup; this is a diagnostic inference,
not proof that every cleanup race is fixed. Keep concurrent state transitions and
shutdown checks when adapting the code; a preflight read is not an ownership fence.
