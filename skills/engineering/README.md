# Engineering skills

Promoted, self-contained skills for this concern.

## User-invoked

- [architecture](./architecture/SKILL.md): Plan architecture decisions, migrations, technology choices, or system reviews; use for consequential design questions, with code-and-docs-cleanup for implementation cleanup.

## Model-invoked

- [a2a-engineering](./a2a-engineering/SKILL.md): Build or review Agent2Agent clients and servers for discovery, continuation, streaming, or cancellation; use for protocol work, with graceful-draining for deployment handoff.
- [background-maintenance](./background-maintenance/SKILL.md): Design or review compaction, reclamation, rebalancing, backfills, or index work; use for foreground resource pressure, with capacity-planning for broad sizing.
- [code-and-docs-cleanup](./code-and-docs-cleanup/SKILL.md): Clean up code or documentation through refactoring, unused-code removal, or stale-instruction repair; use for evidenced preservation, with failure-oriented-testing for adverse schedules.
- [concurrency-correctness](./concurrency-correctness/SKILL.md): Diagnose, design, or fix races involving lost updates, write skew, stale cache fills, or obsolete owners; use for violated contracts, with failure-oriented-testing for schedule design.
- [distributed-system-patterns](./distributed-system-patterns/SKILL.md): Choose distributed topologies for measured serving, partitioning, ownership or batch constraints. Use when scale or completion requirements drive the design; exclude broad readiness reviews and isolated retry changes.
- [failure-oriented-testing](./failure-oriented-testing/SKILL.md): Design tests for injected faults, adversarial schedules, generated inputs or recovery. Use when a suspected failure needs an independent oracle and reproducible evidence; exclude settled low-risk edits with meaningful tests.
- [graceful-draining](./graceful-draining/SKILL.md): Design, implement or review worker shutdown and job handoff during deployment, scale-down or maintenance. Use when interruption threatens resumable work or ownership; exclude routine shutdown without resumable jobs.
- [idempotency](./idempotency/SKILL.md): Make API, webhook and worker retries duplicate-safe. Use for idempotency keys, concurrent duplicates and uncertain business effects. For retry timing, use overload-control.
- [infrastructure-change-safety](./infrastructure-change-safety/SKILL.md): Plan, implement, or review infrastructure changes when resource replacement, Terraform state ownership, mixed-version rollout, or partial apply can interrupt service or lose data.
- [legacy-code-changes](./legacy-code-changes/SKILL.md): Change untested legacy code using characterization tests and minimal dependency isolation. Use when missing coverage or hidden collaborators obstruct a requested change; exclude greenfield work and focused, well-covered edits.
- [mcp-engineering](./mcp-engineering/SKILL.md): Implement or review MCP servers and clients where protocol versions, tool contracts, caller authorization, private caching, or cancellation affect correctness. Use for MCP integrations; exclude merely calling an available tool.
- [messaging-reliability](./messaging-reliability/SKILL.md): Diagnose or implement broker consumers, acknowledgements, retries, quarantine, replay, and schema evolution. Use for lost, duplicate, or out-of-order effects and unsafe checkpoints; exclude in-process collection transformations.
- [microservice-boundaries](./microservice-boundaries/SKILL.md): Choose or review microservice boundaries, assess a proposed split, or diagnose distributed-monolith coupling. Use for business capability decomposition and service ownership; exclude routine module refactoring and general architecture reviews.
- [microservice-data](./microservice-data/SKILL.md): Design or review service data ownership, cross-service invariants, sagas, or reporting projections. Use for shared-table splits and cross-service transactions or joins; exclude single-database tuning and retry deduplication.
- [microservice-extraction](./microservice-extraction/SKILL.md): Plan, review, or implement incremental monolith extraction. Use for migration seams, code/data separation, coexistence, and cutover recovery; exclude choosing boundaries from scratch and ordinary deployments.
- [microservice-integration](./microservice-integration/SKILL.md): Design service-to-service calls, APIs, events, or BFF aggregation. Use for contract evolution, consumer coupling, or chatty calls; exclude generic architecture reviews and retry deduplication.
- [microservice-operations](./microservice-operations/SKILL.md): Assess or improve cross-service reliability, observability, deployment, recovery, capacity, or trust boundaries. Use for cascading failures and service readiness; exclude generic CI and single-process troubleshooting.
- [microservice-testing](./microservice-testing/SKILL.md): Design or review tests across independently deployed services. Use for consumer contracts, service isolation, or release-coupling end-to-end suites; exclude ordinary unit tests within one application.
- [recovery-validation](./recovery-validation/SKILL.md): Validate restore and disaster-recovery claims with rehearsals, measured data loss, time to application usability, and business invariants. Use for drills, failed restores, and RPO/RTO evidence; exclude backup scheduling alone.
- [stream-processing-design](./stream-processing-design/SKILL.md): Design continuous stream computations. Use for event-time windows, late data, corrections, temporal joins, finality, or retained state; exclude broker acknowledgement repair and bounded in-process edits.
- [technical-deprecation](./technical-deprecation/SKILL.md): Retire supported libraries, APIs, configuration, or internal tools when consumers must migrate. Use for replacement readiness and removal gates; exclude private helper cleanup, worker draining, and product shutdown.
