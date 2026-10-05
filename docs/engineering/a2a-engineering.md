# a2a-engineering

## What it does

Build or review interoperating A2A clients and servers, preserving protocol, caller and operation boundaries.

## When to reach for it

Use for Agent2Agent discovery, task continuation, streaming, cancellation or duplicate delivery. Ordinary local agent delegation stays outside this protocol boundary.

## It's working if

- Name the protocol revision, SDK versions, selected Agent Card contract and peer combinations that must interoperate.
- Authenticate and authorize each operation; validate messages before dispatch and bind continuations to caller-owned task context.
- Trace acceptance through effect, receipt, artifact and terminal state, including restart, cancellation, duplicate delivery and stale workers.
- Exercise both peers at the transport boundary and report compatibility separately from simulation or conformance.

## Where it fits

Compose with idempotency for duplicate-safe effects, concurrency-correctness for shared state, or graceful-draining for worker handoff.

Canonical skill: [skills/engineering/a2a-engineering/SKILL.md](../../skills/engineering/a2a-engineering/SKILL.md).
