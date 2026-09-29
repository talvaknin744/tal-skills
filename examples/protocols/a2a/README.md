# A2A lifecycle and boundary probes

Run deterministic peers with the real pinned A2A SDKs. The Python server advertises
its guarded JSON-RPC endpoint; a separate stock endpoint reproduces two observed
validation gaps. All listeners bind to loopback. No model, paid API, container,
cloud account, or production infrastructure is used.

## Run

From the repository root, with Node ≥20, Go ≥1.26, a C toolchain for Go's race
detector, and Python available:

```sh
python3 -m venv examples/protocols/a2a/.venv
examples/protocols/a2a/.venv/bin/pip install -r examples/protocols/a2a/python/requirements.lock.txt
npm ci --prefix examples/protocols/a2a/typescript --ignore-scripts
python3 examples/protocols/a2a/verify.py
```

The launcher compiles TypeScript, runs the Python/TS/Go probes, checks a real
server restart, and terminates and awaits every server it starts. It allocates
ports dynamically. The normal report is `.run/report.json` inside this example;
use `--report PATH` to retain another result. `--python PATH` selects an existing
virtual environment with the pinned requirements. Dependency installation is
explicit; the verifier does not install packages or acquire a model session.

The commands above target macOS/Linux. The published run records the exact tested
runtime versions. Other OS/runtime combinations remain unverified. Root `npm test`
does not discover these probes: `verify.py` explicitly launches the TypeScript
program and `go test -race` in this example's isolated Go module.

## What the report distinguishes

| Result | Evidence |
| --- | --- |
| TypeScript → Python | Compiled SDK client; discovery and actual wire version; artifact completion; input-required continuation; terminal rejection; duplicate message and operation identities; cancellation before/after simulated commit; two observers; active-task caller isolation; malformed envelopes; both guarded send methods |
| Go → Python | SDK discovery, completion, continuation, retrieval, cancellation, repeat cancellation, and final reconciliation |
| Go → Go | Real JSON-RPC/SSE handlers, observer independence, terminal rejection, duplicate messages, cancellation-first ordering, 30 scheduled completion/cancellation races, and the shared-store late-effect counterexample |
| Python ownership | Default per-user store behavior compared with an explicit tenant-plus-principal scope |
| Python restart | Completed task becomes unavailable after restarting the default memory-only store |
| Stock validation gaps | Empty Part and mismatched explicit task/context pair execute effects on Python 1.1.5; reported as `observed-unsafe-stock`, never as passed guards |
| Narrow guards | Both message methods reject those inputs before effects; valid context inference and foreign-caller rejection still work |

Exit zero means the declared observations matched the pinned fixture. It does not
mean the stock endpoint is safe, persistence is durable, or every protocol
requirement passed. Unexpected outcomes return nonzero and are retained in the
structured report. An SDK upgrade that fixes a stock gap changes the expected
observation and must be reviewed; avoid preserving a workaround blindly.

The final report includes source hashes, commands, runtime/package pins, and
separate peer results. [Published evidence](evidence/verified-run.json) is one
observed run, not a result automatically refreshed by cloning the repository.
[Development corrections](evidence/development-attempts.json) retain failures
encountered while packaging the probes.

## Read or adapt the code

- [Python server](python/server.py): fixed identity middleware, owner-scoped stores,
  stock/guarded handlers, deterministic execution gates, effect receipts, and
  ASGI shutdown. `GuardedHandler` demonstrates semantic and terminal-state checks and the tiny
  fixture command contract; it is not a complete A2A validator.
- [TypeScript verifier](typescript/verify.ts): exported SDK request codecs,
  typed client, bounded stream observation, raw boundary requests, and assertions
  against task state and counter effects separately.
- [Go verifier](go/verify_test.go): real local handlers and race detector tests.
  Its adverse shared-store case intentionally has no effect fence; the test
  observes the resulting late counter increment rather than recommending it.
- [Go cross-language client](go/cmd/crosslang/main.go): discovers and calls the
  Python peer using the pinned SDK.

## Scope and guarantees

Spec source is **A2A 1.0.1**, wire **1.0**. Direct dependency pins live in
`typescript/package.json`, `go/go.mod`, and `python/requirements.lock.txt`;
transitive versions are retained in their lock/sum files. The server's small
Agent Card is a fixture, not a signed production discovery document.

The literal `fixture-alice` and `fixture-bob` bearer values are synthetic identities
accepted only by this loopback test peer. They test identity propagation and owner
isolation, not token verification. The diagnostics routes intentionally expose
fixture counters to Alice. Production authentication, issuer/audience validation,
network policy, notification authorization, and payload limits need their own
implementation and verification.

Effects are counters; receipts and operation keys are memory-only. The operation-key
case is sequential and does not establish concurrent or crash-safe deduplication.
After an effect, the example cancellation callback publishes its saved receipt as
completed; that is application-defined reconciliation, not SDK rollback.
The guarded handler also preflights authorized terminal state before send, cancel,
or subscribe allocates V2 execution queues. This removed pending-dispatcher warnings
seen in earlier packaged runs. It is a narrow tested mitigation; concurrent state
changes still need validation, and a preflight read is not an ownership fence.
Repeated cancellation responses can differ by SDK and task state. Terminal
follow-up also differed in the research: stock Python returned `INVALID_PARAMS`,
Go `UnsupportedOperation`. The guarded endpoint uses the specification's
`UnsupportedOperationError`. Each rejects another execution under the completed
task ID.

The shared-store Go case uses two handlers in one process. It demonstrates that a
canceled Task does not itself fence another executor's effect. A production
solution needs resource-enforced ownership or an equivalent effect contract.
Saving a Task also does not preserve the executing stack, event routing, or
checkpoints. A deliberate restart demonstrates this default store's state loss.
REST/gRPC, real distributed recovery, OAuth, webhooks, full conformance, load,
and 24-hour operation are outside this run.
