# Independent review: language ownership and protocol operations

Reviewed 2026-09-29 by the independent quality lane. **No actionable correctness or scope defect found** in the four research records or the ten reference candidates identified below. The reference changes are suitable for a source-and-wording freeze. This is not runtime acceptance or model-evaluation evidence.

Scope: read the cancellation-ownership and protocol-operations Markdown/JSON records; inspect their linked primary claims and version qualifications; compare proposed gaps with existing guidance; then review the actual Python, Go, TypeScript and MCP reference diffs and both new references. Root authorized this last implementation check during review. Only this review file was written. No model, runtime example, test fixture, gateway, or exploit was executed.

## Primary-source conclusions

| Area | Independent conclusion |
| --- | --- |
| Python grant ownership | The historical article distinguishes a successful grant from the task's eventual resumption. CPython 3.14.3 reserves capacity before resolving a waiter and refunds a granted reservation if cancellation interrupts acquisition. The research and new custom-adapter paragraph correctly avoid applying the historical conceptual counter invariant to today's private `_value`. Public scoped ownership and later capacity are appropriate outcomes to verify. [Article](https://neopythonic.blogspot.com/2022/10/reasoning-about-asynciosemaphore.html), [pinned implementation](https://github.com/python/cpython/blob/v3.14.3/Lib/asyncio/locks.py#L386-L448). |
| Python version boundary | The rolling 3.14 documentation currently identifies 3.14.7, separately from the 3.14.3 source inspection. Cancellation and cleanup can outlast a requested timeout; these sources do not guarantee termination of uncooperative work. The research preserves both limits. [Task documentation](https://docs.python.org/3.14/library/asyncio-task.html). |
| Go selection and ownership | The article supports cancellation propagation and coordinated channel closure, not a join guarantee from cancellation alone. Its fixed worker count does not make synchronous file reads cancellable. The specification gives cancellation no priority among ready communications and evaluates send operands before choosing a case. The new paragraph correctly limits `ctx.Err()` to already-known cancellation, without claiming an atomic effect fence. [Pipeline article](https://go.dev/blog/pipelines), [select specification](https://go.dev/ref/spec#Select_statements). |
| Go callback qualification | The separate `AfterFunc` observation matches Go 1.27.1: stopping a registration does not join a callback already running. Keeping this as conditional research rather than another generic join paragraph avoids duplication. [Pinned context source](https://github.com/golang/go/blob/go1.27.1/src/context/context.go#L309-L322). |
| Node pressure and completion | The historical backpressure article motivates producer feedback but supplies neither a universal buffer default nor a process memory bound. Node 25.9.0 describes `highWaterMark` as a threshold. Pipeline abort requests destruction and requires generator cooperation; aborting `finished` cancels observation, not the underlying stream. Pipeline errors can destroy an HTTP socket before an intended response. The new Node-only reference preserves these distinctions, observes completion/error/close, and reports unfinished cleanup instead of asserting a hard shutdown guarantee. [Backpressure article](https://nodejs.org/learn/modules/backpressuring-in-streams), [pinned API](https://nodejs.org/download/release/v25.9.0/docs/api/stream.html). |
| Node defaults | The research's platform-qualified defaults match the pinned source. Omitting numeric defaults from the new reference is appropriate because applications can override them. [Pinned default state](https://github.com/nodejs/node/blob/v25.9.0/lib/internal/streams/state.js#L11-L13). |
| MCP composed authority | The Invariant article demonstrates untrusted public issue content leading to private reads and public publication. It is a controlled historical demonstration, not a current-client benchmark. The new reference correctly treats source-to-destination authorization as application policy beyond separate valid read/write permissions; observed provenance, transformations, unknown provenance and actual destination visibility matter. It preserves explicitly authorized transfers. [Demonstration](https://invariantlabs.ai/blog/mcp-github-vulnerability). |
| MCP access path | Cloudflare describes both imperfect traffic detection and direct access that bypasses a required portal. The new reference conditions upstream denial on a mandatory-gateway deployment, requires trusted provenance, and limits telemetry claims to observable paths. This is distinct from the transport's `Origin` validation rule. [Engineering account](https://blog.cloudflare.com/mcp-security-updates/), [MCP 2026-07-28 transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http). |

Read scope for this independent check was the relevant main-article prose and in-page examples, plus the named runtime/source/specification sections. Linked external exploit traces, screenshots, downloadable Go programs, benchmarks, product deployment guides and unrelated SDK behavior were not independently reproduced or audited. Source metadata and the research records' declared limits agree; the records do not count proposed schedules as passing runs.

## Gap and implementation assessment

- Python and Go additions are narrow explanations of handoff and dispatch. Existing task ownership, joins, deadline/cleanup separation and uncertain business effects remain the governing guidance. Neither addition proposes replacing a standard semaphore or repairing distributed consistency with a cancellation check.
- The Node reference adds concrete stream contracts absent from the prior generic AbortSignal/lease guidance. Its conditional pointer and opening scope exclude Web Streams and other TypeScript runtimes. Failed-stream reuse and listener-cleanup details remain appropriate API-specific follow-up when such reuse is implemented; the candidate does not recommend reuse or claim universal teardown.
- MCP publication policy adds a meaningful composed-operation boundary. Required-gateway enforcement reuses an already-known service-security concern and adds MCP-specific entry conditions and observations. It does not impose a gateway on local integrations, confuse routing hints with trusted provenance, or turn an `Origin` check into access-path enforcement.
- No A2A change follows from these two MCP articles. The remaining forced-concurrency gap is an evaluation schedule concern, since the repository already requires controlled ordering and durable-state oracles.

The research JSON hashes are snapshots of the guidance examined when the reports were authored. Language ownership, MCP authorization, and the testing fault-history reference subsequently changed in other lanes. The language/MCP gap assessment was therefore rechecked against the actual current candidates below rather than treating the old hashes as a current freeze. No historical source record was rewritten.

## Non-blocking source-use caution

Cloudflare's illustrative current-version JSON-RPC request bodies omit the required request metadata. Future wire fixtures should use the pinned specification/schema rather than copy those illustrative envelopes. The inspected references contain no copied wire example and explicitly separate the article from protocol authority, so this requires no candidate correction. This caution was sent to the MCP author. [Article examples](https://blog.cloudflare.com/mcp-security-updates/), [normative request metadata](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#request-metadata).

## Mechanical checks and reviewed hashes

Both JSON records parsed. All local links in the ten candidate references resolved. `git diff --check` passed for the four affected reference directories. Python, Go, TypeScript and MCP `SKILL.md` entrypoints were byte-identical to HEAD `0cfcb17fd0c8aba7d420d899cd8d1fa1ecb92a11` during review. Checks were document parsing, path resolution, hashing and diff inspection only; no new behavioral acceptance result is asserted.

Paths below are relative to the repository root. SHA-256 values identify the reviewed bytes.

| Research record | SHA-256 |
| --- | --- |
| `docs/research/engineering-toolkit/extensions/cancellation-ownership.md` | `d0824a31eb14ec0a87d606a5c9530ec584e41ea1a2183607556dbae4a713b8e1` |
| `docs/research/engineering-toolkit/extensions/cancellation-ownership.json` | `5d3ad087bc6e201e0047d5946bfa7ea8551c1ed70f0741cd17ac5588f40f6a0c` |
| `docs/research/engineering-toolkit/extensions/protocol-operations.md` | `0f7b38b8d4e877c2b694e4aae27c19000c8f1a08cb36970723d013d0413cc101` |
| `docs/research/engineering-toolkit/extensions/protocol-operations.json` | `eab9f220161f4ee22ac4664c99423b20b7a26e47d0d9cffdda9de05f21a631be` |

| Reference candidate | SHA-256 |
| --- | --- |
| `skills/languages/python-backend/references/async-ownership.md` | `53faf3b084b93bebe73c3b33d06b346c594319fd056b9e84009930f8b74a083d` |
| `skills/languages/python-backend/references/sources.md` | `8e251bf259e6c5744aab9174dcfd98a20871d6880563ca9a225eb79531202bd3` |
| `skills/languages/go-backend/references/ownership.md` | `3437a7091e90d3eb47c4a2dff054357eed3879a8da5571ab0598033dc4d3e0c1` |
| `skills/languages/go-backend/references/sources.md` | `51f7fa10e87ba8c55ecaf1d0de6b502b4e352a3d65a1d8c76e9da532246c2eed` |
| `skills/languages/typescript-backend/references/async-ownership.md` | `00df3d1d751164cf5b9c116589fb743a2895f0aaf47aad24a57aa76fb66a386e` |
| `skills/languages/typescript-backend/references/node-streams.md` | `8fa91e3f5c79a98a1c09d6466707506b4cfb289ed466b684b6754f5a949b1283` |
| `skills/languages/typescript-backend/references/sources.md` | `802061e75cebb73c84c4b31300ec9faa644c77a91d2354b276b1b06cf75358ef` |
| `skills/protocols/mcp-engineering/references/tool-dataflow.md` | `884487d1b216267755796d167cd58da43e427dd3c6be3e10f9baece6add2be2e` |
| `skills/protocols/mcp-engineering/references/authorization-and-caching.md` | `833e835bc70d4cb94af229b7e1fd42204a35f33f4cd63a86a662e3c65c1b8cfa` |
| `skills/protocols/mcp-engineering/references/sources.md` | `c739504c67a87318316af95f5d5e96be44df6c1c38ebadbd9e472c8a40ceda9a` |
