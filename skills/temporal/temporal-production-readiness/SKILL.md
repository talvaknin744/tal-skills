---
name: temporal-production-readiness
description: Assess Temporal production readiness before a launch, migration, or capacity change. Use for schedule backlogs, fan-out limits, history growth, tenant isolation, and recovery evidence; complements SDK tuning and deployment guidance.
---

# Temporal production readiness

Turn operational assumptions into evidence for a particular workload. Customer
stories supply failure questions; the application's requirements and measured
behavior decide readiness.

## 1. Define the workload and decision

Inspect the affected Workflows, Activities, callers, Schedules, Worker deployment,
SDK versions, and existing operational evidence. Identify the business operation,
its owner, peak arrival pattern, completion deadline, and acceptable loss,
duplication, staleness, and recovery time. Separate interactive, bulk, and
human-waiting work where their budgets differ.

Keep reviews read-only. For implementation requests, make the smallest authorized
change and use the existing test and deployment conventions. Finish this step
with a bounded decision: which workload, environment, and change are being
assessed, with unknown requirements explicitly recorded.

## 2. Trace pressure through the system

Follow one operation from accepted input through queues, execution, dependencies,
and the observable business result. Account for retries, fan-out, and recovery
traffic, not just new requests. Locate the enforcing boundary for each limit:
per execution, Worker, Task Queue, Namespace, tenant, or downstream account.

For recurring work, large fan-out, growing histories, or shared infrastructure,
read [capacity and isolation](references/capacity-and-isolation.md). Complete this
step when each applicable limit has an owner, a stated bound, and evidence of
enforcement or a concrete gap. A configuration value alone is an assumption.

## 3. Define observations and failure rehearsals

Measure business completion and freshness separately from Temporal availability
and execution status. Correlate operations with Workflow IDs and dependency
receipts; record attempted, completed, failed, and unresolved work. Select signals
that expose the bottleneck, including queue delay and backlog age alongside
Worker and provider saturation. Protect sensitive data and bound metric-label
cardinality.

For a launch, migration, scaling change, or missing recovery evidence, read
[rehearsals](references/rehearsals.md). Select experiments that challenge the
identified risks. Each needs a workload, injected failure, expected business
invariant, measurement, and pass/fail threshold. Derive thresholds from the
application's deadlines and dependency quotas; another customer's scale is not
a sizing target.

## 4. Gather evidence and give a bounded verdict

Run available checks within the authorized environment. Exercise representative
load and recovery where permitted; otherwise give the exact unrun experiment
and its prerequisite. Verify SDK-specific options against current official
Temporal documentation or installed official skills before changing them. This
skill supplies workload acceptance criteria, not a replacement tuning manual.

Report the decision, findings ordered by impact, evidence locations, and remaining
uncertainty. State tested arrival rate, workload mix, duration, infrastructure,
and injected failures so the conclusion has a defined operating envelope. Keep
unit tests, mocked dependencies, staging rehearsals, and production observations
distinct. A green engine dashboard or passing happy path does not establish the
business outcome.

Finish with blockers and the next observable condition that resolves each one,
or a readiness verdict limited to the tested load and failure budget. For the
origin of a recommendation or a disputed platform claim, consult
[sources and interpretation](references/sources.md); source reading is optional
when the evidence already answers the task.
