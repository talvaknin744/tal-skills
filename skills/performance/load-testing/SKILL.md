---
name: load-testing
description: Build or assess load tests for demand, saturation, overload, and recovery. Use workload models, generator ceilings, misleading throughput or percentile claims, or capacity experiments; ordinary unit assertions follow their route.
license: MIT
---

# Load testing

Make the delivered workload and its outcomes auditable before using a benchmark
to justify a performance or capacity claim.
Workload evidence reconciles delivered demand with outcomes.

## 1. Specify the experiment

Read the target path, production demand evidence, test code/configuration and
environment limits. Define the question, correct useful operation, latency
boundary/objective, workload classes and comparison baseline. Identify the
authorized environment and stop conditions for the requested execution.

**Done:** the experiment has a stated claim and pass/fail evidence; review mode
remains a test assessment or proposal.
Example: define whether the run tests the p99 objective at the expected peak arrival rate.

## 2. Construct representative demand

Read [workload design](references/workload.md) for arrivals, data/skew, state and
failure phases. Choose open arrivals or a closed population from real demand.
Declare iteration-to-request mapping, retries, connection behavior and useful
result checks. Include only phases needed to test the claim.

**Done:** workload, dataset, arrival model and phase schedule are reproducible,
with omitted production conditions explicit.
Example: map each open-model iteration to one request and state how retries affect offered demand.

## 3. Validate the measurement path

Read [evidence and accounting](references/evidence.md) for generator limits,
outcome reconciliation and distribution aggregation. Observe the generator and
target together. Preserve scheduled, started, dropped, failed, interrupted and
unfinished work; a configured rate is an input, not delivered traffic evidence.

**Done:** units, populations, timing boundaries, actual delivered demand and
generator ceilings are accounted for, or the capacity claim remains unresolved.
Example: reconcile configured iterations with started, dropped, failed, and unfinished requests while watching generator CPU.

## 4. Run, compare and bound the conclusion

Execute the scoped experiment when requested; record workload/configuration
identity, run duration, warmup, repetitions and material variability. Check
correctness, useful throughput, outcome-specific latency, queue/resource bounds
and relevant recovery. Compare under matched conditions and explain deviations.
For design/review, return the executable procedure and expected observations.

**Done:** report the measured operating range and failure behavior, evidence paths,
limits and next unresolved check. A short clean run supports only its observed
conditions. [Sources](references/sources.md) records primary reading scope.
Example: state the highest tested arrival rate that met correctness and latency objectives, plus the observed recovery phase.
