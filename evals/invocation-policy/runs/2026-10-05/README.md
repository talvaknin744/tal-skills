# Phase 2 invocation-policy evaluation

Six selected final trials ran on native Codex CLI 0.160.0 with inherited
`gpt-6.1-sol` / `xhigh`. Each used a fresh project, withheld rubrics, normal
skill discovery, restricted filesystem/network profiles, and observable traces.
An independent worker was requested with `gpt-6-luna`; the response model and
requested evaluator model are recorded separately in each score.

| Case | Corpus | Critical criteria | Weighted major score | Observation |
| --- | --- | --- | --- | --- |
| [tal-cleanup-review](tal-cleanup-review/score.json) | Existing native workflow | 4/4 satisfied | 10/12 | Bounded edit and native reviewer; original Python reader check remains partial |
| [ordinary-pr-nontrigger](ordinary-pr-nontrigger/score.json) | Existing architecture | 2/2 satisfied | 4/4 | Correct pagination finding, no architecture loading or edits |
| [offline-standard-review](offline-standard-review/score.json) | Existing architecture | 2/2 satisfied | 12/12 | Useful direct reliability review, no edits or children |
| [explicit-workflow](explicit-workflow/score.json) | New positive | 2/2 satisfied | 8/8 | Explicit workflow loading, separate native cleanup reviewer, README-only edit, bound interpreter check succeeds |
| [routine-pagination-review](routine-pagination-review/score.json) | New boundary | 2/2 satisfied | 4/4 | Architecture and eight workflows discoverable; ordinary review stays scoped |
| [unrelated-formatting](unrelated-formatting/score.json) | New nontrigger | 2/2 satisfied | 4/4 | Same discovery inventory; only the requested heading changes |

These are criterion outcomes for one repetition per case, with no paired
baseline comparison. They establish neither uplift nor complete host compliance.
Every collector record retains `case_compliant: false`: tool availability and
confinement of every native tool are not independently enumerated. The offline
case also had multi-agent tooling available despite its declared absence; no
delegation was observed. Claude native behavior was not run. Metadata agreement
and generated package checks cover both hosts separately.

The original workflow run remains `failed-verification` because confined bare
`python3` selected Apple's unavailable xcrun launcher. A supplemental canonical
Homebrew interpreter run prints `ready (legacy)` and exits zero, without changing
the original result. The new positive's first attempt timed out at 180 seconds;
its symlink-based verifier was denied. Its [failure assessment](explicit-workflow/attempt-01-failure-assessment.json)
remains separate. A fresh 300-second attempt supplied the canonical interpreter
as a separate harness context block and completed. Original case prompts and
raw fixtures stayed unchanged. Blocked model-free preflights, preparation
snapshots and corrected serialization/scoring attempts remain in the archive.

[Candidate identity](candidate-identity.json) binds the frozen source. All 1,094
generated files for all 49 public skills and eight workflows across both hosts
match the final source, including modes. [Preservation checks](preservation.json)
cover 1,566 original evaluation files, 49 skill bodies, eight workflow bodies,
308 relocated original package files and 40 licenses. [Installation audit](installation-audit.json)
and [harness adaptation](harness-adaptation.json) record the actual staging and
runner changes. These structural checks do not replace behavioral scoring.

Raw evidence is in `tal-skills-phase2-native-2026-10-05.tar.zst`, SHA-256
`48a8b780d585caa43b66e29cf1d55910efc0734577a7c23fb2f936a1843d5c14`.
All 7,073 regular members were hashed; the 2,894 frozen source files and 32
published artifact bindings were checked against the archive. The asset is
stored outside the repository; upload to the v1.0.0 release is pending Phase 3.
Links into that release asset remain pending until upload. The
[archive manifest](archive-manifest.json) records sizes and inventory identity;
[publication bindings](publication-bindings.json) bind published scores and
answers to their original bytes, including personal-path redactions.
