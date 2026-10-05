---
name: performance-diagnosis
description: Diagnose p99 regressions, backend latency, throughput plateaus, or resource saturation; validate bounded improvements. Use for unexplained slowness, profiling, pool waits, or throttling. For format-only changes, no skill applies.
license: MIT
---

# Performance diagnosis

Explain the constraint on useful work, then demonstrate whether the requested
intervention changes it. A plausible profile is a hypothesis about the affected
operation until correlated with its path and workload.
Bottleneck means the executing or waiting constraint that limits useful work.

## 1. Establish the observation boundary

Read the slow operation, relevant code/configuration, workload, telemetry and
recent changes. Define correct, on-time success, the latency boundary and target,
and affected operation/tenant classes. Record offered demand, useful completions,
errors, rejection and unfinished work separately. Keep review read-only; implement
the scoped repair when requested and use the authorized test environment.

**Done:** symptom, baseline window, workload, target and missing evidence are explicit.
Example: compare the affected endpoint's p95 and completion rate with the same measures before the regression.

## 2. Locate executing and waiting work

Trace the operation through admission, queues, pool acquisition, execution,
dependencies and result delivery. Check utilization, saturation and errors for
the resources that can constrain that path, including effective limits. Separate
averages from bursts and runnable work from blocked work.

- For CPU, allocation/GC, scheduling or container constraints, read
  [runtime attribution](references/runtime.md).
- For fan-out, retries, batching or transport delays, read
  [distributed paths](references/distributed-paths.md).

**Done:** the delay is localized as far as evidence permits, with a concrete
observation that could disprove the leading hypothesis.
Example: if pool acquisition dominates, check whether a pool-wait reduction moves endpoint latency under matched demand.

When the unresolved task is representative workload construction, hand off to the `load-testing` skill. When database work or waits are implicated, hand off to the `database-performance` skill. When the task is admission or overload containment, hand off to the `overload-control` skill. If `load-testing` or `database-performance` or `overload-control` is not installed, continue with this skill's local guidance, leave conclusions specific to the missing sibling unresolved, and do not guarantee its outcomes.

## 3. Choose the smallest intervention

Connect each candidate to the mechanism it would change. Compare removing work,
shortening resource ownership, changing distribution, or adding capacity against
correctness, memory, dependency load and cost. Derive limits from the workload;
more concurrency may increase waiting at the next stage. Preserve transaction,
freshness, ordering and accepted-work contracts.

**Done:** the chosen change has a causal rationale, expected signal, tradeoff and
stop condition; unresolved hypotheses have a discriminating next measurement.
Example: reduce fan-out only when downstream attempts explain the delay, and stop if useful completions fall.

## 4. Verify the mechanism and outcome

Compare the baseline and candidate under matched workload, versions, limits and
cache/data conditions. Observe useful throughput, outcome-specific latency,
resource waits, downstream work and correctness. Record repetitions, variability
and profiling overhead where material. In review/design mode, specify these
checks and acceptance conditions without claiming execution.

**Done:** report the supported cause, change or recommendation, observed effect,
and remaining limits. Separate a local improvement from sustainable fleet capacity.
Read [sources](references/sources.md) for primary grounding and reading scope.
Example: report a confirmed queue-wait reduction and endpoint outcome separately from any untested fleet-capacity estimate.
