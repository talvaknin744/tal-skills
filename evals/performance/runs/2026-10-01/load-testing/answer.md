# Assessment of the capacity claim

The expensive-feature run does **not** establish capacity for 1,000 requests/s. It establishes that the recorded completions from an 80-user, self-paced workload returned HTTP 200 with the expected content at 80 completed requests/s, against one cached entity in a 100-row dataset. The missing duration, outstanding-work accounting, and environment details further limit that observation.

Each virtual user waits for its response before sending another request. With one request per iteration and no sleep or retry, the steady-state relationship is approximately:

`completed requests/s = active users / mean iteration duration in seconds`

The reported numbers follow that relationship: `80 / 0.1 = 800 requests/s` for the light configuration and `80 / 1 = 80 requests/s` for the expensive feature. The second run's completion rate is 90% lower than the first and only 8% of the stated peak demand. Even the light run completed only 800 requests/s. These are observed rates under the closed workload, not proven maximum capacities.

Production arrivals are independent: clients continue arriving when responses slow. This test instead reduces offered traffic as responses slow, hiding the queues, rejections, timeouts, or generator limitations that might arise at a sustained 1,000 arrivals/s. Error-free completed responses cannot make the second run a passing capacity test. There is also no stated latency objective against which to assess its approximately one-second mean iteration duration.

## Missing evidence

- **Demand and service objective:** production operation proportions, peak duration and burst shape, payload sizes, tenant/key skew, connection behavior, retries, and a latency deadline and permitted failure rate for each operation class.
- **Representative state and correctness:** the production-scale 10-million-row working set, uncached reads, writes, indexes and payloads, and an oracle for correct write results. The existing test exercises a narrow warm-cache read path.
- **Traffic accounting:** scheduled, started, completed, failed, rejected, timed-out, interrupted, and unfinished work; timestamps and measurement boundaries; whether any work completed after the measurement window. Generator-dropped starts were not recorded, and this closed workload has no independent 1,000/s arrival schedule to reconcile.
- **Measurement and resources:** client elapsed latency distributions by operation and outcome, connection and pool wait where relevant, generator CPU/memory/network/available users, and target CPU, memory, queues, connection pools, cache behavior and dependency saturation. Generator or server limits cannot be located from the current report.
- **Reproducibility and comparison:** test script/configuration, target and generator topology and limits, software versions, feature configuration, run duration, warmup, repeated runs and variation. There is insufficient evidence that all conditions except the expensive feature were matched.

## Proposed workload and procedure

1. **Define the pass condition before execution.** Specify whether 1,000 requests/s means external HTTP attempts or logical business operations; retries and fan-out change this mapping. Set per-class deadlines/percentile objectives and a correctness and failure budget. Require verified delivered demand, correct on-time completions, bounded outstanding work and resources over the required peak duration. A numerical latency/failure verdict remains unresolved until those objectives exist. Identify the authorized target, maximum offered rate and resource budget, and stop conditions for error rate, queue growth, dependency distress or generator saturation.

2. **Prepare production-like state separately from measurement.** Seed approximately 10 million rows with representative sizes, indexes, tenant/key distribution and write state. Derive the read/write/uncached-read mix from production evidence rather than inventing percentages. Include realistic key popularity instead of a single shared cache hit. Declare warm/cold cache conditions, authentication, TLS, connection reuse, payloads and any production retries. Verify read content and mutation results; for asynchronous writes, record acceptance and eventual business completion separately with deadlines.

3. **Use an open arrival schedule.** For example, configure a k6 arrival-rate executor so scheduled starts continue despite slower responses. If an iteration contains exactly one HTTP request, 1,000 iterations/s maps to 1,000 attempted requests/s only when those iterations actually start and dispatch. Otherwise report the explicit mapping and achieved request rate. An observed one-second mean suggests roughly 1,000 concurrently active iterations at 1,000/s, but this is a sizing estimate, not a guarantee; provision and validate additional headroom for latency tails and client overhead. Record dropped starts and generator utilization. If the generator cannot deliver the schedule, increase its capacity and perform a new measured run before claiming target capacity.

4. **Run matched feature-off and feature-on trials.** A concrete initial proposal is five minutes of unmeasured warmup; ten-minute plateaus at 250, 500 and 800 arrivals/s; then 30 minutes at 1,000/s. Extend the target plateau to cover the actual production peak duration. Repeat each condition at least three times from equivalent seeded state and declared cache conditions. Preserve each run rather than averaging away variation. The proposed rates and durations are experiment choices, not facts established by the report.

5. **Bound overload and recovery.** After the target plateau, step demand upward in 10% increments for five minutes per step up to the agreed maximum or stop condition. Add the production-observed burst shape when available. Reduce demand to a low baseline for ten minutes and observe queue drainage, restored latency, correctness and resource recovery. Add a sustained soak when maintenance, memory growth or resource leakage could invalidate the required operating period. These phases identify the objective boundary and failure/recovery behavior; exceeding it is an observation, not automatically a failure of the protected demand class.

## Reporting plan and decision

For every run and phase, retain configuration/data identity, timestamps, duration, warmup exclusion, environment limits and feature state. Report scheduled arrival rate, actual starts and HTTP attempts, generator-dropped starts, correct on-time throughput, success/failure/rejection/timeout counts, and outstanding or interrupted work at the boundary. Reconcile scheduled work with started plus dropped work, and started work with terminal plus outstanding work. Document any residuals, retries and completions during the final drain.

Report client elapsed p50/p95/p99 and deadline exceedance counts separately for each operation and outcome; keep connection/pool wait and server execution distinct. If using k6, HTTP duration alone omits initial connection establishment. Preserve unfinished work as censored/outstanding observations instead of omitting it or treating it as zero latency. Compute aggregate quantiles from compatible observations or histograms with sample counts and bucket resolution, rather than averaging per-instance p99 values. Include time series for target and generator resources, queues, delivered traffic and recovery, and show variation across repetitions.

The expected useful observation is where correct on-time throughput stops tracking delivered arrivals, objectives are exceeded, or queues/resources grow without recovery. A 1,000 requests/s claim is supported only for the tested mix, data, environment, duration and stated objectives when delivered demand and outcomes reconcile. The current capacity claim remains unsupported; its narrower successful-completion observation remains useful evidence for the cached workload.

Evidence: [benchmark.md](/var/folders/90/lpd23hr9221dznf3g69l0dqr0000gn/T/tal-performance-forward-iwz035dh/load-testing/project/benchmark.md). This assessment used local evidence only and did not execute a load test or change the project.
