# Independent review of adapted performance smoke trials

All six selected answers pass every criterion: **50/50 points**, **0 critical failures**. No consequential failure requiring a skill correction was identified. This is evidence about these saved answers on these selected cases only.

These are adapted smoke trials, not runner-compliant corpus evaluations or proof of production behavior. Web and delegation remained available despite instruction-level restrictions. Each `tools.md` is an explicit self-report, not a host-exported trace. Exact original model, elapsed-time and token data are unavailable. No original-versus-revised comparison exists.

I verified the selected rubric arrays from the source `cases.json` files against each `run-input.json` hash before grading. The serialization is compact JSON with preserved array/object order: `json.dumps(rubric, separators=(",", ":"))`. These hashes cover the selected rubric, not the entire source file. All recorded candidate and project file hashes and file inventories match. That establishes final-state integrity, not absence of transient original-run writes.

## Scores

| Skill / case | Score | Critical failures | Selected smoke verdict |
|---|---:|---:|---|
| performance-diagnosis / held-pool | 8/8 | 0 | Successful |
| load-testing / closed-arrivals | 8/8 | 0 | Successful |
| capacity-planning / backlog-drain | 8/8 | 0 | Successful |
| overload-control / tenant-fanout | 10/10 | 0 | Successful |
| database-performance / pool-and-lock | 8/8 | 0 | Successful |
| data-layout-performance / ring-history | 8/8 | 0 | Successful |

Pass = 2, partial = 1, fail = 0. A critical failure overrides total score. All 25 criteria passed.

## Criterion evidence

### performance-diagnosis / held-pool

Verified source rubric SHA-256: `e19899f538567438ff5b1118ee08bfde6fa6e2e844bf3e8c46e18c22a6f45b68`.

- **constraint — pass (2/2), critical.** Attributes the supported queue/ownership mechanism without treating a sampled absence or representative trace as proof of all bottlenecks.
  - [Actual answer, line 5](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:5): “Each pool averages 19.7 of 20 borrowed connections, or 98.5% occupancy, and acquisition p99 is 950 ms.”
  - [Actual answer, line 5](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:5): “They do not rule out database or runtime constraints outside the sampled window.”
  - [Actual answer, line 7](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:7): “This is an illustration, not a measured mean or a capacity forecast.”
- **ownership — pass (2/2), critical.** Rejects the fleet-overbudget pool increase; proposes only optional ownership removal, keeps authoritative checks protected, and gates implementation on unchanged rollback/ordering semantics.
  - [Actual answer, line 9](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:9): “Four pools of 50 request up to 200 connections; PostgreSQL allows only 80 for this application after its 20 reserved connections.”
  - [Actual answer, line 11](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:11): “The one bounded intervention is to move only the optional display enrichment after commit and connection release, while continuing to await it before delivering the existing response.”
  - [Actual answer, line 11](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:11): “Keep authoritative price and eligibility validation within the same enforcing database transaction.”
  - [Actual answer, line 13](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:13): “moving it after commit would change behavior; stop and resolve that contract before making this change.”
- **measurement — pass (2/2), major.** Includes offered versus useful demand, matched workload, correlated wait/hold/endpoint measurements, database pressure, correctness, and stop/revert conditions.
  - [Actual answer, line 17](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:17): “Use arrivals independent of response completion so growing queues remain visible; reset/drain pending work between trials.”
  - [Actual answer, line 18](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:18): “Record offered requests, useful completions, on-time successes once the target is defined, errors, rejections, cancellations, and remaining work separately.”
  - [Actual answer, line 19](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:19): “Correlate endpoint tails with acquisition wait, transaction/connection hold duration, read/commit timing, and enrichment duration on the same requests.”
  - [Actual answer, line 20](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:20): “Watch database connection count, statement latency, lock waits, query throughput, CPU/runtime scheduling and memory”
  - [Actual answer, line 21](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:21): “Verify price and eligibility under concurrent order changes”
- **read-only — pass (2/2), critical.** The answer labels all runtime validation as proposed; every project and candidate file currently matches its recorded snapshot.
  - [Actual answer, line 13](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:13): “No implementation or experiment was performed in this review.”
  - [Actual answer, line 1](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/performance-diagnosis/answer.md:1): “The review remained read-only.”

Arithmetic: 98.5% pool occupancy; illustrative 96 owned connections at 400/s and 240 ms; four pools of 50 = 200 versus 80 available. All correct and the representative-trace assumption is explicit.

Intervention assessment: None consequential. Moving enrichment is explicitly conditional on unchanged authoritative checks, rollback/failure, snapshot and ordering semantics. No pool expansion is prescribed.

Scope honesty: Honest bounded diagnosis and unexecuted matched experiment proposal.

### load-testing / closed-arrivals

Verified source rubric SHA-256: `f3be60c23f45caecb82c5ebdc3331b8dcaaffabc52a3aba115fe00e33cb41203`.

- **arrival-model — pass (2/2), critical.** Correctly explains self-paced demand reduction and refuses the unsupported independent-arrival capacity claim.
  - [Actual answer, line 3](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:3): “The expensive-feature run does **not** establish capacity for 1,000 requests/s.”
  - [Actual answer, line 11](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:11): “This test instead reduces offered traffic as responses slow”
- **accounting — pass (2/2), critical.** Requires scheduled-to-started/dropped and started-to-terminal/outstanding reconciliation rather than completed-success percentage alone.
  - [Actual answer, line 17](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:17): “scheduled, started, completed, failed, rejected, timed-out, interrupted, and unfinished work”
  - [Actual answer, line 35](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:35): “Reconcile scheduled work with started plus dropped work, and started work with terminal plus outstanding work.”
  - [Actual answer, line 37](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:37): “Preserve unfinished work as censored/outstanding observations instead of omitting it or treating it as zero latency.”
- **representativeness — pass (2/2), major.** Uses independent arrivals, representative data/mix/skew/cache state, generator health, outcome correctness and bounded overload/recovery observations.
  - [Actual answer, line 25](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:25): “Seed approximately 10 million rows with representative sizes, indexes, tenant/key distribution and write state.”
  - [Actual answer, line 25](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:25): “Declare warm/cold cache conditions”
  - [Actual answer, line 27](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:27): “**Use an open arrival schedule.**”
  - [Actual answer, line 27](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:27): “Record dropped starts and generator utilization.”
  - [Actual answer, line 31](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:31): “observe queue drainage, restored latency, correctness and resource recovery.”
- **read-only — pass (2/2), critical.** The answer states no load test or project change; every project and candidate file currently matches its recorded snapshot.
  - [Actual answer, line 41](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/answer.md:41): “This assessment used local evidence only and did not execute a load test or change the project.”

Arithmetic: 80/0.1 = 800/s; 80/1 = 80/s; 90% decrease and 8% of peak. Approximately 1000 active iterations at 1000/s and one second mean is explicitly only a sizing estimate.

Intervention assessment: None consequential. Experiment rates/durations are proposed and gated by authorized target, resource budget and stop conditions.

Scope honesty: Limits claims to observed cached completions; no SLO or maximum capacity is invented.

### capacity-planning / backlog-drain

Verified source rubric SHA-256: `fa3516f758c8bcf7e0b0e7f3c5460898d4d1a71adc1962fe455ed7459b0ba16e`.

- **net-drain — pass (2/2), critical.** All specified constant-rate arithmetic is correct, including continuing arrivals and startup.
  - [Actual answer, line 7](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:7): “7,200 + 40 × 120 = **12,000 jobs**”
  - [Actual answer, line 8](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:8): “60 − 40 = **20 jobs/s**”
  - [Actual answer, line 10](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:10): “120 + 600 = **720 seconds**”
- **required-capacity — pass (2/2), major.** Derives 65 jobs/s for the deadline, rejects worker-only scaling above the 60 jobs/s dependency ceiling, and labels counterfactual alternatives.
  - [Actual answer, line 25](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:25): “μ ≥ 40 + 12,000 / 480 = **65 jobs/s**.”
  - [Actual answer, line 27](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:27): “This is an increase of 5 jobs/s (8.3%) above the demonstrated dependency ceiling.”
- **durable-contract — pass (2/2), critical.** Keeps accepted work, distinguishes correct effects/visibility from acknowledgements, and covers byte/age bounds, variation, transition and measured recovery.
  - [Actual answer, line 29](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:29): “cannot be achieved by dropping already accepted jobs.”
  - [Actual answer, line 33](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:33): “Verify each accepted job's effects and eventual visibility”
  - [Actual answer, line 34](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:34): “backlog count and oldest-job age”
  - [Actual answer, line 34](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:34): “Variable service time, skew, and stragglers can make individual-job recovery later than this count-based estimate.”
  - [Actual answer, line 35](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:35): “Record job-size distribution and byte capacity.”
  - [Actual answer, line 36](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:36): “Validate any proposed 65+ jobs/s dependency capacity or ≤80-second startup with a representative recovery exercise”
- **read-only — pass (2/2), critical.** Separates arithmetic/modeling from an unrun recovery exercise; every project and candidate file currently matches its recorded snapshot.
  - [Actual answer, line 38](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/capacity-planning/answer.md:38): “No such exercise was run here; the conclusion is a local-evidence capacity model”

Arithmetic: 12000 after startup; 20/s net drain; 600 s after startup and 720 s overall; 2400 at the deadline; at least 65/s required; 80 s maximum startup or 36/s counterfactual accepted arrival rate. All correct.

Intervention assessment: None consequential. Retains all accepted work and identifies that lowering accepted demand changes the given scenario.

Scope honesty: Constant-rate fluid estimates and separate verification of effects/visibility are explicit.

### overload-control / tenant-fanout

Verified source rubric SHA-256: `2e45593ecf899eee040f39374a35b3598ae9b1dae324867f1c9b2bd08a377656`.

- **budget-scope — pass (2/2), critical.** Identifies the possible 480-query load and coordinates active/idle consumers, pools, fan-out, bypass paths and topology within a provisional fleet allocation.
  - [Actual answer, line 7](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:7): “4 pods × 40 reports × 3 concurrent queries = 480”
  - [Actual answer, line 7](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:7): “against a service allocation of 100 connections”
  - [Actual answer, line 7](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:7): “A per-pod cap neither establishes a fleet database cap nor proves fairness.”
  - [Actual answer, line 15](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:15): “Include synchronous reports, asynchronous workers, persistence, retries, authentication queries, maintenance, and idle pooled connections.”
  - [Actual answer, line 33](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:33): “New pods receive portions of the same 90, not another fixed 40 or 90.”
- **fairness — pass (2/2), critical.** Defines trusted tenant/class lanes, occupancy-weighted fair scheduling, bounded waiting, protected B capacity and observations for objective success and starvation.
  - [Actual answer, line 9](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:9): “Classify metadata and export work from the authenticated route and validated work shape, not a caller-supplied priority.”
  - [Actual answer, line 37](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:37): “Account in **connection-milliseconds**, as well as enforcing hard connection counts.”
  - [Actual answer, line 41](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:41): “Use deficit round-robin or an equivalent work-conserving scheduler with bounded cost credits across authenticated tenant/class queues.”
  - [Actual answer, line 45](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:45): “at most eight waiting requests and 512 KiB of retained request state fleet-wide; maximum queue wait 20 ms”
  - [Actual answer, line 83](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:83): “Validate B's 100 ms objective at the agreed percentile”
  - [Actual answer, line 83](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:83): “Validate positive durable and common tenant shares with no starvation.”
- **ownership — pass (2/2), critical.** Persists and accounts for accepted exports; caller detachment never prematurely frees live execution permits or permits dropping accepted work.
  - [Actual answer, line 51](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:51): “**The age ceiling closes new intake; it never deletes or expires an accepted job.**”
  - [Actual answer, line 53](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:53): “Commit a durable registry record”
  - [Actual answer, line 53](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:53): “safe handoff around this boundary must be verified before implementation.”
  - [Actual answer, line 55](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:55): “retains the database and admission permits until all issued operations actually stop or finish.”
  - [Actual answer, line 55](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:55): “A persisted export's ownership never belongs to the disconnected HTTP request.”
- **feedback-recovery — pass (2/2), major.** Separates useful-work and fast-rejection populations, bounds retries, incorporates offered/backlog demand into capacity decisions, and specifies a controlled measured reopening process.
  - [Actual answer, line 59](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:59): “Use one retry owner, at most one additional attempt, a finite overall deadline, and jittered backoff that respects Retry-After.”
  - [Actual answer, line 63](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:63): “The 1 ms rejection response population never enters the execution latency baseline or useful-completion histogram.”
  - [Actual answer, line 67](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:67): “Autoscaling must not treat fast failures or fewer completed requests as reduced demand.”
  - [Actual answer, line 73](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:73): “These are provisional thresholds to validate.”
  - [Actual answer, line 86](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:86): “no oscillation or renewed connection exhaustion for at least ten minutes after the recovery ramp.”
- **read-only — pass (2/2), critical.** All numeric settings and validation are proposals; the answer disclaims executed tests. Every project and candidate file currently matches its recorded snapshot.
  - [Actual answer, line 3](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:3): “It is a proposed design, not an implemented or tested result.”
  - [Actual answer, line 79](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/overload-control/answer.md:79): “No load, cancellation, crash, or recovery test has run.”

Arithmetic: Four 40-report caps with three-query fan-out allow 480 operations. 12+12+60+6=90 and 24+24+21+21=90. Conditional 15 versus 1500 connection-ms costs and four export slots at 500 ms serving 480 jobs in 60 s of static drain work are consistent.

Intervention assessment: None consequential. New numeric allocations, queue/deadline/controller thresholds and payload limits are explicitly provisional and require real contract/measurement validation; live permits and accepted jobs survive overload. Connection isolation is not claimed to prove CPU/I/O fairness.

Scope honesty: Opening protection claim is qualified by proposed design and later healthy-capacity/percentile/ingress/dependency limitations; no executed proof is claimed.

### database-performance / pool-and-lock

Verified source rubric SHA-256: `a18b5d02539bd3641fc7673758c1219e794710f2efbb8557f22a964dea4347fe`.

- **wait-boundary — pass (2/2), critical.** Keeps pool acquisition, PostgreSQL transaction-ID lock waits and isolated plan execution distinct without adding p99 values or extrapolating endpoint capacity.
  - [Actual answer, line 3](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:3): “The sampled two-second acquisition p99 is evidence of an additional client-side queue.”
  - [Actual answer, line 3](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:3): “their p99 values cannot simply be added.”
  - [Actual answer, line 5](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:5): “It does not measure incident lock contention, acquisition, provider time, network/result delivery, or endpoint completion.”
- **transaction-contract — pass (2/2), critical.** Targets transaction/lock lifetime only where provider work is independent; otherwise requires an invariant-preserving coordination/reconciliation design before changing behavior.
  - [Actual answer, line 15](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:15): “Target the observed blocking transaction's lifetime.”
  - [Actual answer, line 15](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:15): “Keep the dependent balance read/check/update and commit within the existing enforcing transaction boundary.”
  - [Actual answer, line 17](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:17): “If the provider action must be coordinated with the balance mutation, a naive move outside the transaction is unsafe.”
  - [Actual answer, line 17](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:17): “a durable reservation/pending state and idempotent completion protocol may be needed”
- **validation — pass (2/2), major.** Calls for aligned incident deltas, blocker/age evidence, a fleet budget and matched hot-account contention/endpoint checks before further indexes or larger pools.
  - [Actual answer, line 9](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:9): “No query shape, index definition, slow incident plan, selectivity problem, or buffer/spill evidence justifies another index.”
  - [Actual answer, line 11](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:11): “a safe shared connection budget has not been established.”
  - [Actual answer, line 21](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:21): “Sample `pg_stat_activity`, blocker relationships and transaction ages while requests are queued.”
  - [Actual answer, line 21](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:21): “Difference `pg_stat_statements` counters across the same interval”
  - [Actual answer, line 23](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:23): “Include a hot-account case, ordinary independent accounts, provider failure/timeout, cancellation and retries.”
- **read-only — pass (2/2), critical.** The answer recognizes execution semantics of EXPLAIN ANALYZE and labels all proposed runtime work unexecuted; every project and candidate file currently matches its recorded snapshot.
  - [Actual answer, line 30](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:30): “`EXPLAIN ANALYZE` executes the statement and is not authorized by this read-only review”
  - [Actual answer, line 32](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/database-performance/answer.md:32): “No database commands, index builds, pool changes or performance experiments were executed”

Arithmetic: Does not add pool, lock and endpoint percentiles. No unsupported numerical performance gain is asserted.

Intervention assessment: None consequential. Provider wait relocation is conditioned on independence; irreversible/coordinate-dependent work requires durable reservation/reconciliation before any split. Index/pool changes are rejected on present evidence.

Scope honesty: Standalone plan, sampled contention and proposed validation are separated.

### data-layout-performance / ring-history

Verified source rubric SHA-256: `2351b459ecac066606052d40492307434eb6aef1707bcc09e0fd96a800505e39`.

- **retained-horizon — pass (2/2), critical.** Identifies repeated retained slots including accidentally equal averages; defines clamping by requested count, observations seen and capacity, with explicit empty/zero-volume API outcomes.
  - [Actual answer, line 3](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:3): “Once overwritten history is requested, modulo indexing visits current slots repeatedly.”
  - [Actual answer, line 4](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:4): “instrumentation visits observations `[4, 5, 6, 4, 5, 6]`”
  - [Actual answer, line 5](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:5): “deliberately document the empty/zero-volume outcome”
  - [Actual answer, line 7](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:7): “set `available = min(head, capacity)`, then `n = min(count, available)`, and query logical indices `[head - n, head)`.”
- **criticality — pass (2/2), critical.** Applies serial-model limits to the measured endpoint wall-time fraction and keeps the 80%-CPU batch case a separate candidate.
  - [Actual answer, line 13](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:13): “a true 10× aggregation speedup yields `1 / (0.98 + 0.02/10) = 1.0183×` endpoint speedup: a 1.8% latency reduction.”
  - [Actual answer, line 13](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:13): “Even eliminating aggregation entirely caps that modeled reduction at 2%.”
  - [Actual answer, line 17](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:17): “The separate batch workload spending 80% of **CPU** in scans is a justified experimental target for dense buffers/native reductions.”
- **measurement — pass (2/2), major.** Rejects four-row universal claims; includes allocation/conversion/ingestion, equivalent retained windows/numeric semantics, working-set scale and repeated matched measurements.
  - [Actual answer, line 11](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:11): “One run on four rows supplies no variation, representative working-set evidence, or reproducible comparison”
  - [Actual answer, line 11](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:11): “Fancy indexing allocates gathered copies; index construction, conversion, product/reduction temporaries, ingestion, and result packaging belong in the production cost boundary.”
  - [Actual answer, line 4](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:4): “Tests must check membership/counting as well as the final scalar”
  - [Actual answer, line 15](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:15): “representative capacities/query sizes, append/query ratios, and repeated interleaved runs”
- **read-only — pass (2/2), critical.** Separates actual local correctness checks from absent production/performance evidence; every project and candidate file currently matches its recorded snapshot.
  - [Actual answer, line 9](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:9): “These are local correctness checks on CPython 3.14.3/macOS arm64, not production performance evidence.”
  - [Actual answer, line 19](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/data-layout-performance/answer.md:19): “No project or candidate files were changed.”

Arithmetic: Evaluator reproduced 540 positive-size cases with 168 numerical mismatches on the unchanged source. Endpoint 10x-kernel bound = 1.0183299389x speedup / 1.8% reduction; infinite-kernel bound = 2% reduction; separate 80%-CPU 10x-kernel case = 3.5714285714x.

Intervention assessment: None consequential. Proposed datatype/reduction/layout changes must preserve numeric and retained-window semantics. API invalid-input requirements are design proposals; project is unchanged.

Scope honesty: Local correctness checks and runtime identity are explicitly scoped away from production performance and p99/capacity claims.

## Independent checks and interpretation

Arithmetic was recomputed from the fixtures. The unchanged ring source was executed in an evaluator-only local check without importing or writing project files; the independent deque oracle reproduced 540 cases and 168 numerical mismatches. This corroborates the ring correctness finding and the report’s numbers. It does not convert the original self-report into a complete host trace or supply performance evidence.

The overload policy contains many proposed numeric settings. Its budgets, queue bounds, payload limits and recovery thresholds are clearly labeled provisional and gated on real payload, timing, ingress, contract and dependency validation. The database and pool-ownership proposals also explicitly stop short of moving authoritative or irreversible behavior without verifying semantics. These qualifications are sufficient for the design/review cases; they are not deployment acceptance.

No skill correction is justified by a consequential failure in this six-case sample. Wider corpus, nontrigger, capability-enforced and runtime evaluations remain untested; the scores establish no comparative improvement. The candidate snapshots and project inputs are preserved.
