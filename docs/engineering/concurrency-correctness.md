# concurrency-correctness

## What it does

Diagnose and prevent concurrent histories that violate a mutation invariant or freshness contract.

## When to reach for it

Use for lost updates, write skew, stale cache fills, replica freshness and obsolete owners. Broad decomposition and duplicate retries alone stay outside this boundary.

## It's working if

- The specification states the operation, forbidden outcome and permitted intermediate states, with reader freshness separate from mutation correctness.
- The reconstructed history records actor-by-actor reads, writes, commits, acknowledgements, cache or replica paths and ownership changes using actual platform versions.
- The correction sits the correction at the smallest authoritative boundary and explain why weaker coordination cannot prevent the history.
- Controlled schedules and independent observations demonstrate the invariant; remaining unverified guarantees are reported.

## Where it fits

Compose with idempotency when retry identity and duplicate effects dominate, or graceful-draining when ownership changes during shutdown.

Canonical skill: [skills/engineering/concurrency-correctness/SKILL.md](../../skills/engineering/concurrency-correctness/SKILL.md).
