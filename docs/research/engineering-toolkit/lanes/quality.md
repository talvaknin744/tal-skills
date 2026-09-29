# Quality, testing, and language engineering research

Checked 2026-09-29. This lane surveys ten distinct publishers and deeply reads four articles. [quality.json](quality.json) records publisher identity, access, exact reading scope, candidate articles, and each adopted practice's trigger, failure, mechanism, conditions, counterexample, and verification. The publisher set is curated for relevance, not ranked by popularity. Company experience suggests hypotheses; current runtime documentation establishes API behavior.

## Findings worth turning into agent behavior

1. **Follow resource ownership through migrations.** Tailscale traced periodic connection growth through sockets, goroutine stacks, and certificate provisioning configuration. The transferable review question is which old component still accepts responsibility after traffic moves. Avoid diagnosing every resource increase as a leak. [Tailscale investigation](https://tailscale.com/blog/case-of-spiky-file-descriptors)
2. **Test the implementation actually deployed.** Trail of Bits fuzzed a Python package's native decoder with sanitizer instrumentation. A Python fallback can exercise different failure modes. The fuzz harness must declare whether its oracle targets memory safety, accepted input, or application behavior. [Native-extension fuzzing](https://blog.trailofbits.com/2024/02/23/continuously-fuzzing-python-c-extensions/)
3. **Make behavioral disagreement durable.** PostHog used an existing parser as an oracle, generated discrepancies, and shrank them into regression cases. A cleanup or replacement agent should identify the authoritative behavior and permitted differences before editing; it should reread relevant specifications when fixing a counterexample. [Parser replacement account](https://posthog.com/blog/sql-parser)
4. **Keep migrations bounded and uncertainty explicit.** Sentry separated incremental typing work from broader refactoring and kept unresolved types visible. Apply that idea to backend changes through small dependency slices, while treating runtime input validation as a separate obligation. [TypeScript migration account](https://blog.sentry.io/slow-and-steady-converting-sentrys-entire-frontend-to-typescript/)

These accounts do not establish universal performance gains, guaranteed bug elimination, or permission to copy production traffic. In particular, a pure parser can be compared in shadow mode without the duplicate external effects that an order-creation handler would produce.

## Current technical crosschecks

- **Go ownership:** derived contexts need their cancellation functions called. Cancellation signals stopping; waiting for owned work to finish remains a separate coordination responsibility. Inspect request context propagation and resource closure on success, error, and cancellation. [Go context](https://pkg.go.dev/context)
- **Certificate boundaries:** `autocert.HostPolicy` governs acquisition of new certificates, not cached certificates, and does not protect `HTTPHandler`'s fallback. A migration test must cover warm and empty caches; removing an allowlisted hostname alone is not a general access-control boundary. [autocert Manager](https://pkg.go.dev/golang.org/x/crypto/acme/autocert#Manager)
- **Native fuzzing:** confirm instrumentation and imported binary, retain crashes outside disposable containers, and pin a compatible build. Atheris documents a macOS limitation for its sanitizer preload option. Disabling leak detection is a tool-specific compromise, not evidence that leaks are harmless. [Atheris guide](https://github.com/google/atheris/blob/master/native_extension_fuzzing.md)
- **TypeScript:** assertions disappear during compilation. Test untrusted payload rejection through the real decoding boundary instead of counting annotations. [Type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
- **Reproduction:** Hypothesis's local example database and opaque replay blobs can become invalid across changes. Retain explicit regression inputs; reset external state and control the aspects of scheduling that determine pass/fail. [Replay guide](https://hypothesis.readthedocs.io/en/latest/tutorial/replaying-failures.html), [flaky failures](https://hypothesis.readthedocs.io/en/latest/tutorial/flaky.html)
- **Python cancellation:** use cleanup paths that propagate cancellation after releasing owned resources. `TaskGroup` waits for owned tasks; swallowing `CancelledError` can disrupt its semantics. A timeout or cancellation request does not establish that a remote effect was rolled back. [Python task cancellation](https://docs.python.org/3/library/asyncio-task.html#task-cancellation)

## Existing-skill overlap audit

Read the complete entrypoints for `architecture`, `pragmatic-programming`, `legacy-code-changes`, `microservice-testing`, and all three productivity skills.

| Existing coverage | Preserve | Addition boundary |
|---|---|---|
| Architecture | Evidence, constraints, conditional specialists, explicit missing validation | Language agents inspect runtime-specific details; they do not open a full architecture panel for routine code changes. |
| Pragmatic programming | Concrete changeability goal; observed coupling; smallest intervention | Cleanup removes evidenced maintenance burden, not every repeated expression or helper. |
| Legacy code changes | Characterization before behavioral edits; minimal seams; distinguish fakes from integration proof | Cleanup invokes characterization when coverage is missing; it does not manufacture approval to alter observed behavior. |
| Microservice testing | Risk-to-test mapping, real dependency boundaries, preserved flaky evidence | Failure-oriented testing owns generated histories, adversarial schedules, shrinking, and reproducible counterexamples; service compatibility stays here. |
| Learning plan / retrieval coach / learning experiments | Measured practice, assistance recorded, fresh checks, bounded time | Reading paths can reference these skills when the user is learning. Engineering agents should not force interactive quizzes into implementation tasks. |

No entrypoint defect requiring an immediate change was established in this read. The main risk is adding overlapping instructions to the new skills and agents. Keep detailed testing mechanics in one skill and route to them conditionally.

## Prioritized implementation recommendations

**P0 — cleanup contract:** require a specific maintenance problem, preserved behavior, and a bounded diff. Keep comments explaining constraints or incidents. Removing runtime validation, exception handling, retry bookkeeping, or apparently redundant synchronization requires evidence about its actual responsibility. A green typecheck alone cannot justify it.

**P0 — lifecycle evidence:** language-agent results should identify who owns background tasks, connections, transactions, and cancellation cleanup. Distinguish local completion from unknown remote outcomes. Use existing idempotency and concurrency skills for cross-process guarantees.

**P1 — failure-oriented testing:** select a property or oracle, generate valid and invalid inputs, preserve a minimal counterexample, and prove it fails before the fix. State the explored domain and remaining integration gap. Test logs must identify the exact implementation and runtime version.

**P1 — native role boundaries:** the quality reviewer proposes evidence-backed cleanup findings. The assigned implementation owner edits overlapping files. Reviewers need the final diff and executed evidence, not only the owner's summary.

**P2 — corpus maintenance:** revisit technical examples when runtime versions change. Discord's surveyed language-migration article explicitly concerns old Go versions; it must not become a blanket current recommendation to rewrite Go services.

Suggested evaluation cases: cancelling a request while its child owns a connection; suppressing decoder exceptions in a logic-fuzzing harness; a TypeScript cast over an invalid JSON payload; deleting a comment that documents an operational invariant; and a parser replacement that agrees with its oracle except on an explicitly authorized bug fix. Include a nontrigger such as a prose spelling correction that needs neither fuzzing nor an architecture review.
