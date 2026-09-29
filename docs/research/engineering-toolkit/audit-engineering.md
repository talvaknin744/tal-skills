# Existing engineering skill audit

Reviewed 2026-09-29 against commit `7279a6654487d9a5f09d4a21d117dfa841c7130d`.
All **15 engineering skills** were inspected: their entrypoints, every Markdown
reference branch, native skill UI metadata, and the architecture JSON contracts
(**87 files**). The machine-readable inventory and recommendations are in
[audit-engineering.json](audit-engineering.json).

The result is **14 keep, one clarify, zero material fixes**. The existing skills
already distinguish mechanisms from guarantees, honor requested task scope, and
require observable evidence. Rewriting them into broader specialist personas
would lose useful boundaries. Preserve the public names and installable packages;
add orchestration above them.

## Actionable clarification

**Low priority — classify timeouts using dispatch evidence.**
`skills/engineering/microservice-operations/references/failure-handling.md:5`
includes queue/pool acquisition in the timeout budget, then says every timeout
means an unknown result. That is too broad for a first attempt demonstrably
stopped before dispatch. HTTPX, for example, distinguishes a pool timeout while
acquiring a connection from a response read timeout. This distinction can prevent
unnecessary uncertainty handling without weakening duplicate safety.
[HTTPX timeout semantics](https://www.python-httpx.org/advanced/timeouts/#fine-tuning-the-configuration)

Qualify that sentence: preserve uncertainty when execution may have begun;
recognize a proven pre-effect failure only when the dispatch history supports it.
A later pool timeout cannot clear uncertainty from an earlier attempt. Verify
three histories: no connection acquired and zero dispatches; provider commit
followed by a lost response; an earlier uncertain attempt followed by a pool
timeout. Retain the existing end-to-end budget and logical operation identity.
This is a wording correction to an overgeneralized claim, not a recommendation
to retry every connection exception.

## Inventory and routing boundaries

| Existing skill | Verdict | Boundary to preserve in the expansion |
| --- | --- | --- |
| architecture | Keep | System-level decisions and reviews; select specialists only for material risks |
| concurrency-correctness | Keep | Harmful actor histories, atomicity, freshness, and obsolete owners |
| distributed-system-patterns | Keep | Topology, placement, sharding, fan-out, and batch completeness |
| enterprise-application-patterns | Keep | Domain logic, persistence responsibilities, and application transactions |
| graceful-draining | Keep | Admission shutdown, durable job progress, and ownership transfer |
| idempotency | Keep | One operation's identity, arbitration, replay, and uncertain effects |
| legacy-code-changes | Keep | Characterization and the smallest necessary test seam |
| microservice-boundaries | Keep | Capability, state, and team ownership across service seams |
| microservice-data | Keep | Cross-owner invariants, sagas, compensation, and read projections |
| microservice-extraction | Keep | Staged code/data handoff, coexistence, and retirement |
| microservice-integration | Keep | Interaction choice and consumer-facing contract compatibility |
| microservice-operations | Clarify | Cross-service operating claims and bounded failure propagation |
| microservice-testing | Keep | Consumer contracts, service isolation, and credible test boundaries |
| object-design-patterns | Keep | Concrete variation and collaboration contracts; retain simple alternatives |
| pragmatic-programming | Keep | Knowledge ownership, change locality, and focused experiments |

The new messaging skill should own broker lifecycle, durable delivery, event
evolution, and recovery schedules after messaging is selected. It should compose
idempotency, concurrency, or microservice-data for their particular invariants.
The new failure-testing skill should specialize in controlled schedules and
fault evidence; it should reuse the existing service-level test strategy.
Cleanup should select legacy characterization when behavior is unobserved and
preserve deliberate domain duplication. Language agents should use native
framework capabilities before introducing architecture abstractions.

These are routing requirements for the new agents and workflows. They do not
require existing packages to depend on sibling installations. Existing
`agents/openai.yaml` files describe skill UI; they are not the new native
specialist-agent definitions.

## Primary-source crosschecks

The following high-impact claims survived verification and should remain intact:

- A Kubernetes PDB does not constrain a workload controller's rolling upgrade.
  [Kubernetes disruption documentation](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/#pod-disruption-budgets)
- Celery 5.6 maintains broker heartbeats during prefork warm shutdown, unlike the
  preceding behavior. [Celery worker shutdown](https://docs.celeryq.dev/en/stable/userguide/workers.html#worker-shutdown)
- SQS visibility extension does not reset the 12-hour ceiling measured from
  receipt of the `ReceiveMessage` request.
  [SQS processing duration](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/best-practices-processing-messages-timely-manner.html)
- RabbitMQ consumer cancellation leaves previously dispatched deliveries in
  flight. [RabbitMQ cancellation](https://www.rabbitmq.com/docs/consumers#cancelling)
- PostgreSQL Repeatable Read snapshot timing matters when combining locks with
  decision reads; a serialization retry must rerun the complete transaction and
  its decision logic. [Application consistency](https://www.postgresql.org/docs/current/applevel-consistency.html),
  [transaction retries](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html)
- Redis transaction execution errors do not roll back already executed commands.
  [Redis transaction error handling](https://redis.io/docs/latest/develop/using-commands/transactions/#errors-inside-a-transaction)
- Stripe's stored-result, pre-execution rejection, and key-retention behavior are
  provider-specific; an expired key can identify a new request.
  [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- HTTP 425 addresses HTTP early-data replay risk, rather than a generic busy
  worker. [RFC 8470 §5.2](https://www.rfc-editor.org/rfc/rfc8470.html#section-5.2)
- etcd's potentially stale `serializable` read option and watch stream do not
  inherit all default KV guarantees.
  [etcd 3.5 API guarantees](https://etcd.io/docs/v3.5/learning/api_guarantees/)

## Evidence and limits

`npm run check` passed for all 30 existing skills, including this 15-skill subset.
This verifies package shape and local references, not production correctness.
No missing local resource or escaping mandatory reference was found. Entry points
have explicit triggers and conditional reference branches; optional sibling
mentions do not make the packages dependent on a complete installation.

The audit does not repeat every prior book reading or certify every external
link. Existing source maps distinguish supplied drafts, editions, and independently
authored procedures; this pass inspected those disclosures and targeted changing
technical claims. No database, broker, cluster, or provider integration was run.
No comparative agent experiment was run to establish that a particular sentence
is unnecessary, so there are no speculative style-only deletions. Technical
instruction quality and operational validation remain separate claims.
