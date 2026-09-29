# Source cards and reading scope

Original synthesis carried forward from repository research checked 2026-09-29.
The scopes below describe that research's actual reading, not a claim that the
entire books were read. No book prose, source code, or source files are bundled.
MIT covers the authored skill, not the referenced publications.

## Software Engineering at Google

Titus Winters, Tom Manshreck, Hyrum Wright, *Software Engineering at Google:
Lessons Learned from Programming Over Time*, first edition, 2020. The
[official complete HTML edition](https://abseil.io/resources/swe-book) is available
under CC BY-NC-ND 4.0. Research read complete chapters 9, 10, 12, 14, and 15,
including examples; this skill draws on [12, Unit Testing](https://abseil.io/resources/swe-book/html/ch12.html)
and [14, Larger Testing](https://abseil.io/resources/swe-book/html/ch14.html).
Official mirror observed at `e9e24835cb889fe25251cb9ec6d51b79233e358d`.

- **Trigger/failure:** tests track internal structure or a fake-based pass is
  presented as a deployment guarantee.
- **Application:** assert promised behavior; describe real/substituted boundaries,
  state preparation, observation, and maintenance responsibility.
- **Limit/counterexample:** interactions can themselves be contractual; Google's
  internal ratios and scale are not defaults for this skill.
- **Verification:** a harmless restructuring passes; a changed promised outcome
  fails; dependency claims are checked at an appropriate real boundary.

## Effective Software Testing

Maurício Aniche, *Effective Software Testing: A Developer's Guide*, first edition,
2022. Research accessed the [publisher catalog](https://www.manning.com/books/effective-software-testing)
and public introductions/headings for chapters 1, 2, 5, and 10. Complete book text
and complete chapters were not recovered. Findings rely on complete author articles:
[specification-based cases](https://www.effective-software-testing.com/it-is-not-about-following-a-recipe)
(2022-05-18), [coverage](https://www.effective-software-testing.com/why-do-developers-hate-code-coverage)
(2021-11-18), [mock coupling](https://www.effective-software-testing.com/mocking-and-coupling)
(2023-03-23), and [proportionate effort](https://www.effective-software-testing.com/do-I-systematically-write-tests-all-the-time)
(2022-03-14).

- **Trigger/failure:** habitual edge cases or high coverage hide missing domain
  assertions.
- **Application:** derive partitions from requirements, then use uncovered paths
  to question omissions; retain the oracle's independent justification.
- **Limit/counterexample:** simple settled behavior does not need a formal campaign;
  a mock interaction may represent a real promised effect.
- **Verification:** a representative seeded defect changes an asserted outcome.
  This skill's sensitivity check is an operational adaptation, not quoted text.

## Differential testing case study

PostHog, [I wrote a 70x faster SQL parser while barely looking at the code](https://posthog.com/blog/sql-parser),
2026-06-24. Complete substantive first-party Markdown article read: motivation,
two implementations, generated inputs, shrinking, retained regressions, and shadow
rollout. Performance and production outcomes were author-reported, not reproduced.

- **Trigger/failure:** replacement overfits a corpus or silently changes grammar.
- **Application:** specify oracle authority and allowed differences; shrink and
  retain disagreements, then revisit the governing specification.
- **Limit/counterexample:** an old oracle can encode a bug; pure-parser shadowing
  does not authorize duplicate external effects.
- **Verification:** explicit counterexamples plus independent input families;
  finite agreement is not all-input equivalence.

## Native fuzzing and replay

Trail of Bits, [Continuously fuzzing Python C extensions](https://blog.trailofbits.com/2024/02/23/continuously-fuzzing-python-c-extensions/),
2024-02-23. Complete substantive article, harness, build/crash discussion, and CI
sections read. Research also read the complete [Atheris instrumentation guide](https://github.com/google/atheris/blob/master/native_extension_fuzzing.md)
and Hypothesis [replay](https://hypothesis.readthedocs.io/en/latest/tutorial/replaying-failures.html)
and [flaky-failure](https://hypothesis.readthedocs.io/en/latest/tutorial/flaky.html)
guides, whose displayed version was 6.168.3. These references were not executed
as a native-fuzzing experiment; verify current tool/platform behavior when applying.

- **Trigger/failure:** the harness tests a Python fallback, lacks instrumentation,
  or discards the only useful counterexample.
- **Application:** identify the imported build, fail invalid setup, declare allowed
  rejections, and retain explicit replay inputs outside disposable state.
- **Limit/counterexample:** tolerated parser exceptions in a memory-safety harness
  can hide application failures in a logic harness. Linux preload behavior is not
  automatically portable to macOS; disabled leak detection leaves a coverage gap.
- **Verification:** replay a relevant known defect under the identified build and
  show the selected assertion or sanitizer detects it before claiming coverage.

Controlled fault histories, completion criteria, and finite-budget reporting are
the repository's application of these sources. A sequential model does not prove
real concurrency, transaction isolation, or crash durability.
