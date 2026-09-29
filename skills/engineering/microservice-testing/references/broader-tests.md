# Broader tests and feedback cost

Use this reference for tests spanning services, shared environments, cross-functional requirements, or live-system checks.

For an end-to-end test, name the essential user journey and the integration risk it covers. Keep coverage for local variants in smaller tests. Retain broad tests where real composition matters; reducing suite size is useful only when the removed test's confidence is preserved or its risk is deliberately accepted. Agree on ownership for diagnosing failures that cross team boundaries.

Record the deployed artifacts and configuration for each run. Give data a test-specific identity and cleanup path, isolate concurrent runs, and wait on observable conditions with a deadline. Treat non-determinism as lost diagnostic value: record the first failure, classify product versus environment behavior, and fix or quarantine it with an owner and a coverage plan. Repeated reruns until green do not demonstrate a trustworthy release gate.

For performance, define the workload, data volume, latency percentile, throughput, and error threshold before interpreting results. Compare equivalent environments and note differences from production. Measure realistic journeys to locate bottlenecks, then add focused regressions where they give faster feedback. A small fixture passing locally cannot prove production capacity.

For robustness, choose a concrete failure such as a slow dependency, lost response, unavailable instance, or delayed message. State the required user-visible outcome and recovery bound. Prefer local doubles or an authorized test environment for injection. A test of timeout handling should measure resource release and completion behavior, not merely check that a timeout option exists.

Production smoke tests, synthetic transactions, or canary observation require task authorization covering the target action and environment. Specify isolated test identities, downstream side effects, cleanup, observation, and stop conditions before running them. If execution is outside scope, deliver the prepared scenario and acceptance criteria. Completion means the suite supplies useful evidence with known runtime, diagnosis ownership, and limits; passing broad tests is not a reason to version or release every service together.
