# A2A feasibility: executable research

Research date: 2026-09-29. Target skill: **`a2a-engineering`**. These probes used
deterministic local executors, with no model, paid service, or production changes.
The [result ledger](a2a-feasibility.json) records commands, exact dependency
versions, observations, failures, source links, and scratch-artifact hashes.

## What actually ran

The specification pin is A2A **1.0.1**, commit
`3303592588e388e62e0f69f701af531d2f4e3991`, independently checked with
`git ls-remote`. SDK clients used wire version **`1.0`**; raw boundary probes
also tried `1.0.1`, `9.9`, and an absent version header. The patch identifies the
research reference; these tests do not establish full specification conformance.
[Versioning rules](https://a2a-protocol.org/v1.0.1/specification/#36-versioning)

| Client and server | Executed coverage | Result |
|---|---|---|
| TypeScript SDK 1.2.1 → Python SDK 1.1.5 | Ten JSON-RPC/SSE scenarios: discovery, lifecycle, continuation, duplicate messages, local operation deduplication, cancellation, observers, caller isolation, authentication, malformed enum | Ten scenario assertions passed. Two additional semantic validation failures below remain open in the stock handler. |
| Compiled TypeScript 5.9.3 → Python SDK 1.1.5 | Strictly compiled client, SDK request codec, completed task and artifact | Compilation and execution passed. |
| Go SDK 2.6.0 → Go SDK 2.6.0 | Five tests plus 30 race subtests, including two observers and two handlers sharing a store | Passed with `go test -race`; no race-detector report. |
| Go SDK 2.6.0 → Python SDK 1.1.5 | Seven checks: discovery, immediate result, input continuation, retrieval, cancellation and reconciliation | Passed. |

Runtime versions were Node 25.9.0, Python 3.14.3, and Go 1.27.1 on macOS arm64.
Go SDK 2.6.0 requires Go 1.26; its minimum runtime was not separately tested.
The larger TypeScript-SDK scenario harness is JavaScript; the separate TypeScript
smoke proves the typed API compiles. Python used `a2a-sdk[http-server]==1.1.5`;
the complete resolved dependency set is retained in the ledger and scratch freeze
file. All network traffic during tests stayed on loopback.

## Findings to carry into the skill

### Validate semantics before running an effect

The stock Python 1.1.5 handler accepted `parts: [{}]`, invoked the executor, and
returned a completed task with an effect receipt. This failed the intended
boundary: the specification requires exactly one content member in each part.
The same handler correctly rejected an unknown role, absent required message ID
or role, and two content members in one part. Parsing success therefore did not
establish the complete message contract.
[Part contract](https://a2a-protocol.org/v1.0.1/specification/#416-part)

A research-only handler override checked `Part.WhichOneof("content")` before
delegating. Both `SendMessage` and `SendStreamingMessage` then rejected the empty
part with `INVALID_PARAMS`, and the executor effect counter did not change.
A second stock-handler negative case sent a valid task ID with a conflicting
explicit context ID. The handler accepted the continuation and ran its effect.
The contract requires these IDs to agree. An omitted context ID correctly
inherited the existing context. The mitigation now looks up the caller-authorized
task and checks an explicit context before either message method dispatches;
mismatches were rejected without effects, foreign callers still received
`TASK_NOT_FOUND`, and task-only continuations still completed.
[Message contract](https://a2a-protocol.org/v1.0.1/specification/#414-message)

These checks verify narrow mitigations, not a replacement conformance validator.
Keep both stock-handler negative cases visible in evaluations.

### Cancellation needs outcome reconciliation and an effect boundary

Before the fixture's effect gate, cancellation left the task canceled, the effect
count at zero, and executor cleanup observed. After the simulated effect had
committed, the fixture's cancellation callback recovered its receipt, published
the artifact, and returned completed. This was application logic, not automatic
SDK rollback or recovery.

Repeated cancellation was response-sensitive: a Python task parked in
`INPUT_REQUIRED` returned canceled again; an already canceled active-worker path
returned `TASK_NOT_CANCELABLE`. The Go handler returned canceled twice. Every
passing path reconciled the final task through `GetTask`. Idempotent effect does
not require every response to be identical; the specification lists terminal
states among cancellation errors.
[Cancellation and idempotency](https://a2a-protocol.org/v1.0.1/specification/#315-cancel-task)

The strongest adverse fixture used two Go HTTP handlers with a shared in-memory
task store. Handler B acknowledged canceled while handler A's execution context
was still live. Releasing A allowed an intentionally unfenced counter effect;
the stored task remained canceled. This is evidence that a task-state update
does not fence an external effect. It was one process with two handlers and a
counter, not a real distributed deployment or a database transaction.

Thirty simultaneously released Go completion/cancellation races all completed
first and rejected cancellation. A separate deterministic cancellation-first test
covered the other ordering. Do not describe the 30 schedules as observing both
winners or proving all interleavings safe.

### Separate observation, execution, and persistence

Disconnecting one observer left work running and the second observer received
the artifact and completion. `GetTask` reconciled the result. This passed for
Python subscriptions and for an initial Go `SendStreamingMessage` stream with a
second subscription. It establishes those paths only; no event-replay guarantee
was tested.

Python's exported `DefaultRequestHandler` is `DefaultRequestHandlerV2`. Its
`queue_manager` argument is accepted but ignored; active streaming is managed in
process memory. Supplying a persistent task store therefore does not establish
multi-replica event routing or recoverable executor progress. A deliberate restart
of the default in-memory server changed a previously completed task lookup to
`TASK_NOT_FOUND`. [Default handler source](https://github.com/a2aproject/a2a-python/blob/v1.1.5/src/a2a/server/request_handlers/default_request_handler_v2.py)

The fresh lifecycle run and subsequent validation probes used `await handler.aclose()` in its ASGI lifespan and
produced no pending-task warning after their corrected scenarios and termination.
Earlier incomplete development fixtures produced cleanup and telemetry warnings;
they were not reproduced in that final run and are not claimed as SDK defects.
This is bounded cleanup evidence, not a general shutdown guarantee.

### Bind authority independently of task IDs

With local fixture identities mapped into `ServerCallContext.user`, Bob could not
read, cancel, or subscribe to Alice's active task and saw an empty task list.
Missing or invalid fixture credentials were rejected by our ASGI gate. This
tests propagation and owner isolation, not real token verification.

Python's default owner resolver uses only `user_name`; its Starlette adapter maps
that value from `display_name`. The application must supply a stable verified
principal identity, including its issuer where identities can collide. A direct
store probe showed
that the same principal could access its record under two tenant values; an
explicit tenant-plus-principal resolver isolated them. That is a scope decision,
not a violation of the default resolver's per-user policy. The application must
verify tenant authority before constructing such a key. Push-notification
authorization was not exercised.
[Owner resolver](https://github.com/a2aproject/a2a-python/blob/v1.1.5/src/a2a/server/owner_resolver.py),
[request identity adapter](https://github.com/a2aproject/a2a-python/blob/v1.1.5/src/a2a/server/routes/common.py)

### Message identity does not establish effect idempotency

Both handlers rejected continuation using a terminal task ID before another
execution. Starting another task requires an explicit new initial message; the
handler does not transparently restart a completed task.

Both stock Python and Go handlers accepted the same initial message ID twice,
producing distinct tasks and two executions. Python additionally recorded two
simulated effects. The Python fixture's explicit
principal-scoped operation key reduced two task executions to one counter effect.
That check was sequential and in memory. Durable operation records, concurrent
duplicate protection, payload mismatch detection, and crash recovery still need
their own implementation and tests.

## Concrete API choices

Use the installed SDK's exported codecs and types. TypeScript 1.2.1 represents
roles/states as numeric enums and parts as a `content` union with `$case` and
`value`; its wire JSON uses enum names and direct `text` fields. A hand-written
JavaScript request initially lost text during serialization. The successful typed
client used `SendMessageRequest.fromJSON(...)`; `ListTasksRequest.fromJSON({})`
also supplied required SDK defaults. These codecs normalize data; they do not
perform the application's validation or authorization.

The verified client entrypoint is `ClientFactory` with `JsonRpcTransportFactory`;
stream events are inspected through `event.payload`. Python serves
`create_jsonrpc_routes(...)` and `create_agent_card_routes(...)` with the default
handler and an `AgentExecutor` implementing `execute` and `cancel`. Go's executor
returns `iter.Seq2[a2a.Event, error]` from `Execute` and `Cancel`. Exact signatures
and successful commands are in the ledger. Avoid importing old Python
`a2a.server.apps` examples into this version.
[TypeScript SDK](https://github.com/a2aproject/a2a-js/blob/v1.2.1/README.md),
[Python SDK](https://github.com/a2aproject/a2a-python/blob/v1.1.5/README.md),
[Go executor](https://github.com/a2aproject/a2a-go/blob/v2.6.0/a2asrv/agentexec.go)

## Remaining validation

The implementation should preserve these cases and add the untested matrix:
Python client and TypeScript server, REST/gRPC, legacy migration, real identity
verification, signed discovery, webhook replay, durable storage and recovery,
independent-process ownership, and real effect fencing. Full upstream conformance,
load testing, and a production security claim remain out of scope for this probe.
Scratch fixtures are evidence and starting points; they are not deployable agents.
