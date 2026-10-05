# Python backend

## What it does

Guides Python service changes where asynchronous cancellation, resource ownership, database transactions, or mutable request state can change observable backend behavior. It keeps local calculations small and effects owned.

## When to reach for it

Use [python-backend](../../skills/languages/python-backend/SKILL.md) when a Python handler or worker crosses async, database, or caller-owned state boundaries. Read the async-ownership or transaction-outcomes reference for the affected branch. It does not require a service framework for a pure local calculation.

## It's working if

- The supported Python and driver versions, entrypoint, transaction owner, and existing checks are identified.
- Accepted input, durable effect, and result or failure are stated before editing.
- Mutable defaults and caller-owned mutation are handled explicitly; valid zero and empty values remain valid.
- The relevant cancellation or interleaving is exercised, and persisted state is observed independently when claimed.
- The report states executed scenarios and limits, including cross-process guarantees left outside the change.

## Where it fits

This is the Python-specific service correctness guide. Use [go-backend](go-backend.md) or [typescript-backend](typescript-backend.md) for those runtimes. For SQLAlchemy work, follow the [SQLAlchemy session and query path](../reading-paths.md) to its conditional reference. The skill does not supply cross-process idempotency, replica consistency, durable handoff, or recovery contracts.
