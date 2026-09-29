# Deeper SRE reading: progress, recovery, and scheduled work

Read on 2026-09-29. This follows [the initial book survey](architecture-book-sources.md) and compares the source material with the current `graceful-draining` and `concurrency-correctness` skills. The official Google HTML edition supplies the evidence; the user-provided PDF mirror was unnecessary. This is targeted chapter reading, not a claim to have read the entire book. The notes paraphrase the sources and do not reproduce book text or examples.

## Reading ledger and actionable findings

### Chapter 17: Testing for Reliability

Read **Relationships Between Testing and Mean Time to Repair**, **Rollouts Entangle Tests**, **Configuration test**, **Testing Scalable Tools**, **Barrier Defenses Against Risky Software**, **Testing Disaster**, and **Using Statistical Tests**. [Official chapter](https://sre.google/sre-book/testing-reliability/)

Recovery needs more evidence than successful checkpoint creation: independently load and validate the checkpoint, then use a controlled return to service. Repair tooling can bypass normal protections; isolate its output until normal validation succeeds. Deployment tests must identify the actual binary/configuration combination. Random failure discovery becomes more useful when its recorded execution can be reproduced; a subsequent passing random run does not establish that the original defect disappeared.

**Repository implication:** retain the two skills' deterministic failure schedules. Strengthen the drain acceptance check with independent checkpoint restoration and a deliberate serving/admission gate after validation. A separate recovery workflow becomes useful for restoring damaged data, where worker replacement is only one small part of the task.

### Chapter 20: Load Balancing in the Datacenter

Re-read **Identifying Bad Tasks: Flow Control and Lame Ducks** and **A Robust Approach to Unhealthy Tasks: Lame Duck State**. [Official chapter](https://sre.google/sre-book/load-balancing-datacenter/)

Admission withdrawal has propagation delay; accepted requests still need a completion path before the shutdown deadline. The chapter's short-request timing example does not establish a safe timeout for day-long work. The existing drain workflow already covers this distinction.

### Chapter 24: Distributed Periodic Scheduling with Cron

Read the full chapter, with particular attention to **Cron Jobs and Idempotency**, **Tracking the State of Cron Jobs**, **The Roles of the Leader and the Follower**, **Resolving partial failures**, and **Running Large Cron**. [Official chapter](https://sre.google/sre-book/distributed-periodic-scheduling/)

A schedule definition and one scheduled occurrence need different identities. Persist launch intent and outcome so a successor can resolve an interrupted launch through duplicate-safe execution or authoritative lookup. Observe the work's effect as well as the scheduler's launch. Whether missing or duplicating an occurrence is worse depends on the job; Google's described preference is not a universal payroll or notification policy. Distribute permitted start times to reduce synchronized load.

**Repository implication:** existing idempotency and drain guidance handles identity and ambiguous effects. A future scheduled-work skill would need a distinct contract for missed occurrences, overlap, catch-up, and deadlines, backed by the actual scheduler's current documentation. Leader election by itself is insufficient evidence of duplicate-free external effects.

### Chapter 25: Data Processing Pipelines

Re-read **Monitoring Problems in Periodic Pipelines**, **Workflow Correctness Guarantees**, and **Ensuring Business Continuity**, alongside the earlier scheduling analysis. [Official chapter](https://sre.google/sre-book/data-processing-pipelines/)

The described pipeline isolates speculative outputs and validates ownership, configuration revision, and coordinator identity before accepting results. This narrows its guarantee to controlled publication; it does not grant arbitrary external effects exactly-once behavior. Observe progress during execution, including runs that never finish.

**Repository implication:** checkpoint contracts can explicitly identify immutable input/configuration revisions and the authority accepting publication. Retiring-worker eligibility and lease epochs alone do not define these boundaries.

### Chapter 26: Data Integrity: What You Read Is What You Wrote

Read **Delivering a Recovery System, Rather Than a Backup System**, **Third Layer: Early Detection**, **Out-of-band data validation**, **Knowing That Data Recovery Will Work**, and the **Google Music—March 2012: Runaway Deletion Detection** case study. [Official chapter](https://sre.google/sre-book/data-integrity/)

Measure successful recovery, including user access and elapsed restoration time. Independent checks should detect business-invariant violations across stores early enough for retained recovery material to help. Full exercises expose missing data, insufficient resources, unavailable dependencies, and application reintegration failures that a successful backup status can hide. Preserve diagnostic evidence and observe progress throughout recovery.

**Repository implication:** a `recovery-validation` skill is a distinct future candidate: define tolerated loss and downtime, execute a bounded restore rehearsal, reconcile application invariants, and verify access before returning recovered state to service. The existing projection-rebuild reference is narrower, and the new concurrency skill diagnoses ordering defects rather than restoring damaged state.

## Long jobs change the rollout's unit of evidence

The previously inspected **Canarying in Noninteractive Systems** section of Workbook Chapter 16 makes a relevant distinction: keep work units inside their canary/control population, observe output quality and completion time, and evaluate for at least a work-unit duration. [Official workbook chapter](https://sre.google/workbook/canarying-releases/)

Applied to the reported A → B → C failure, a pod becoming healthy is only an intermediate event. The proposed acceptance scenario is one logical job surviving the retirement sequence with its correct final result, accounted-for effects, and bounded progress. Accelerated deterministic tests exercise interruption boundaries; they do not substitute for representative-duration validation when runtime or data size affects correctness. This is an engineering application of the reading, not a claim that a real 24-hour cluster experiment ran.

## What to add now, and what to defer

| Capability | Existing coverage inspected | Decision |
| --- | --- | --- |
| Admission, safe handoff, retry accounting, and late owners | [graceful-draining](../../skills/engineering/graceful-draining/SKILL.md), including both conditional references | Keep one focused skill; add restoration evidence and input/configuration identity where missing. |
| Stale reads, conditional mutation, and forced interleavings | [concurrency-correctness](../../skills/engineering/concurrency-correctness/SKILL.md) | Keep its invariant/history/enforcement workflow; this reading supplies no reason for a separate SRE concurrency manual. |
| Restoration after corruption, deletion, or failed recovery | Projection repair and broader-test references in the separately authored local microservice skill drafts | Strong next candidate: `recovery-validation`, with restore/reintegration fixtures and measurable recovery bounds. |
| Scheduled occurrence correctness | Existing idempotency and drain skills | Defer a dedicated skill until it covers scheduling-specific decisions and real scheduler failure scenarios rather than repeating effect deduplication. |

These choices prioritize independently useful invocations over one package per book. Historical Google implementations supply design evidence, not the runtime contract of Kubernetes, a broker, a database, or a cloud service. Validate implementation choices against the deployed product and version before making operational claims.
