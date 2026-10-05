# Go backend

## What it does

Guides Go service changes where cancellation, goroutine ownership, cleanup, runtime input validation, or database transactions affect correctness. It preserves the accepted backend contract and makes owners and error paths explicit.

## When to reach for it

Use [go-backend](../../skills/languages/go-backend/SKILL.md) for Go services when resource lifetime, concurrent work, external input, or transaction outcomes are part of the change. Keep sequential work sequential unless the requested behavior calls for concurrency.

## It's working if

- The request boundary, accepted input, effect, outcome, and resource owners are identified.
- The relevant ownership, runtime-validation, or transaction reference is applied where needed.
- Cancellation and concurrent work have observable completion paths, with capacity restored after failure.
- Database claims are checked against PostgreSQL when arbitration, rollback, or persistence is in scope.
- The report names checks actually run and the remaining boundary not exercised.

## Where it fits

This is the Go-specific service correctness guide. Use [python-backend](python-backend.md) or [typescript-backend](typescript-backend.md) for those runtimes. For a broader service boundary, consult `microservice-boundaries`; the domain reading path points to *Architecture Patterns with Python*, chapters 6–7, for unit-of-work and aggregate boundaries. The skill does not establish idempotency, consistency, or durability contracts by itself.
