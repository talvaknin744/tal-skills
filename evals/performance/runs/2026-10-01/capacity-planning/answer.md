The proposed scale-up is insufficient. Under the stated constant-rate assumptions, the retained backlog drains **720 seconds (12 minutes) after recovery start**, missing the ten-minute objective by **120 seconds**. More workers cannot raise useful throughput beyond the dependency's demonstrated **60 jobs/s** limit for this job mix.

The evidence is `project/queue.md`: 7,200 retained jobs initially; 40 accepted jobs/s throughout recovery; zero completions for 120 seconds; then 60 completions/s; no expiry or dropping of accepted jobs. The ten-minute deadline is 600 seconds from recovery start.

The calculation must include both startup arrivals and ongoing arrivals:

- Backlog when workers become ready: 7,200 + 40 × 120 = **12,000 jobs**.
- Net drain rate after readiness: 60 − 40 = **20 jobs/s**.
- Drain time after readiness: 12,000 / 20 = **600 seconds**.
- Total recovery time: 120 + 600 = **720 seconds**.

Equivalently, the modeled backlog is B(t) = 7,200 + 40t for 0 ≤ t ≤ 120 seconds, then B(t) = 12,000 − 20(t − 120) until it reaches zero at t = 720 seconds. This is the point when the accumulated backlog clears while new accepted work continues arriving.

| Recovery point | Ready useful throughput | Accepted arrivals | Backlog | Objective implication |
|---|---:|---:|---:|---|
| Startup, t = 0–120 s | 0 jobs/s | 40 jobs/s | 7,200 → 12,000 jobs | Accepted work must remain durably queued |
| Workers ready, t = 120 s | 60 jobs/s | 40 jobs/s | 12,000 jobs | Dependency binds; 20 jobs/s net drain |
| Deadline, t = 600 s | 60 jobs/s | 40 jobs/s | **2,400 jobs** | Ten-minute objective fails |
| Estimated clearance, t = 720 s | 60 jobs/s | 40 jobs/s | 0 accumulated jobs | Twelve-minute recovery |

The proposal's 7,200 / 60 = 120 seconds treats gross completions as net backlog reduction and omits the 4,800 jobs accepted during startup. Even if arrivals stopped after startup, clearing the enlarged 12,000-job backlog would take 200 seconds after readiness.

With the specified 120-second startup, only 480 seconds remain before the deadline. The required useful completion rate is:

μ ≥ 40 + 12,000 / 480 = **65 jobs/s**.

This is an increase of 5 jobs/s (8.3%) above the demonstrated dependency ceiling. At exactly 65 jobs/s, the model meets the deadline with no timing or throughput margin. An actual scale-up is sufficient only if workers **and the dependency** sustain that end-to-end useful rate for the recovery workload. A larger replica count alone does not establish this.

An alternative within the 60 jobs/s ceiling is to shorten the zero-completion interval to **at most 80 seconds**: 60(600 − startup) must cover 7,200 + 40 × 600, so startup ≤ 80. Keeping some capacity operating during replacement could also reduce the startup deficit; it needs a piecewise model using measured surviving throughput. Improving readiness by at least 40 seconds is the smallest quantified timing change here, but no cost data establishes which intervention is cheapest. Reducing accepted arrivals to at most 36 jobs/s would also satisfy the arithmetic with the current startup, but changes the stipulated 40 jobs/s scenario and cannot be achieved by dropping already accepted jobs.

This estimate assumes constant accepted arrivals, zero service during exactly 120 seconds, immediate sustained service at 60 jobs/s afterward, and no further failures. It also treats job counts as a fluid workload and assumes the measured rate applies to the queued job mix, scheduling, and worker configuration. The following require validation before treating the result as demonstrated recovery:

- Measure useful, correct completions separately from attempts and retries. Verify each accepted job's effects and eventual visibility; a dequeued or acknowledged job alone does not prove the contract.
- Measure the full transition from recovery start, including readiness, warmup, rate changes, dependency saturation, backlog count and oldest-job age. Variable service time, skew, and stragglers can make individual-job recovery later than this count-based estimate.
- Record job-size distribution and byte capacity. Confirm durable queue capacity for at least the modeled 12,000-job peak, accounting for in-flight work and storage overhead. Count capacity cannot establish byte or memory safety.
- Validate any proposed 65+ jobs/s dependency capacity or ≤80-second startup with a representative recovery exercise, recording accepted jobs, correct effects, visibility, and recovery time. If visibility must occur by the ten-minute deadline, include visibility lag within that same budget; its bound is currently unrecorded.

A targeted recovery exercise using the stated initial backlog and arrival rate would test these claims. No such exercise was run here; the conclusion is a local-evidence capacity model, and no cost or failure-headroom envelope beyond the requested no-additional-failures scenario can be established from `queue.md`.
