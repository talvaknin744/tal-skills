# Review of the deprecation evaluation correction

Reviewed 2026-09-29. **No actionable correctness, scope, or overfitting issue found** in the ten added lines of `skills/engineering/technical-deprecation/references/migration-gates.md`. The correction is ready for a separate rerun. **The rerun has not yet been executed as part of this review; the original partial result remains unchanged.** This is an instruction-diff review, not a revised behavioral score.

The reviewer authored neither this correction nor the evaluated answer. Review inspected the exact before/after reference, the original frozen score and rubric, and the answer's relevant rollout, recovery and removal sections under `/tmp/tal-deprecation-score-02/`. Only this report was written; candidate instructions, raw evidence, rubric and scores were not edited. No model call, migration or external action was performed.

## Observed issue and bounded correction

Original run `02-positive`, case `config-channel-migration`, correctly rejected the unsafe proposal and diagnosed consumer coverage, semantic conversion and recovery problems. The independent score nevertheless records three omissions:

| Original criterion and score | Omission | General correction reviewed |
| --- | --- | --- |
| `staged-rollout-and-adoption`: 1, critical | Compatible new consumers and writer/default paths lacked a concrete guard against additional legacy adoption. | Separate readers from producers, defaults, templates and editors; apply migration and adoption controls by compatible cohort while retaining entitled legacy use. |
| `rollback-boundary`: 1, critical | The pilot was called bounded, but concrete stop/escalation behavior was postponed to a future owner. | Each proposed batch names its stop condition, halting role and bounded escalation point for missing progress or recovery evidence. Unknown assignments remain explicit. |
| `retirement-evidence`: 1, major | Readiness and isolated rehearsal were specified without observations proving what the shipped release actually removed. | After authorized removal, inspect the shipped boundary and observe legacy-use and supported controls. Reviews and plans specify these observations without claiming execution. |

The other three criteria retain score 2. The original `task_outcome` remains `partial`; `unresolved_critical_partial` retains the first two criteria and `unresolved_major_partial` retains `retirement-evidence`. The recorded `case_compliant: false` and capability qualifications remain intact, alongside `observed_scope_breach: false`. This review neither rescored nor waived any result.

## Scope and source assessment

The new wording uses general configuration/persisted-format and retirement conditions. It embeds no case-specific cohort counts, product names, release numbers, field names, dates or expected answer. The changes strengthen actions already present in the skill rather than introduce another workflow or a mandatory program for private-helper cleanup. The entrypoint and activation description are unchanged.

The surrounding policy, compatibility, recovery and authorization gates still apply. Cohort compatibility does not grant permission to withdraw promised support. A bounded escalation point is chosen for the actual batch; the correction invents no universal time limit, grace period, personnel assignment or authority to contact others. Inspecting a shipped boundary can use the released artifact or an authorized target; the wording supplies no new permission for live effects. Review and planning modes explicitly leave execution unclaimed.

Chapter 15 supports the underlying principles of identifying dependencies, preventing renewed use, explicit ownership and observable intermediate progress. The concrete separation of configuration readers/writers, bounded batch escalation and post-release controls is an operational application of those principles, not a claim that the chapter prescribes this exact procedure. Google-specific tooling, staffing and deliberate outages remain optional context rather than requirements. [Software Engineering at Google, Chapter 15](https://abseil.io/resources/swe-book/html/ch15.html).

The initial static review found no source or scope defect; the later behavioral run exposed omissions despite that review. This correction record supplements the earlier review without rewriting it or treating structural validity as evidence of behavioral success.

## Checks and evidence identity

Executed the installed `quick_validate.py` against the skill: exit 0, `Skill is valid!`. `git diff --check` passed for the exact correction from commit `45592bc7f37bd7eabc603c122dbc37a834f694a8` to `3c7d3617b691f40e7797cce4146b6b8641431310`; the reference diff contains ten additions and no deletions. The old reference hash also matches the original trial's installed reference. No new local links were introduced.

| Artifact | SHA-256 |
| --- | --- |
| Original `migration-gates.md` | `5d7ce0fbc2e3e2762d06ae8b22d6d642c10e4984eaa458df39fb5c87e8a653b3` |
| Corrected `migration-gates.md` | `8506ea7f7407a726c7f718efb6cc53471d474ebded7ab747016d2feac37d5f8d` |
| Unchanged `SKILL.md` | `93de2ce8f37d07a4bbe4d124c2b5d4860620451db16546090081020292d085cc` |
| Original `score.json` file | `54efabc06f96a62580cfa1a2dcc884982febfe4d890d152df230adba14d1a7a5` |
| Original `rubric.json` wrapper file | `762213c10a48f84b81e69b92d24cdef912f2c1062e4ce2bb8adb8b9e7539ce4a` |
| Original `evidence/answer.md` | `277c408a0fb88d386c9487ccb781da38b140addc22578ec7a165a820b1de4ec5` |
| Original `evidence/run.json` file | `8849a5dac79f7fed291af971cdd2a5cdfda7ccfd93aed37324edabebc5c82add` |

The original score binds candidate tree `5db6626f69f2363865d6cf7d47687002f6d804af4772e5d5185a46efa84f1eea`, rubric content `0037eb5b2afbda5208809ffec3f4ba733961a5cc3035be9cf1168f12fc7dab86`, and run evidence `c4ca5e2e5878bac70c26e76cd03242724f476cc1ebeea84651646630e1b3bf28`. Those content bindings differ intentionally from hashes of the JSON wrapper files. Any rerun needs its own candidate binding, observations and independent score.
