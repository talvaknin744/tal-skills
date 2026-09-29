# Source record and limits

Reviewed 2026-09-29. This skill is original synthesis of the pinned specification,
SDK source, and executable local probes. No book or article text is reproduced.

- [A2A 1.0.1 specification](https://a2a-protocol.org/v1.0.1/specification/): read
  versioning, identity, Part semantics, task lifecycle, authorization, cancellation,
  idempotency, and streaming. Source tag resolves to
  `3303592588e388e62e0f69f701af531d2f4e3991`; wire compatibility uses `1.0`.
- [TypeScript SDK 1.2.1](https://github.com/a2aproject/a2a-js/tree/v1.2.1): installed
  package types/codecs and JSON-RPC client executed; source tag
  `11cbb295a7933ecb459d4e2af0740bf4570e71b2`.
- [Python SDK 1.1.5](https://github.com/a2aproject/a2a-python/tree/v1.1.5): default
  handler, active-task registry, owner resolver, routes, and in-memory task store
  inspected; JSON-RPC server executed; source tag
  `9f0f00cb0417cb59958d3186d81651be7d9b9d59`.
- [Go SDK 2.6.0](https://github.com/a2aproject/a2a-go/tree/v2.6.0): executor,
  handler, local task manager, client, and upstream cancellation tests inspected;
  separate authored probes executed with the race detector; source tag
  `ebf17c56ef7e63c72883a45454a538bbc0df66b8`.
- Matt Pocock's [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents)
  informs precise activation, conditional references, and observable completion.

Research ran ten TS-SDK → Python scenarios, a strict TypeScript compile/run,
five Go → Go tests with thirty race subtests, and seven Go → Python checks.
Additional probes retained two unsafe stock-Python acceptance cases and verified
narrow pre-effect guards. A deliberate restart lost default in-memory task state.
Those observations are version-specific; preserve the negative fixtures when
upgrading and assess changed behavior rather than carrying a workaround blindly.

The public repository contains explicit runnable probes under
`examples/protocols/a2a`, separately from this independently installable skill.
They use deterministic executors and synthetic local identity. They establish
neither full A2A conformance nor real OAuth, webhook, distributed ownership,
durable deduplication, production recovery, or long-duration reliability.
SDK source tags and installed package versions were verified separately; no
bit-for-bit package-to-repository attestation was performed.
