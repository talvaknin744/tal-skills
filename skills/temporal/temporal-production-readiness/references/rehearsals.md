# Rehearsals and acceptance evidence

Select experiments from the actual risk map. A read-only assessment can specify
them without running mutations; implementation authority is bounded by the
environment the user authorized. Destructive production fault injection needs
explicit authorization. Prefer an existing staging or isolated test environment.

## Workload experiments

| Pressure or failure | Evidence required |
| --- | --- |
| Burst, sustained peak, and growing backlog | Completion and freshness deadlines, maximum backlog age, and demonstrated drain rate after arrivals return to normal. |
| Dependency slowdown, throttling, or outage | Bounded aggregate requests and retries, preserved progress, visible unresolved work, and recovery within the chosen budget. |
| Temporal submission throttling or lost acknowledgement | Accepted inputs remain accounted for; safe resubmission resolves failed or uncertain starts/messages without silently losing work. |
| Worker restart or scale-down | Recovery of in-flight work, acceptable cold replay latency, sufficient compatible capacity, and external effect reconciliation. |
| Repeated scheduled runs and backfill | Expected number of required intervals covered, intentional skips/coalescing, and no stale result overwriting a newer observation. |
| Largest tenant, payload, or longest-lived execution | Quiet-tenant service remains within budget; serialization, resource use, and history management remain viable. |
| Missing external payload, credentials, or network route | An observable, actionable failure and a documented repair path instead of an indefinitely hidden retry loop. |

Use realistic distribution tails and at least the lifetime needed to expose the
suspected accumulation. Time-skipping tests establish timer behavior; they do not
measure real capacity or dependency recovery. A provider mock cannot establish
that provider's billing, rate limiting, or idempotency semantics. Preserve those
limitations in the verdict.

## Migration and rollout

Choose a bounded slice with identifiable business outputs and a reversible
traffic gate. Identify the coordinator responsible for each operation, including
work already running before cutover. Prevent old and new paths from issuing the
same effect independently. Side-by-side comparison is safe only when its effect
ownership is defined; a read-only shadow or captured-result comparison is often
appropriate.

Record which old executions drain, which are explicitly transferred, and which
new requests route to the new implementation. Include Schedules, event producers,
human responses, and late callbacks. Define rollback for both new traffic and
already-started work; changing a feature flag cannot retract completed effects.
Use the deployed SDK's official compatibility and deployment guidance for code
changes affecting existing histories.

Start with a cohort that exposes representative behavior. Expand only against
observed output equivalence, completion/freshness targets, resource budgets, and
an exercised recovery path. A customer's successful migration demonstrates a
strategy, not evidence that this system can skip load testing.

## Business observability and cost

For each outcome, distinguish accepted work, pending work, confirmed external
effects, terminal failures, and cases requiring reconciliation. An execution
history shows what Temporal recorded; independently verify effects whose result
was lost before it could be recorded.

Use a bounded set of dimensions for metrics, and business IDs in appropriately
protected traces or lookup records. Make support able to find a delayed operation
and its owner without exposing sensitive payloads broadly. For dashboards,
publish observation time, covered source revision, and stale/failed status.

Estimate cost per useful completed operation using measured Actions, history
storage, Worker resources, and provider charges. Activity invocations, attempts,
provider requests, and billed units are distinct counters. Reconcile them before
optimizing. Accept a cheaper design only if the same business invariants and
recovery budget still pass.

## Readiness record

Keep the result proportionate to the task, but include:

- Workload, environment, deployed versions, and business invariants.
- Measured load mix, duration, failure injection, resource boundaries, and results.
- Thresholds and their requirement or quota source.
- Findings with evidence, owner, corrective action, and retest condition.
- Unrun checks, missing observations, and the resulting limits on the verdict.

Conclude ready within the tested envelope, blocked by a named failed criterion,
or insufficient evidence. Separate service availability from on-time correct
business completion in every conclusion.
