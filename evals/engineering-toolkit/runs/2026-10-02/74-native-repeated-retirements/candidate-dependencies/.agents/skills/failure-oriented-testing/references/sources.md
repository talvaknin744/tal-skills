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

## Stable recovery and delayed confirmations

TigerBeetle, matklad, [Simulation Testing For Liveness](https://tigerbeetle.com/blog/2023-07-06-simulation-testing-for-liveness/),
2023-07-06. Complete substantive article read, with linked [failure
report](https://github.com/tigerbeetle/tigerbeetle/issues/913), [repair
fix](https://github.com/tigerbeetle/tigerbeetle/pull/934), and relevant loops/exclusions
in the [pinned simulator](https://github.com/tigerbeetle/tigerbeetle/blob/9ff5f4a470ed6d66b4be535e689c39eee9f24993/src/simulator.zig).
The reference adapts its bounded progress experiment; quorum, retained data, and
fault assumptions remain explicit. The linked seed was not replayed.

Antithesis, Conrad Shock, [When did the bug start?](https://antithesis.com/blog/2026/causality_analysis/),
2026-05-11. Complete article text read; linked talk, underlying simulation reports,
and statistical method were not inspected. The account motivates preserving
causal prefixes while varying later schedules. Reported discovery rates were not
reproduced and no race-detector comparison was supplied.

The etcd maintainer discussion and changed files in [PR
21399](https://github.com/etcd-io/etcd/pull/21399), merged 2026-03-01, qualify that
account: delayed replies for the same read can remain valid after a retry.
[PR 21375's later correction](https://github.com/etcd-io/etcd/pull/21375#issuecomment-3997236858)
states the earlier change did not fix stale reads. The paired controls in
`fault-histories.md` are an application inference; they preserve logical effect
identity while testing attempt correlation and authority. No etcd reproduction or
new agent evaluation was executed for this addition.

## Explicit state models

Trail of Bits, JP Smith, [State Machine Testing with Echidna](https://blog.trailofbits.com/2018/05/03/state-machine-testing-with-echidna/),
2018-05-03. Complete substantive prose, model, commands, and counterexamples read
2026-10-01. The historical Solidity/Haskell API was not executed and is not a
current installation prescription. One prose sentence reverses the locked and
unlocked outcomes; the code and falsifying histories provide the consistent
interpretation. Finite generated agreement is not a proof over all histories.

The reference generalizes independently specified state transitions to the
project's own lifecycle. Current [Hypothesis stateful documentation](https://hypothesis.readthedocs.io/en/latest/stateful.html),
6.168.3 displayed, was checked for rule-based models, bundles, initialization,
preconditions, and after-step invariants. Its database comparison illustrates an
independent simple model; preconditions that exclude an operation do not test
that operation's rejection behavior. The rejection partition, seeded-defect
sensitivity, and real-boundary limits are this repository's application.
