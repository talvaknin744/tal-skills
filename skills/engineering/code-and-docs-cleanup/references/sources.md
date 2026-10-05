# Source cards and reading scope

Original synthesis from repository research checked 2026-09-29. Reading scopes
record that research's inspected material; availability does not imply a full-book
read. No source prose, examples, or book files are redistributed. The skill's MIT
license applies only to its authored material.

## Refactoring

Martin Fowler with Kent Beck, *Refactoring: Improving the Design of Existing
Code*, second edition, 2018. Research read the complete official
[opening chapter](https://www.thoughtworks.com/content/dam/thoughtworks/documents/books/bk_Refactoring2-free-chapter_en.pdf),
printed pp. 1–44, with a code-layout spot check on p. 38. The full
[web edition](https://martinfowler.com/articles/access-refactoring-web-edition.html)
requires registered book access and was not read. PDF SHA-256:
`6a763eef4eb2f2274f6e4e53c9afd3be7aa35024cb24e89ffc48637de96c5880`.

- **Trigger/failure:** structure obstructs an evidenced change; broad cleanup
  alters behavior or adds speculative abstraction.
- **Application:** small transformations with self-checking feedback, separated
  from intentional behavior changes.
- **Limit/counterexample:** fewer lines need not improve clarity; the chapter's
  particular object design is not a universal template.
- **Verification:** relevant expected outcomes survive each step and the resulting
  structure makes the selected maintenance task easier.

## Software Engineering at Google

Titus Winters, Tom Manshreck, Hyrum Wright, *Software Engineering at Google:
Lessons Learned from Programming Over Time*, first edition, 2020. Complete
[official HTML](https://abseil.io/resources/swe-book) available, CC BY-NC-ND 4.0;
research read complete chapters 9, 10, 12, 14, and 15 with examples. Official mirror
observed at `e9e24835cb889fe25251cb9ec6d51b79233e358d`.

| Read chapter | Trigger and application | Limit and verification |
| --- | --- | --- |
| [9: Code Review](https://abseil.io/resources/swe-book/html/ch09.html) | Review the promised change with distinct, bounded concerns | Human review research does not establish equivalent agent review; each finding needs a concrete correction and evidence |
| [10: Documentation](https://abseil.io/resources/swe-book/html/ch10.html) | Consolidate conflicting authority, preserve prerequisites and audience needs | Tutorial/reference repetition may be useful; try the affected reader path |
| [12: Unit Testing](https://abseil.io/resources/swe-book/html/ch12.html) | Preserve public behavior through restructuring and keep scenarios legible | External interactions can be contractual; a changed outcome must fail a check |
| [14: Larger Testing](https://abseil.io/resources/swe-book/html/ch14.html) | Choose evidence retaining the risky dependency boundary | A fake is not isolation/packaging proof; name real and substituted parts |
| [15: Deprecation](https://abseil.io/resources/swe-book/html/ch15.html) | Inventory and migrate consumers before removing supported behavior | Quiet telemetry does not establish obsolescence; verify remaining consumers |

No Google-specific test ratios, ownership systems, or production-chaos defaults
are adopted. Keeping independently changing policies separate is this workflow's
application of maintenance and testing principles.

## Differential behavior preservation

PostHog, [I wrote a 70x faster SQL parser while barely looking at the code](https://posthog.com/blog/sql-parser),
2026-06-24. Complete substantive first-party Markdown article read, including
generation, shrinking, regressions, and shadow rollout.

- **Trigger/failure:** a replacement agrees on familiar cases but changes a
  less common promised behavior.
- **Application:** decide oracle authority and permitted differences before editing;
  retain minimized disagreements and independent contract examples.
- **Limit/counterexample:** corpus agreement can preserve a bug. Performance claims
  were not reproduced; shadowing a pure parser does not justify duplicate effects.
- **Verification:** compare relevant outputs and replay counterexamples against
  the final candidate, stating the explored domain.

## Responsibility boundaries in migrations

Research read complete substantive prose/code from Sentry's
[incremental TypeScript conversion](https://blog.sentry.io/slow-and-steady-converting-sentrys-entire-frontend-to-typescript/)
(2021-04-12) and Tailscale's
[spiky file descriptors investigation](https://tailscale.com/blog/case-of-spiky-file-descriptors)
(2022-09-15). Chart measurements were not reproduced. Sentry's frontend experience
informs bounded cleanup; backend application is an inference. The
[TypeScript handbook](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
crosscheck covered erased assertions, not runtime validation.

Tailscale informs ownership tracing, not a universal leak diagnosis. The
[autocert Manager crosscheck](https://pkg.go.dev/golang.org/x/crypto/acme/autocert#Manager)
covered HostPolicy, GetCertificate, and HTTPHandler: acquisition policy does not
reject cached certificates or protect the fallback. Test new acquisition with an
empty cache; if endpoint access must be retired, verify the separate routing policy
with both empty and warm caches. The incident's DNS/cache-expiry explanations
remain hypotheses.

The [Python cancellation crosscheck](https://docs.python.org/3/library/asyncio-task.html#task-cancellation)
read TaskGroup, cancellation, timeout, and shield in displayed Python 3.14.7 docs.
It supports preserving owned-work cleanup and cancellation propagation, not a
claim of remote rollback. Current runtime-specific use requires checking the
installed version; no runtime migration or benchmark was reproduced by the skill.
