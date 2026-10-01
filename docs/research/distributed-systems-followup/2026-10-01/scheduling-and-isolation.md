# Scheduling, placement, and resource isolation

Three new primary readings examine how shared resources can support heterogeneous work: Borg's placement and runtime controls, Omega's concurrent placement planners, and SQS fair delivery. The transferable distinction is between **choosing a feasible placement**, **allocating opportunities to run**, and **completing useful work**. None of these alone establishes the other two. This is documentary research plus a finite arithmetic oracle; no cluster, broker, performance benchmark, or provider experiment was run.

## Reading ledger

All sources were retrieved on 2026-10-01. Canonical URLs, authors, date precision, section evidence, and machine-readable schedules are in [scheduling-and-isolation.json](scheduling-and-isolation.json). Repository searches for canonical URLs, aliases, and titles found no prior deep-reading record for the three main sources. Existing AWS fairness and Google SRE overload readings were checked for overlap and were not counted again.

| Primary reading | Published date and exact scope read | Evidence limits |
| --- | --- | --- |
| [Large-scale cluster management at Google with Borg](https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/) | 2015; EuroSys conference 21–24 April. [Official PDF](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/43438.pdf), complete main prose §§1–8.3, physical pp.1–14 of 18; figures 5 and 12 visually inspected; remaining figure captions and accompanying prose read. | Acknowledgments/references not deep read; referenced papers not fetched. Publication day not established. |
| [Omega: flexible, scalable schedulers for large compute clusters](https://research.google/pubs/omega-flexible-scalable-schedulers-for-large-compute-clusters/) | 2013; EuroSys conference 15–17 April, proceedings pp.351–364. [Official PDF](https://storage.googleapis.com/gweb-research2023-media/pubtools/3295.pdf), all 14 pages' extracted text, §§1–8, acknowledgments, reference metadata, figure captions and accompanying prose. | Graph pixels not inspected; references are not additional readings. No simulator or production code run. |
| [Building resilient multi-tenant systems with Amazon SQS fair queues](https://aws.amazon.com/blogs/compute/building-resilient-multi-tenant-systems-with-amazon-sqs-fair-queues/) | 2025-07-21; complete main article from Overview through Conclusion, producer Java snippet, example application explanation, metrics discussion and six figure captions. | Dashboard/image pixels and linked sample repository not inspected or executed. |

Temporary Omega PDF was read locally after the web tool rejected its `application/octet-stream` content type. Its SHA-256 is `41457f149c2cad8ea6e858707fb0bb38370595bd4abd918c2f17a0cb3a28823f`. Borg's SHA-256 is `2fdacd3b69f8af91477412fc91d1d858a43e764929a4edb646bd517ededdad94`. Source bodies are not included in these artifacts.

## Six-dimension cards

### Borg: balance placement quality with runtime progress

- **Trigger:** Mixed latency-sensitive services and interruptible batch jobs share machines.
- **Problem:** Packing, correlated failures, bursts, and long-job progress compete. Occupied machines do not prove durable progress.
- **Mechanism:** Combine multidimensional placement with failure spread, locality and preemption cost (§3.2, pp.4–5). Runtime controls distinguish throttling compressible resources from killing work that exceeds noncompressible allocations (§6.2, pp.11–12).
- **Limits:** Admission can leave tasks pending (§2.5, p.3). Snapshot compaction studies (§5.1, pp.7–8) measure packing rather than completion. Preemption kills/requeues work; recovery/checkpoint ownership belongs to the application, and advance notice is not assured (§3.2, p.5).
- **Counterexample:** Repeatedly evicting an hours-long job can consume substantial CPU while committing no progress. Dedicated placement can be justified despite packing cost.
- **Verification:** Compare spread/tight/shared/separated placement on one workload; measure pending age/reasons, service latency, durable batch completions, lost/repeated work, memory kills and runnable delay. Exercise repeated reclaim and a kill without notice. These checks are proposed, not executed.

Historical evidence and scope: [Borg PDF, §§2.5, 3.2, 5.1, 6.2](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/43438.pdf).

### Omega: independent planners, validated resource claims

- **Trigger:** Expensive placement for long-running services blocks simpler scheduling decisions, or different job types need different policies.
- **Problem:** A shared serial planner causes head-of-line blocking; disjoint resource pools fragment capacity; exclusive offers can hold capacity while a slow planner works (§§2.1, 3, pp.352–354).
- **Mechanism:** Planners work on local copies of shared cell state, then commit validated resource changes. Conflicting claims resynchronize/retry; incremental placement and all-or-nothing gang placement have different semantics (§3.4, p.355).
- **Limits:** Conflict retries still consume planning work. Strict fleet fairness and starvation guarantees are not supplied by the architecture (§§3.4, 8). The MapReduce acceleration model assumes idealized scaling and omits some worker setup cost (§6).
- **Counterexample:** A slow planner repeatedly loses a hot resource to faster planners. Parallel planning removes a serial queue dependency without creating physical capacity or a bounded start time.
- **Verification:** Race two claims for one slot; require one winner and a refreshed retry, with no over-allocation. Contrast partial-task and gang jobs; measure planning delay, conflicts, actual start, durable completion and starvation. These checks are proposed, not executed.

Historical evidence and scope: [Omega PDF, §§2.1, 3.4, 5.2, 6, 8](https://storage.googleapis.com/gweb-research2023-media/pubtools/3295.pdf).

### SQS: fair delivery is one stage of tenant service

- **Trigger:** Tenants share a standard work queue and a noisy or slow tenant inflates quiet tenants' waiting time.
- **Problem:** Global queue age hides different tenant outcomes; equal message counts can represent unequal processing cost.
- **Mechanism:** Set a meaningful `MessageGroupId`. The launch account prioritizes quiet delivery using tenant in-flight distribution and exposes quiet-group metrics.
- **Limits:** The article states no per-tenant consumption-rate limit. Standard-queue groups do not impose FIFO order. Current detection semantics are richer than the launch explanation; see the dated cross-check below.
- **Counterexample:** All workers already run nonpreemptible long jobs. Changing the next delivery cannot free a slot. Untrusted or per-message fabricated tenant IDs can defeat the application's intended accounting group.
- **Verification:** Run fast/slow/large-volume tenants together; measure tenant queue dwell, prefetched residency, processing time, useful completion and eventual noisy-tenant progress. Compare labeled/unlabeled inputs and expiry/redelivery. These checks are proposed, not executed.

Launch evidence and scope: [AWS engineering article, How it works through example application](https://aws.amazon.com/blogs/compute/building-resilient-multi-tenant-systems-with-amazon-sqs-fair-queues/). Worker preemption and trusted identity requirements above are our design synthesis, not claimed SQS features.

## Current runtime and broker boundaries

These are targeted official documentation checks, not installed-version tests. Recheck the adopted runtime, effective configuration and account quotas before implementation.

- **SQS detection:** The current [detailed fair-queue documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fair-queues-detailed.html) covers both concurrency share and recent processing-time share. A tenant is noisy when its in-flight share exceeds 10% with at least 30 of its messages in flight, or processing-time share exceeds 10%; thresholds are approximate. Messages without a group each count as a distinct tenant. A consumed backlog or five continuous minutes without tenant in-flight messages ends deprioritization. These describe the retrieved documentation, not a hard latency bound.
- **SQS delivery contract:** [Fair queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fair-queues.html) do not rate-limit tenants and can use spare capacity for noisy traffic. [Message-group documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-messagegroupid-property.html) distinguishes standard fairness from FIFO per-group ordering. Neither group identity nor delivery priority establishes data authorization.
- **SQS finite bounds:** [Standard quotas](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-queues.html) say approximately 120,000 in-flight messages for most standard queues, dependent on traffic/backlog. At that limit, short polling returns `OverLimit`; long polling returns no new messages. [Visibility documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html) caps visibility at 12 hours from receipt; extensions do not reset it. Standard delivery can duplicate even during visibility. Visibility is neither a CPU reservation nor an application checkpoint.
- **Kubernetes quota:** [ResourceQuota](https://kubernetes.io/docs/concepts/policy/resource-quotas/) limits aggregate resources in a namespace; conflicting creates/updates get 403. Quota changes do not reclaim already-created resources. Quotas are independent of cluster size and do not restrict node placement; namespaces can share nodes. An admission ceiling is not a reserved placement or tenant completion guarantee.
- **Kubernetes resource enforcement:** [Container resources](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) distinguish requested placement resources from actual use. Scheduling checks per-node requests; CPU limits throttle, while memory-limit enforcement can be reactive OOM killing. Allocatable excludes system use. Low current utilization does not make an otherwise infeasible request fit.
- **Kubernetes planner architecture:** [Scheduling framework](https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/) runs scheduling cycles serially and binding cycles potentially concurrently. Reserve prevents races before binding; later failure calls Unreserve, which must be idempotent and not fail. Do not describe current Kubernetes as the paper's parallel Omega planners merely because both have plugin policies.
- **Kubernetes preemption:** [Priority/preemption](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/) distinguishes `Never` from default preemption; a nonpreempting Pod can still be preempted. Victim grace periods delay placement, disruption-budget handling is best effort, and cross-node preemption is not performed. Priority alone supplies no immediate-start or checkpoint guarantee.

Placement spread and resource throttles can reduce contention or shared-failure exposure. They establish no application data/security boundary: authorization, credentials, network access, and isolation for untrusted execution need their own evidence. Conversely, data authorization does not reserve CPU or prevent queue interference. This distinction is an application requirement, not a provider result.

## Authored multitenant serving schedule and independent oracle

This deterministic model has two nodes, each with two available worker slots, 2 allocatable CPUs and 4 GiB usable memory beyond system reserves. Every job needs one slot, 1 requested CPU and 2 GiB. A node can run two jobs. Durations are fixed independently of interference and include the entire resource-owning interval; dispatch, setup, effect settlement, deletion and cleanup add no delay. Jobs are nonpreemptible, have no failures, and never overrun; correct results are assumed. Deadlines label useful completion (`finish <= deadline`) without cancelling expired jobs, so FIFO still executes B/C. A3/A4 wait in the durable backlog outside worker ownership. Times are seconds and intervals are half-open.

| Input | Arrival | Duration | Deadline |
| --- | ---: | ---: | ---: |
| A1, A2, A3, A4 | 0 | 8 each | 20 each |
| B1, C1 | 1 | 1 each | 3 each |

The protected policy caps **all A-owned resident/in-flight work at two**, including prefetched and executing work. Two remaining slots are reserved for B/C; A cannot borrow them. This is an authored policy, not an SQS configuration or provider promise.

| Policy | A execution | B1/C1 execution | Quiet wait | Quiet completions by deadline 3 | Last A completion |
| --- | --- | --- | ---: | ---: | ---: |
| Global FIFO | A1–A4 `[0,8)` | `[8,9)` | 7 each | 0 | 8 |
| Protected residency | A1/A2 `[0,8)`; A3/A4 `[8,16)` | `[1,2)` | 0 each | 2 | 16 |

The independently expected occupancy for the protected schedule is 2 on `[0,1)`, 4 on `[1,2)`, 2 on `[2,8)`, and 2 on `[8,16)`. Both schedules consume `4×8 + 2×1 = 34` slot-seconds, 34 **reserved** CPU-seconds, and 68 GiB-seconds; these are modeled reservations, not measured CPU utilization. At the common horizon 16, both have 64 available slot-seconds and 30 idle slot-seconds. At FIFO's earlier drain horizon 9 it has only 2 idle slot-seconds; comparing utilization over different horizons would obscure the latency/completion tradeoff. The protected policy spends headroom and delays A rather than improving raw work volume.

A separate reader independently calculated these outcomes, including eventually timely completions: four for FIFO and six for the protected policy. A local Python check swept the supplied interval endpoints, verified capacities and A's cap, and checked arrivals, durations, costs, useful completion and waiting against fixed expected values. All assertions passed. It validates finite schedule arithmetic only, not an implementation, general fairness, SQS thresholds, runtime performance or recovery.

**Counterchecks:** If A3/A4 are prefetched into the other workers but ignored by an active-execution-only cap, all four slots can remain resident despite only two running A jobs. Quiet jobs then lose the modeled capacity. If A can borrow the reserve with nonpreemptible eight-second jobs, B/C arriving later must wait for residual service time. A bounded reclaim promise needs independently bounded cancellation/checkpoint/cleanup and recovery semantics; killing without durable progress can turn apparent utilization into repeated work. An A deadline of 10 makes the protected A3/A4 late; FIFO succeeds for every A job. Cancelling expired FIFO B/C changes its cost to 32 slot-seconds. More B/C arrivals, larger memory requirements, dependency delay, cleanup or a lost node require a different oracle; this schedule promises nothing for them.

Two small feasibility checks make the architecture distinction concrete:

1. Two planners observe one free slot. The fast planner's claim succeeds; the slow conflicting claim is rejected. It rereads and waits until release before committing. Expected maximum occupancy is one. Retrying a stale claim must not launch a second owner; repeated losses require an explicit starvation policy. This is an authored transaction oracle, not an executed Omega test.
2. Two nodes each offer 4 CPUs/8 GiB, so aggregate free memory is 16 GiB. A single-node job needing 2 CPUs/10 GiB fits neither node. Expected feasible placements: zero. Aggregating capacity or splitting the job's memory across nodes would be an invalid feasibility proof unless its execution model actually supports that split.

## Provider results and recommended placement

Google reports historical packing benefits and trace/simulation outcomes; we have not reproduced them. In Borg, the §5 study uses snapshot compaction rather than completion replay and relaxes some constraints. Omega's §6 potential speedups use a simplified linear model and omit some worker setup time. The AWS launch article demonstrates service behavior and metrics; it supplies no independently reproduced workload result here. None is used as a numeric acceptance threshold for our model.

Rank the destination by decision trigger:

1. **Existing `overload-control/references/queues-and-fairness.md`:** strongest placement for cost-weighted tenant accounting, resident/prefetched work, reserve versus borrowing, and the limits of broker fairness. The new contribution is the explicit reserve/reclaim counterexample and current SQS boundary, not another overload recipe.
2. **Existing `distributed-system-patterns/references/serving.md` and `batch.md`:** multidimensional per-node feasibility, placement planner versus execution scheduler, partial/gang usefulness, interrupted work and durable completion. Add a conditional placement/scheduling reference if the parent chooses integration; avoid filling the core trigger with broker settings.
3. **Existing `background-maintenance/references/policy-and-control.md`:** long-work progress, lost work under preemption, and bounded reclaim; this is appropriate only when the work is maintenance.
4. **Distinct future skill candidate, not created:** `cluster-scheduling-design` could trigger on designing or reviewing a distributed placement scheduler's constraints, resource-claim transactions, gang semantics, preemption and starvation. Its output would be a feasibility/ownership contract plus conflict and useful-completion schedules. This batch does not establish sufficient standalone demand over existing references to recommend a new package now.

No skills, catalog, runner, evaluation cases or shared root files were changed by this research lane.
