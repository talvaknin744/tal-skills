# idempotency

## What it does

Make retries preserve one intended business outcome within an explicit identity and retention boundary.

## When to reach for it

Use for duplicate-safe APIs, webhooks and queue workers, including concurrent execution and uncertain effects. Generic retry tuning belongs to the relevant client or queue workflow; read-only requests need no effect-deduplication contract.

## It's working if

- The report names the harmful effect, logical operation identity and point where success becomes durable.
- The specification states caller scope, command equivalence, replay result and retention; stored results are revealed only after authorization.
- Execution ownership is acquired atomically before effects using datastore guarantees verified across workers.
- The recovery record distinguishes proven failure, active work and unknown outcomes at each durable boundary.
- Checks establish duplicate, conflict and recovery scenarios and state provider-specific guarantees and limits.

## Where it fits

Compose with concurrency-correctness for ownership races, graceful-draining for worker loss, or a2a-engineering for A2A duplicate delivery.

Canonical skill: [skills/engineering/idempotency/SKILL.md](../../skills/engineering/idempotency/SKILL.md).

## Sources

The starting reference is Dochia's [Idempotency Is Easy Until the Second Request Is Different](https://blog.dochia.dev/blog/idempotency/) (7 May 2026). This skill is independently written operational guidance; it does not bundle the article or its sample implementation.
