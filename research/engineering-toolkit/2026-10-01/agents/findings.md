# Agent-lane engineering findings — 2026-10-01

Five new article bodies were read across four publishers. The other two cards and their official transaction/CDC crosschecks are in [deepchecks.md](deepchecks.md); this file covers three cards. Metadata inventories do not count as article reads. No model runs or vendor examples were executed.

## Scaling Managed Agents: Decoupling the brain from the hands

Source: [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents), 2026-04-08.

**Read scope:** Complete main article, introduction through Conclusion and acknowledgements. Linked sources separately scoped; image pixels not inspected. No article code executed.

- **Trigger:** Long-running work needs independent compute replacement, customer execution environments, and recoverable context.
- **Failure constraint:** One container couples session survival, harness availability, tool compute and credentials; provisioning delays even tasks needing no sandbox.
- **Mechanism:** Separate an append-only session log, stateless orchestration and replaceable tool environments through stable interfaces; provision execution only when needed.
- **Limits:** Service-specific latency results; durable history does not establish exactly-once external effects or indefinite artifact retention.
- **Counterexample:** Analyst inference: replaying a logged tool request after an unrecorded successful remote effect can duplicate work.
- **Verification:** Proposed distinct harness/sandbox/stream interruptions, resume from durable state, reconcile ambiguous effects, and compare latency/retention; not executed.

**Suggested existing placement:** `skills/engineering/distributed-system-patterns/references/serving.md`, `skills/engineering/architecture/references/planning.md`, `skills/protocols/mcp-engineering/references/outcomes.md`.

## Harness design for long-running application development

Source: [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps), 2026-03-24.

**Read scope:** Complete main article and shown appendix, including frontend criteria, sprint contracts, both examples and component-ablation discussion. Embedded videos/images not played; code/examples not executed.

- **Trigger:** Choose orchestration and evaluation scaffolding for a model/task combination or reassess it after a model upgrade.
- **Failure constraint:** Self-grading misses real interactions; indiscriminate simplification obscures which harness component contributes.
- **Mechanism:** Calibrate an independent evaluator on concrete criteria, exercise the running product, and remove one harness component at a time on realistic tasks.
- **Limits:** Few internal examples with changed feature scope and long expensive runs; no controlled general productivity guarantee.
- **Counterexample:** A generator/evaluator pair sharing a blind spot can approve a nonworking core flow; more iterations need not improve human preference.
- **Verification:** Proposed fixed prompt/model/environment comparisons with behavior checks, trace review, human calibration, cost and latency; not executed.

**Suggested existing placement:** `skills/testing/failure-oriented-testing/SKILL.md`, `skills/engineering/architecture/references/planning.md`, `skills/quality/code-and-docs-cleanup/references/sources.md`.

## Serverless servers: Efficient serverless Node.js with in-function concurrency

Source: [Serverless servers: Efficient serverless Node.js with in-function concurrency](https://vercel.com/blog/serverless-servers-node-js-with-in-function-concurrency), 2024-10-03.

**Read scope:** Complete main article from introduction through Acknowledgements, including architecture, efficiency example, beta tradeoffs, case study and enabling instructions. Diagrams interpreted from accompanying text only; runtime not executed.

- **Trigger:** Interactive requests spend substantial time waiting on I/O while assigned compute sits idle.
- **Failure constraint:** Invocation-per-instance provisioning underutilizes compute; changing to shared execution changes process/global-state isolation.
- **Mechanism:** An invocation service reuses connected instances for concurrent requests, with a runtime controlling dispatch and response streaming.
- **Limits:** Benefits depend on traffic and I/O overlap; CPU-heavy work can worsen latency. Historical beta/cost claims are not current sizing guarantees.
- **Counterexample:** Analyst inference: shared request-specific globals leak across tenants; larger concurrency exhausts a database pool before CPU capacity.
- **Verification:** Proposed workload sweep measuring throughput, p99, CPU, memory, pool waits, downstream load and caller isolation; compare serial and concurrent execution. Not executed.

**Suggested existing placement:** `skills/engineering/distributed-system-patterns/references/serving.md`, `skills/engineering/concurrency-correctness/SKILL.md`, `skills/engineering/microservice-operations/SKILL.md`.

## Current contract checks

- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview): Server-side event history can be fetched; managed API remains beta and requires its documented header. Historical architecture interfaces are conceptual, not literal current SDK method names. Scope: Core concepts, How it works, Beta access. Retrieved 2026-10-01.

- [Session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming): Conversation history persists until deletion, but sandbox state is preserved only 30 days after sandbox creation; activity does not extend this window. Required outputs must leave ephemeral execution state before expiry. Scope: Resuming an idle session; custom-tool result correlation and session budget behavior inspected. Retrieved 2026-10-01.

- [Authenticate with vaults](https://platform.claude.com/docs/en/managed-agents/vaults): Vaults are workspace-scoped and referenced per session; credential placeholders can be substituted at egress, MCP credentials match server URL. Binding the correct caller/vault still requires application authorization. Scope: Vault scope, credential types, session references, lifecycle. Retrieved 2026-10-01.

- [Work with sessions](https://code.claude.com/docs/en/agent-sdk/sessions): SDK sessions persist conversation history, not the filesystem; forking history does not isolate shared file edits. Cross-host resume requires a session store/transcript transfer or explicit application artifacts. Scope: Conversation-versus-filesystem distinction, continue/resume/fork, cross-host resume. Retrieved 2026-10-01.

- [Fluid compute](https://vercel.com/docs/fluid-compute): Current Fluid compute defaults differ from the 2024 beta: enabled for new projects since 2025-04-23; optimized concurrency supports Node.js/Python, and concurrent invocations share process/global state. Runtime general support list is broader than concurrency support. Scope: Enabling, optimized concurrency, isolation/global state. Retrieved 2026-10-01.

## Ranked practice proposals

These placements began as research recommendations. The subsequent root-authorized ownership-transfer and A2A recovery-state adoption is recorded in [adoption.md](adoption.md); no new skill was created. Existing instructions already cover several mechanisms; add evidence and a targeted example when that improves the branch, rather than restating it.

1. **Preserve ownership through finalization and handoff.** Extend the existing ownership/delayed-work references with the Snowflake background-write case and an ambiguous-commit proof obligation. The current references already require sink enforcement, so a new skill would duplicate their trigger.
2. **Choose stores against representative operational workloads.** Place the Pinterest staged evaluation as an architecture-planning example: specify serving, maintenance, export, CDC and recovery acceptance together. Historical product comparisons are excluded.
3. **Separate histories, outputs and disposable execution.** Add an architecture/serving example with a durability matrix, restoration dependencies and retention evidence. General distributed-system patterns own this; protocol skills need only their effect/cancellation-specific links.
4. **Size concurrency at every resource boundary.** Extend serving guidance to distinguish instance count, per-instance active requests, CPU occupancy and downstream pool capacity. The concurrency skill can cover shared request state; broad resource sizing belongs with serving/operations.
5. **Revalidate scaffolding by controlled ablation.** Treat the harness article as evaluation-design evidence, with fixed scenarios and human calibration. Existing failure-oriented-testing/cleanup references are sufficient for this example.

**Possible genuinely new branch, pending user choice:** a vendor-neutral agent-system-design skill could combine orchestration state, context selection, tool authority and calibrated model evaluation when designing a custom agent runtime. It should be proposed only if recurring agent-runtime requests justify a distinct invocation; existing protocol, Temporal and architecture skills already handle the component mechanisms. One publisher’s managed-service architecture does not justify a vendor-specific skill.

## Limits

These are bounded first-party readings, not implementations or product conformance audits. Pinterest describes its 2022 selection, and Snowflake does not disclose the whole ambiguous-commit handoff protocol. Runtime crosschecks qualify transfer: persisted conversations are separate from files and external effects; snapshot isolation is separate from serializability; shared execution requires request-state separation.
