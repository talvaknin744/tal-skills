# Book-skill validation

The eleven skills have **33 authored scenarios**: two relevant cases and one nontrigger per skill. The shared corpus checker validates their structure and fixture isolation; it does not execute an agent.

## Completed first trials, 2026-09-29

Separate agents from the skill authors completed the first positive scenario for each skill using copies of the candidate and raw fixture. They received the user prompt and skill, with evaluator rubrics withheld. Some agents completed two or three different skill trials in one session; these are not independent repetitions or a randomized comparison.

All eleven first trials completed. Across their **59 criteria**, reviewers recorded **58 pass, one partial, and zero fail**. There were no failed critical criteria. The partial was enterprise-patterns validation: the answer chose a useful design but left the shared rule-change test's inputs and expected result too abstract. The skill's verification step was subsequently sharpened to require concrete inputs and expected decisions, values, or invariant relationships, with illustrative assumptions labeled.

| Skill | First case | Initial result |
|---|---|---|
| microservice-boundaries | modular-monolith-fit | 5/5 criteria pass |
| microservice-extraction | rollback-after-new-writes | 5/5 criteria pass |
| microservice-integration | mixed-version-response | 5/5 criteria pass |
| microservice-data | saga-interleaving | 5/5 criteria pass |
| microservice-testing | unknown-api-consumers | 5/5 criteria pass |
| microservice-operations | retry-amplification | 5/5 criteria pass |
| legacy-code-changes | member-shipping-threshold | 6/6 criteria pass |
| pragmatic-programming | policy-ownership | 5/5 criteria pass |
| enterprise-application-patterns | domain-logic-choice | 5 pass, 1 partial |
| distributed-system-patterns | search-topology | 6/6 criteria pass |
| object-design-patterns | lifecycle-policy | 6/6 criteria pass |

The initial result is retained rather than replaced by a later run. The [initial summary](runs/2026-09-29/initial-summary.json) separates critical gates from weighted noncritical scores. Detailed [microservices scores](runs/2026-09-29/microservice-scores.json) and [other-book scores](runs/2026-09-29/other-scores.json) include criterion-level evidence and limitations.

## Targeted refinement and rerun

A fresh agent completed the same enterprise case with the revised verification step and no access to earlier answers or scoring. A separate reviewer recorded **6/6 criteria pass (12/12)**, including concrete illustrative inputs and expected pricing outcomes through HTTP and batch. The assumptions were labeled, and the response did not claim runtime validation. All eight rerun input hashes were independently verified unchanged. See the preserved [rerun answer](runs/2026-09-29/enterprise-application-patterns-retest/answer.md) and [score record](runs/2026-09-29/enterprise-retest-scores.json).

This makes **12 completed trials across 11 skills**. Each skill's latest scored trial meets all its case criteria. One observation motivated one instruction refinement; this is not a controlled estimate of an improvement in success rate.

## Deterministic checks

`npm run validate` passed after the final skill edit: **164 repository tests passed**, with no failures or skips, plus packaging and local skill-reference validation. The **77 book-corpus checks** are a subset of that total and cover all 33 authored cases. The complete [repository validation log](runs/2026-09-29/repository-validation.log) is retained. Python's optional creator validator could not start because PyYAML was unavailable; the repository's Node/YAML checker validated the required metadata and portable references.

## Evidence and limits

Each skill's directory under [the run folder](runs/2026-09-29/) contains its answer, a command summary, and SHA-256 input manifest. Evaluators independently verified all **85** first-trial skill/project files were unchanged, with no missing or extra files. The manifests describe the copied trial inputs; the current boundaries source note later extended one page locator from 218 to 218–219, and the enterprise workflow changed after its partial result. The other nine first-trial candidates match the delivered skill content.

These are bounded, review-mode smoke trials. No nontrigger case, second positive case, implementation-mode task, or repeated statistical trial was executed. They do not establish activation accuracy, general reliability, or production correctness. Prototype or arithmetic checks reported in answers are distinct from exercising a real service or database.

The tool restrictions were communicated as instructions; unavailable enforcement is a **capability deviation** from a strictly controlled run. Command summaries report no prohibited web or subagent use by the trial agents, but they are not complete independently captured tool transcripts. Scores assess the observed answers and recorded evidence, not strict harness compliance. Exact model version, sampling settings, elapsed time, and token metrics were not exposed and are recorded as unavailable.

Candidates were uncommitted during the trials, so input hashes identify them rather than a claimed release commit. Original sandbox paths remain in the preserved logs; corresponding answers, summaries, and manifests are archived here. PDFs, extracted source text, and duplicate installed skill trees are not part of the run archive.

Follow [the repository evaluation guide](../README.md) for controlled reruns, nontrigger trials, or blind comparisons. Run `node --test tests/book-skills/evals.test.mjs` for the corpus checks and `npm run validate` for the repository checks.
