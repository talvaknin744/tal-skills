---
name: background-maintenance
description: Design, review, or tune compaction, reclamation, rebalancing, backfills, and index maintenance sharing foreground resources. Use for poor yield, shifting distributions, resource pressure, or unsafe resume; exclude finite local cleanup.
license: MIT
---

# Background maintenance

Reduce maintenance debt within the foreground workload's resource and correctness
contract. Useful progress is safely reclaimed capacity, improved placement, or a
usable index; completed jobs and rewritten bytes alone do not establish it.

## 1. Establish the maintenance claim

Inspect the affected planner, workers, storage engine, ownership records,
configuration, and observations. Name the debt being reduced, its arrival rate,
the required completion or freshness horizon, and the foreground objective.
Separate a producer creating avoidable debt from a recovery policy clearing it.

Keep the requested mode: review produces findings, design produces a concrete
policy, and implementation changes the scoped code or configuration. Production
tuning, destructive reclamation, and fault injection require authorization for
those actions and their environment; prepare a reviewable procedure when it is
absent. Derive settings from project evidence rather than importing source
thresholds or issuing default production commands.

**Done:** the useful outcome, scope, foreground objective, current debt, and
missing evidence are explicit.

## 2. Choose work by distribution and cost

Inspect distributions by relevant partition, cell, tenant, age, size, occupancy,
or overlap. Compare steady state with the incident or proposed workload. An
average can hide a costly tail; distinguish byte volume from object count and
request concentration. Trace each policy's eligible inputs, actual outputs,
resource cost, and durable yield, including temporary destination capacity.

For policy selection, planner bounds, or engine-specific compaction knobs, read
[policy and control](references/policy-and-control.md). Select the smallest
supported policy set covering the observed distributions. Account separately
for planner CPU/memory, worker I/O, metadata operations, network locality, and
foreground contention; bound outstanding work as well as active workers.

**Done:** each proposed policy has a justified eligibility predicate, cost and
yield evidence, downstream budgets, and an uncovered-case or starvation check.

## 3. Make adaptation bounded

Specify the measured signal, actuator, feedback direction, observation delay,
adjustment bounds, and recovery behavior. Protect foreground latency and errors
at the constrained resource. Use measured headroom and debt age to decide
admission, throttling, or pausing; make persistent inability to meet both goals
visible with an escalation path.

For automatic tuning or interacting strategies, use the control-loop checks in
[policy and control](references/policy-and-control.md). Validate the sign of the
eligibility predicate, shared budget accounting, and responses to delayed or
missing measurements before claiming stable adaptation.

**Done:** a concrete overload and recovery scenario explains how work stays
bounded, serving stays within its objective, and debt remains observable.

## 4. Preserve semantics through interruption

Identify the authoritative conditions for selecting, publishing, and retiring
work. Pause, restart, ownership transfer, or a successful copy must preserve the
application's live-data, deletion, reader, and placement invariants.

For moves, backfills, rebuilds, source deletion, expired data, or resumable jobs, read
[reclamation safety](references/reclamation-safety.md). Verify the adopted
engine's actual contract and version. The source articles establish no general
crash-safe publication or ownership guarantee; [sources](references/sources.md)
separates their evidence from this skill's design and verification requirements.

**Done:** durable publication, retirement eligibility, stale-owner behavior,
and recovery of uncertain work have enforceable boundaries or explicit gaps.

## 5. Demonstrate useful progress

Use [verification](references/verification.md) to choose representative and
adversarial checks. Compare the baseline and candidate on useful yield, every
constrained resource, foreground outcomes, and semantic results after
interruption. Run relevant local checks for implementation; distinguish models,
proposed rehearsals, and actual engine or platform observations.

For broader sizing and failure headroom, compose `capacity-planning` when
available; for cross-service dependencies, `microservice-operations`; for
deployment drain and handoff, `graceful-draining`; for duplicate or uncertain
side effects, `idempotency`. Keep this skill's decision focused on maintenance
policy and budgets. Its bundled references remain usable when those companion
skills are absent.

**Done:** report scoped changes or findings, measured outcomes, checks actually
run, remaining correctness or capacity limits, and the next check for each gap.
