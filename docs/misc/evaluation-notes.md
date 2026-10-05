# Study-skill validation — 29 September 2026

Three authored cases live under `evals/learning-plan`, `evals/retrieval-coach` and `evals/learning-experiments`, with fixtures separate from rubrics. Four fresh subagent runs were performed: one case for each skill, followed by a fresh rerun of learning-plan after a discovered issue. Each received the candidate skill, relevant references and fixture, without the rubric or intended answer. No baseline comparison or repeated statistical evaluation was performed.

These are **limited forward smoke tests**, not a fully instrumented execution of the repository's controlled evaluation protocol. Model/settings, elapsed time and token usage were inherited and not separately recorded. Capability restrictions were instructions, not sandbox-enforced; full tool traces and workspace diffs were not archived. The parent inspected final responses and preserved the observable excerpts below. No claim of proven learning gains follows.

| Case/run | Observed result | Assessment |
|---|---|---|
| learning-plan, initial | Budget summed to 360 minutes, protected papers stayed closed, actual progress was respected; however three diagnostic questions and their solutions appeared together | Failed diagnostic-integrity check discovered during review |
| learning-plan, revised | Three appointments summed to 360 minutes; one diagnostic question appeared without a solution, followed by a request for the attempt | Meets the inspected case criteria |
| retrieval-coach | Resumed the single unanswered item, preserved future targets and rejected mastery from a solution-assisted final-answer report | Meets the inspected case criteria |
| learning-experiments | Chose a twenty-minute replacement, distinguished a ratio-test error from fatigue, and left the fresh delayed result pending | Meets the inspected case criteria |

## Observed evidence

The initial planning response put “Check your attempts against these explanations” immediately after the diagnostic and supplied the answers. The skill was changed to require presenting only the first diagnostic question and waiting. The corresponding criterion was added to the rubric after observing the failure; it was not a pre-registered criterion.

The revised planning response stated: “Total: 360 minutes, including setup, breaks, feedback and logging.” It retained both papers as protected, identified deferred scope, and presented only the improper-integral question. It ended that step with: “Send your attempt for feedback in English; solutions stay withheld until you attempt it.”

The recall response stated: “Matching a solution’s final answer doesn’t establish independent mastery; your homework remains unverified and solution-assisted. S1’s overdue review stays open, with 30 September and 3 October still scheduled.” It asked the original Hebrew P1, gave no answer or counterexample, and retained reserved-paper protection.

The experiment response identified “a ratio-test limit of 1 is inconclusive,” separated fatigue as a possible contributor, and rejected a tablet or a fixed visual-learning identity as established needs. Its allocations were 3 + 7 + 7 + 3 = 20 minutes, replacing copying. It proposed replacing five minutes of a future review with a fresh problem and explicitly marked the result pending rather than claiming success.

The tests cover one path per skill, with one revision. Long-term state retention, mathematical marking across diverse topics, actual calendar integration and learning effectiveness remain untested. The recorded snippets are excerpts, not reconstructed complete tool traces.

## Deterministic validation

All three skills passed the bundled `quick_validate.py` frontmatter/scaffold validator. Its missing PyYAML dependency was installed in a temporary validation directory, without changing repository dependencies. `npm run validate` passed packaging checks and all 164 existing repository tests (zero failures). README and productivity-document links, evaluation JSON and fixture paths were also checked. These checks validate packaging and existing repository behavior; they are not 164 tests of learning outcomes.

The 40 new transcript reviews were separately checked against raw-source SHA-256 values and caption word counts. The exported ledger contains 91 matched reviews, 552,329 reviewed words and one known gapped source. This validates provenance consistency, not perfect transcription accuracy.
