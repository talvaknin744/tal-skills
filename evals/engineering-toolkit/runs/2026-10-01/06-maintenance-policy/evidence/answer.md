The proposed tuning is **not justified**. The evidence supports changing work selection and enforcing shared resource budgets. Increasing workers to 64 would amplify the resource already harming foreground reads, while the proposed controller has the wrong feedback direction.

The bottleneck is metadata. Foreground traffic used about 160,000 updates/s against a 200,000/s sustained ceiling, leaving **40,000/s of nominal headroom before any safety reserve**. Combined traffic reached 192,000/s while p99 rose to 180 ms, exceeding the 100 ms objective. The previous 8-to-16-worker trial also increased metadata queues and latency. Low aggregate CPU, disk, and network utilization does not establish spare capacity at this bottleneck. These observations do not establish an SLO-safe maintenance rate. [observations.md](/private<trial>/workspace/project/observations.md:42)

The current policy also spends resources on poor reclamation:

| Five-source batch | Read and write, each | Metadata updates | Net capacity freed | GiB freed per million updates |
|---|---:|---:|---:|---:|
| Dense | 450 GiB | 250,000 | 0 GiB | 0 |
| Middle | 200 GiB | 10 million | 300 GiB | 30 |
| Tail | 10 GiB | 10 million | 400 GiB | 40 |

Thus, the 60% of recent jobs targeting dense inputs make no net capacity progress at the current batch size. Gross source retirement and completed jobs conceal this. Tail batches outperform middle batches on both metadata efficiency and byte copying, but still require ten million location updates each. Across the fleet, tail objects represent only about **0.83% of live bytes but 60.2% of objects**—so bytes alone badly understate their metadata cost. [observations.md](/private<trial>/workspace/project/observations.md:27)

The proposal introduces several additional problems:

- Under `live_fraction < threshold`, halving the threshold **excludes** work. Moving from 0.95 to 0.475 excludes dense volumes; moving to 0.2375 also excludes middle volumes. Repeated halving eventually excludes the tail. Doubling 0.95 to 1.9 admits everything.
- One-minute adjustments act faster than the three-minute telemetry delay, allowing repeated changes before their effects appear.
- The fleet-wide exact solver has no demonstrated benefit sufficient to justify unbounded planning cost or pending work.
- Separate strategy limits do not protect shared metadata capacity. Releasing every deferred plan together creates a recovery surge.
- No deadline or age rule prevents starvation. [proposal.md](/private<trial>/workspace/project/proposal.md:3)

The smallest supported changes are:

1. **Use one bounded consolidation policy initially.** Admit batches with positive estimated net reclamation after whole destination allocations. For the demonstrated five-source batches, prioritize tail, then middle, with age/deadline priority for repeatedly deferred eligible work. Reject zero-yield dense batches. A fixed threshold such as 0.5 reproduces this eligibility for the supplied classes, but estimated net yield should remain the deciding check.

   This ranking applies to the measured batch size. Dense volumes are not inherently unreclaimable: ten dense sources could mathematically fit into nine destinations, freeing 100 GiB for 500,000 updates while reading and writing 900 GiB each. If dense slack belongs to the recovery target, investigate that bounded candidate separately rather than silently ignoring it.

2. **Bound planning, outstanding work, and temporary capacity.** Start with the demonstrated five-source jobs and a bounded heuristic planner; there is no evidence requiring exact fleet-wide packing. Bound candidate enumeration, planner time/memory, and active work. Plan on demand for available admission slots rather than accumulating fleet-wide plans.

   Eligible demonstrated jobs require up to ten million updates and two destination volumes each. Eight concurrent middle jobs would require 1,600 GiB of destination capacity before source reclamation, plus allowance for interrupted output. Reserve temporary capacity before admission and keep orphan output accounted for until reconciliation.

3. **Enforce one shared maintenance budget at metadata.** Charge actual location updates, retries, repairs, and all strategies against it. Use operation-level rate limiting and a bounded burst allowance; worker count alone cannot enforce this. Apply limits at the affected metadata partition or cell where contention occurs, alongside disk and network budgets.

   Keep eight workers as an experimental upper bound and reduce active work as required. Derive the maintenance rate from mixed-load testing, foreground demand, and a reserve below the observed ceiling. Neither 40,000/s nominal headroom nor the approximately 32,000/s incident maintenance contribution is a safe setting.

4. **Remove automatic eligibility tuning initially.** Keep selection fixed while establishing costs and safe admission rates. Respond to foreground latency and metadata queue pressure by throttling or pausing new work. Require bounded progress or checkpointing so already admitted work cannot continue an unlimited burst.

   Resume gradually after sustained healthy observations, with hysteresis and bounded increases. Never release the deferred backlog together. Any later controller must use timestamped observations, account for the three-minute delay and job response time, and avoid increases on missing or stale measurements. Persistent inability to satisfy both serving and recovery objectives should trigger escalation rather than unbounded admission.

Define the recovery target explicitly. The 400 middle and tail volumes require **800 million updates**, 6,500 GiB read, and 6,500 GiB written. Repeating the demonstrated batches would free **29,000 GiB net**. Spread across seven days, that is about **1,323 updates/s and 11 MiB/s each of reads and writes**, before arrivals, retries, cleanup, and pauses. This makes throttled recovery plausible, but does not prove feasibility: arrival rate and effective safe throughput are missing. Nor does completing those batches establish that all recoverable fleet slack has cleared.

In the producer, reproduce the closure behavior using the same low-byte-rate, small-object traces before and after the rollout. Record closure reason, elapsed time, bytes, object count, placement fan-out, and partition/cell. Confirm whether the timer is the operative cause or whether another limit contributes. Test the smallest timer or batching change that reduces premature closure, with a maximum dwell bound. Measure volume occupancy, debt created per unit of input, buffering, and batching/durability latency. The correlation supports this investigation; it does not yet establish that an alternative meets the producer’s latency requirements. [observations.md](/private<trial>/workspace/project/observations.md:22)

Validation should compare the baseline and bounded candidate in an authorized isolated environment:

| Check | Explicit success outcome | Explicit failure outcome |
|---|---|---|
| Distribution replay | Dense, middle, tail, and shifted distributions produce feasible bounded plans; demonstrated batches reproduce their net yields. | Gross retirement masks destination costs, zero-yield jobs continue, or packing assumptions fail. |
| Representative mixed load | Foreground p99 stays below 100 ms, error rate remains unchanged, metadata queues remain bounded, and recovery makes useful progress. | Any serving-objective breach, growing queues, or merely faster copying without net reclamation. |
| Shared limits and locality | Concurrent maintenance, repairs, retries, and a hot cell remain within shared rate, burst, planning, and temporary-space bounds. | Individually compliant strategies collectively exceed a limit or exhaust destination space. |
| Delayed telemetry and recovery | Three-minute delay, missing metrics, noise, foreground surges, and recovery cause bounded throttling and gradual resume. | Repeated reactions to old measurements, oscillation, unsafe admission, or a backlog launch surge. |
| Seven-day recovery and fairness | With measured arrivals and interruption costs, the defined debt clears within seven days; old eligible debt progresses. | Debt grows, old work starves, or the horizon is infeasible. Preserve serving limits and escalate the producer/capacity constraint. |
| Interruption and reconciliation | Pauses/restarts around allocation, publication, and cleanup honor the existing durable protocol; live data remains correct and orphan/pending capacity is reconciled. | Lost or incorrect authoritative locations, duplicate resource accounting, stranded output, or overstated reclamation. |
| Producer alternative | Closure behavior is reproduced, sparse-volume creation falls, and agreed batching/durability limits are met. | The suspected cause is not reproduced, debt is merely displaced, or latency/buffering limits are exceeded. |

Only read-only inspection and arithmetic were performed. The validation above is proposed; no workload tests or production commands were run, and all files remain unchanged.
