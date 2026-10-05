# idempotency

## What it does

Make retries preserve one intended business outcome within an explicit identity and retention boundary.

## When to reach for it

Use for duplicate-safe APIs, webhooks and queue workers, including concurrent execution and uncertain effects. Excludes generic retry tuning and read-only requests.

## It's working if

- Name the harmful effect, logical operation identity and point where success becomes durable.
- Specify caller scope, command equivalence, replay result and retention; authorize before revealing stored results.
- Acquire execution ownership atomically before effects, using actual datastore guarantees across workers.
- Reconcile interruptions at durable boundaries; distinguish proven failure, active work and unknown outcomes.
- Verify duplicate, conflict and recovery scenarios and state provider-specific guarantees and limits.

## Where it fits

Compose with concurrency-correctness for ownership races, graceful-draining for worker loss, or a2a-engineering for A2A duplicate delivery.

Canonical skill: [skills/engineering/idempotency/SKILL.md](../../skills/engineering/idempotency/SKILL.md).
