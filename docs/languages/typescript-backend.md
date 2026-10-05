# TypeScript backend

## What it does

Guides TypeScript service changes where runtime validation, asynchronous resource ownership, cancellation, or transaction boundaries affect correctness. It checks that runtime behavior matches the typed interface and failure contract.

## When to reach for it

Use [typescript-backend](../../skills/languages/typescript-backend/SKILL.md) for backend handlers and workers when external values or asynchronous effects cross a correctness boundary. It is not for browser UI styling or type-only library changes. Consult runtime-boundaries or asynchronous-ownership guidance when applicable.

## It's working if

- The handler, dependency versions, compiler settings, and checks are identified.
- External input, business invariant, effect boundary, and asynchronous resource owner are explicit.
- Success, rejection, cancellation, and uncertain-outcome cases relevant to the change are covered.
- Runtime validation and typechecking are distinguished from executable dependency behavior.
- The report names checks run and remaining limits, including cleanup after cancellation.

## Where it fits

This is the TypeScript-specific service correctness guide. Use [go-backend](go-backend.md) or [python-backend](python-backend.md) for those runtimes. For wider service boundaries, follow the backend ownership path in [domain reading paths](../reading-paths.md). The skill uses existing runtime libraries and does not make type annotations a substitute for validating external data.
