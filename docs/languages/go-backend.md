# Go backend

## What it does

Guides Go service changes where cancellation, goroutine ownership, cleanup, runtime input validation, or database transactions affect correctness. Ownership means each acquired resource and concurrent operation has a named lifetime owner and completion path. It preserves the accepted backend contract and makes owners and error paths explicit.

## When to reach for it

Use [go-backend](../../skills/languages/go-backend/SKILL.md) for Go services when resource lifetime, concurrent work, external input, or transaction outcomes are part of the change. Keep sequential work sequential unless the requested behavior calls for concurrency.

Invocation: automatic

## It's working if

- The request boundary, accepted input, effect, outcome, and resource owners are identified.
- The relevant ownership, runtime-validation, or transaction reference is applied where needed.
- Cancellation and concurrent work have observable completion paths, with capacity restored after failure.
- Database claims are checked against PostgreSQL when arbitration, rollback, or persistence is in scope.
- The report names checks actually run and the remaining boundary not exercised.

## Where it fits

This is the Go-specific service correctness guide. Use [python-backend](python-backend.md) or [typescript-backend](typescript-backend.md) for those runtimes. For a broader service boundary, consult `microservice-boundaries`; the domain reading path points to *Architecture Patterns with Python*, chapters 6–7, for unit-of-work and aggregate boundaries. The skill does not establish idempotency, consistency, or durability contracts by itself.

## Sources

Inspected source files:

| Source | Files inspected |
| --- | --- |
| [Chapter 12, `08720ea422a3c0f0076ed6efc11147687f47163d`](https://github.com/learning-go-book-2e/ch12/tree/08720ea422a3c0f0076ed6efc11147687f47163d/sample_code) | `backpressure/main.go`, `context_cancel/main.go`, `pipeline/ABProcessor.go`, `pipeline/CProcessor.go`, `pipeline/main.go`, `time_out/main.go` |
| [Chapter 14, `71878380fe1c02a872f55fdba65ed44ac7ef997b`](https://github.com/learning-go-book-2e/ch14/tree/71878380fe1c02a872f55fdba65ed44ac7ef997b/sample_code) | `cancel_http/main.go`, `nested_timers/main.go`, `own_cancellation/main.go` |
