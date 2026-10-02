# Runnable engineering contracts

Examples use synthetic local data. Their READMEs give pinned dependencies, exact
commands, cleanup behavior and the scope of each result. Run them explicitly;
the ordinary repository test suite does not start brokers or model sessions.

| Example | What it exercises | Environment |
| --- | --- | --- |
| [Backend](backend/README.md) | Equivalent Python, TypeScript and Go reservations: duplicates, conflicting intent, concurrency, native cancellation, real lost COMMIT reply | Docker/PostgreSQL and the selected language runtime |
| [Messaging](messaging/README.md) | Snapshot versus delta ordering, replay, database commit versus broker acknowledgement | Python; Docker/RabbitMQ for broker cases |
| [Cache](cache/README.md) | Two-process stale fills, revision metadata, atomic cache updates, acknowledged-write gap | Python and Docker/Redis |
| [Cache load protection](cache-load-protection/README.md) | Expiry timing, negative-cache creation races, Bloom readiness, lease fencing, SCAN, and shared-load cancellation | Python, SQLite and Docker/Redis; virtual-time cases labeled separately |
| [Retry coordination](retry-coordination/README.md) | Nested retry amplification, ownership propagation, partial adoption and uncertain effects | Python standard library; loopback HTTP plus explicitly labeled models |
| [Draining](draining/README.md) | Successive worker handoffs, fencing, effect/checkpoint interruption, retry accounting and deadlines | Python and Docker/PostgreSQL |
| [Worker rollout](worker-rollout/README.md) | Real SIGTERM, reserved ownership, mixed-version continuation, receipt recovery, paused-owner fencing and cleanup | Python, POSIX subprocesses and Docker/PostgreSQL |
| [Infrastructure](infrastructure/README.md) | Partial apply, recovery, stale saved plans, identity-preserving moves and retained removal | Python and pinned Terraform; no cloud provider |
| [Recovery](recovery/README.md) | Application identity, semantic restore checks, interrupted imports and lost accepted work | Python and Docker/PostgreSQL |
| [Quality](quality/README.md) | Behavior-preserving cleanup, independent oracles, seeded defects and replayable reduced histories | Python standard library |
| [MCP](protocols/mcp/README.md) | Pinned SDK peers, request boundaries, caller isolation, malformed inputs and cancellation | TypeScript, Python and Go |
| [A2A](protocols/a2a/README.md) | Pinned SDK peers, task observers, authorization, continuation, duplicate effects and cancellation | TypeScript, Python and Go |
| [Ownership boundaries](ownership-boundaries/README.md) | Semaphore grant/cancellation, Go send-operand evaluation, and Node observer cancellation versus owned teardown | Python, Go with race detector, and Node standard libraries |
| [SQLAlchemy gotchas](sqlalchemy-gotchas/README.md) | Shared-session rollback, task-owned ASGI fanout, database cancellation, independent snapshots, and query-oracle failure controls | Pinned Python, SQLAlchemy/FastAPI and Docker/PostgreSQL |

A passing negative control means the verifier observed the deliberately unsafe
behavior, or rejected it as the scenario requires; inspect the scenario status
and oracle. Reports distinguish these controls from corrected behavior. Source
hashes bind an observation to the implementation that ran. Historical failed
attempts remain historical after fixes.

Real adapters strengthen evidence for their particular contracts. They do not
establish production failover, a 24-hour job's duration, cloud recovery objectives,
OAuth conformance, or every protocol feature. Read the recorded limitations
before carrying a result into another environment.
