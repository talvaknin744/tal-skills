# a2a-engineering

## What it does

Build or review interoperating A2A clients and servers, preserving protocol, caller and operation boundaries.

## When to reach for it

Use for Agent2Agent discovery, task continuation, streaming, cancellation or duplicate delivery. Ordinary local agent delegation stays outside this protocol boundary.

Invocation: automatic

## It's working if

- The report names the protocol revision, SDK versions, selected Agent Card contract and peer combinations that must interoperate.
- Each operation is authenticated and authorized; messages are validated before dispatch and continuations remain bound to caller-owned task context.
- The review traces acceptance through effect, receipt, artifact and terminal state, including restart, cancellation, duplicate delivery and stale workers.
- Checks exercise both peers at the transport boundary and report compatibility separately from simulation or conformance.

## Where it fits

Compose with idempotency for duplicate-safe effects, concurrency-correctness for shared state, or graceful-draining for worker handoff.

Canonical skill: [skills/engineering/a2a-engineering/SKILL.md](../../skills/engineering/a2a-engineering/SKILL.md).
