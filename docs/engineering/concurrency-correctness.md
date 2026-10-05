# concurrency-correctness

## What it does

Diagnose and prevent concurrent histories that violate a mutation invariant or freshness contract.

## When to reach for it

Use for lost updates, write skew, stale cache fills, replica read-your-writes and obsolete owners. Excludes broad decomposition and duplicate retries alone.

## It's working if

- Specify the operation, forbidden outcome and permitted intermediate states; state reader freshness separately from mutation correctness.
- Reconstruct actor-by-actor reads, writes, commits, acknowledgements, cache or replica paths and ownership changes using actual platform versions.
- Place the correction at the smallest authoritative boundary and explain why weaker coordination cannot prevent the history.
- Use controlled schedules and independent observations to demonstrate the invariant; report guarantees that remain unverified.

## Where it fits

Compose with idempotency when retry identity and duplicate effects dominate, or graceful-draining when ownership changes during shutdown.

Canonical skill: [skills/engineering/concurrency-correctness/SKILL.md](../../skills/engineering/concurrency-correctness/SKILL.md).
