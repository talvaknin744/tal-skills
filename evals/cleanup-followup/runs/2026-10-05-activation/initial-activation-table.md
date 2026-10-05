# R3 initial activation baseline

Candidate identity is frozen R1: SHA-256 `549db23329b73a249ce556687bac79d35ffc4d11b646b892c67894d97c72860e`. The R3 normalized Codex package manifest and R3 run manifest are kept separately under `identities/`.

The initial activation matrix contains 34 skills × 3 attempts = 102 attempts. 101 executed, 1 timed out. The timeout was `go-backend--cancelled-fanout`, replicate 01; the skill body read was observed before timeout, and no token count was emitted for that run. No capacity retries occurred.

The concurrent runner lasted 616.829 seconds wall-clock; summed responder elapsed time was 3357.079 seconds. Token counts are available for 101/102 attempts; the timed-out call emitted none. No billed cost data was emitted. Token usage and elapsed walltime are reported per skill and per attempt. Reasoning tokens are usage metadata only; no reasoning text is retained here. This measures activation and runtime only, not response quality.

| Skill | Body reads | Replicate statuses | Wall time (s) | Input tokens | Output tokens | Cost |
|---|---:|---|---:|---:|---:|---|
| `a2a-engineering` | 3/3 | executed, executed, executed | 56.107 | 153,708 | 1,762 | not emitted |
| `background-maintenance` | 3/3 | executed, executed, executed | 161.460 | 121,371 | 3,903 | not emitted |
| `code-and-docs-cleanup` | 3/3 | executed, executed, executed | 92.748 | 252,856 | 2,913 | not emitted |
| `concurrency-correctness` | 3/3 | executed, executed, executed | 187.442 | 270,641 | 4,059 | not emitted |
| `distributed-system-patterns` | 2/3 | executed, executed, executed | 113.562 | 138,049 | 4,964 | not emitted |
| `failure-oriented-testing` | 1/3 | executed, executed, executed | 96.412 | 200,843 | 3,363 | not emitted |
| `graceful-draining` | 3/3 | executed, executed, executed | 103.636 | 188,901 | 4,271 | not emitted |
| `idempotency` | 1/3 | executed, executed, executed | 61.953 | 132,630 | 1,788 | not emitted |
| `infrastructure-change-safety` | 3/3 | executed, executed, executed | 132.754 | 174,593 | 4,056 | not emitted |
| `legacy-code-changes` | 3/3 | executed, executed, executed | 114.163 | 125,054 | 3,626 | not emitted |
| `mcp-engineering` | 3/3 | executed, executed, executed | 82.812 | 174,716 | 2,438 | not emitted |
| `messaging-reliability` | 2/3 | executed, executed, executed | 62.996 | 135,310 | 1,413 | not emitted |
| `microservice-boundaries` | 3/3 | executed, executed, executed | 64.285 | 111,272 | 2,472 | not emitted |
| `microservice-data` | 3/3 | executed, executed, executed | 58.064 | 112,860 | 2,069 | not emitted |
| `microservice-extraction` | 3/3 | executed, executed, executed | 71.902 | 111,390 | 2,731 | not emitted |
| `microservice-integration` | 3/3 | executed, executed, executed | 93.882 | 114,071 | 2,060 | not emitted |
| `microservice-operations` | 3/3 | executed, executed, executed | 81.990 | 141,018 | 3,523 | not emitted |
| `microservice-testing` | 0/3 | executed, executed, executed | 45.097 | 105,249 | 1,359 | not emitted |
| `recovery-validation` | 2/3 | executed, executed, executed | 74.930 | 185,965 | 2,882 | not emitted |
| `stream-processing-design` | 3/3 | executed, executed, executed | 91.224 | 115,753 | 3,660 | not emitted |
| `technical-deprecation` | 0/3 | executed, executed, executed | 71.759 | 109,157 | 2,303 | not emitted |
| `go-backend` | 3/3 | timed_out, executed, executed | 302.962 | 256,217 | 4,048 | not emitted |
| `python-backend` | 2/3 | executed, executed, executed | 185.986 | 218,391 | 2,383 | not emitted |
| `typescript-backend` | 2/3 | executed, executed, executed | 69.018 | 176,009 | 2,113 | not emitted |
| `capacity-planning` | 3/3 | executed, executed, executed | 109.607 | 222,945 | 3,920 | not emitted |
| `data-layout-performance` | 2/3 | executed, executed, executed | 65.493 | 125,231 | 2,289 | not emitted |
| `database-performance` | 3/3 | executed, executed, executed | 67.973 | 141,711 | 2,488 | not emitted |
| `load-testing` | 3/3 | executed, executed, executed | 65.077 | 110,915 | 2,479 | not emitted |
| `overload-control` | 3/3 | executed, executed, executed | 164.070 | 203,148 | 7,662 | not emitted |
| `performance-diagnosis` | 2/3 | executed, executed, executed | 62.332 | 121,241 | 1,867 | not emitted |
| `temporal-ai-workflows` | 3/3 | executed, executed, executed | 67.328 | 176,431 | 2,296 | not emitted |
| `temporal-production-readiness` | 2/3 | executed, executed, executed | 74.120 | 121,939 | 2,710 | not emitted |
| `temporal-reliability` | 2/3 | executed, executed, executed | 126.347 | 179,112 | 2,669 | not emitted |
| `temporal-safe-deployments` | 3/3 | executed, executed, executed | 77.588 | 151,468 | 2,935 | not emitted |
