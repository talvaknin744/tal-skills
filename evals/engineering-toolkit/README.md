# Engineering toolkit evaluations

The original expansion contains **30 authored cases**: two positives and one nontrigger for each of ten new skills, with 20 required first observations. The [scenario index](scenario-index.json) now also includes three follow-up cases for `technical-deprecation`, bringing the registered corpus to **33 cases and 22 required first observations**. Their [separate archive](runs/2026-09-29/technical-deprecation/README.md) contains six independently scored attempts across all three cases; latest results pass, while the original partial and host-confinement limits remain recorded. The [29 September 2026 archive](runs/2026-09-29/skills/README.md) contains **26 executed and independently scored attempts covering those 20 unique cases**. Authored inputs, deterministic checks, model trials, independent scores, runtime examples and native workflow smoke results remain separate evidence.

The initial twenty scored **15 pass, 4 partial, 1 fail**. After six revision reruns, selecting the latest attempt by `(skill, case_id)` gives **17 pass, 3 partial, 0 fail**, with all latest critical criteria scoring 2. Remaining gaps concern Python cancellation before acquisition, Go cancellation before a result send, and a concrete concurrent messaging schedule. Original scores, the separate Python adjudication and the failed cleanup nontrigger are preserved. These observations do not estimate skill uplift. Ten second-positive cases remain authored but unexecuted.

All 26 attempts observed native candidate metadata; the latest ten positives have recorded body reads, while no candidate body read was observed in the latest ten nontriggers. All attempts retain `case_compliant: false` because host capability restrictions were not fully enforced. The [machine-readable summary](runs/2026-09-29/skills/summary.json) separates discovery, correctness, verification and these limitations. The separate [native workflow archive](runs/2026-09-29/native/README.md) records eight latest Codex task/native-behavior passes with isolation limits and the Claude authentication block; [native-planning](native-planning/README.md) retains preparation and reproduction details.

The first positives for Python, TypeScript, Go, failure testing and cleanup require actual fixture edits plus supplied executable checks. CSS, comment and label nontriggers require bounded edits; other nontriggers are direct explanations. Remaining positives are bounded diagnostic reviews. Each case declares its permitted files. All Node fixture verifiers are named `verify.mjs`, outside automatic test discovery. Python verifiers use `-B`; Go verification explicitly runs `go test -race`.

The local [fixture calibration](fixture-validation.json) records the four deliberately faulty implementation starts failing and independent scratch corrections passing. The cleanup fixture passes before and after because behavior must remain stable; separate scoring judges whether the requested useful cleanup occurred. Calibration is not model evaluation.

## Freeze and stage

Run deterministic checks first:

```sh
node --test tests/engineering-toolkit/*.test.mjs
```

The coordinator freezes candidates only after author/reviewer changes finish. A freeze binds complete skill packages, fixture inputs/verifiers, cases, private rubrics, the runner source and root package/lockfiles. Any relevant change requires a new freeze. The commit is not invented for uncommitted content; per-file SHA-256 digests identify the exact snapshots.

```sh
node scripts/evals/cli.mjs freeze --out /tmp/tal-eval-freeze.json
node scripts/evals/cli.mjs prepare \
  --freeze /tmp/tal-eval-freeze.json \
  --skill python-backend --case cancelled-export \
  --out /tmp/tal-python-positive-01
```

`prepare` refuses an existing trial directory or staging under this repository. It copies the selected raw project into `workspace/project` and the whole independently installable candidate into `workspace/.agents/skills/<name>`. It does not preload the body or copy rubrics/answer keys into that workspace. `before/` preserves inputs; `evidence/` and `control.json` remain outside the candidate's working directory. Filesystem reads are **not jailed** to that directory, and global/system/plugin skills remain inherited. These limitations are recorded, not hidden behind the word isolation.

The recorded `command_argv` contains the exact transmitted prompt, including the short project-location frame; `prompt_sha256` hashes that string. `prompt.txt` and `effective-prompt.txt` serialize it with one added final newline, so their whole-file hashes differ from the transmitted-string hash. `case-prompt.txt` likewise preserves the authored case with one added final newline. The frame only permits normally discovered relevant skills; it does not name the candidate, reveal the rubric or give an expected answer.

## Scheduled native execution

The runner is a dry run unless `--execute` is supplied. The coordinator schedules model trials; creating a freeze or preparing a directory does not start one.

```sh
node scripts/evals/cli.mjs run --trial /tmp/tal-python-positive-01
node scripts/evals/cli.mjs run --trial /tmp/tal-python-positive-01 \
  --execute --timeout-ms 360000
```

The default executable is the verified desktop CLI `/Applications/ChatGPT.app/Contents/Resources/codex`; `--binary` can select another explicitly tested executable. The older PATH binary is not substituted silently. The argv uses fresh `exec --ephemeral --json`, the declared read-only/workspace-write mode, invocation-only `agents.enabled=false` and `approval_policy="never"`. Models/reasoning inherit the user's configuration. No saved config, authentication, trust or model preference is edited.

Before the model request, a metadata-only app-server sequence calls `initialize`, `skills/list`, and sanitized `config/read`. It records the staged candidate's name/description/path/enabled status, catalog size and effective model/effort when exposed. It never starts a turn or reads the skill body. If discovery fails, that limitation remains visible; copying files alone is not reported as observed discovery. The model trace can separately establish an actual candidate body read. No matching read is `not_observed`, not proof that no unrecorded loading happened.

At most two runner processes can hold native slots. Existing slot locks are not deleted automatically: check their recorded PID before recovering a stale lock. Do not run separate native workflow processes outside the coordinator's overall schedule merely because these two locks are free.

The runner streams native stdout JSONL and stderr to separate artifacts, captures the last agent answer, terminal event, exit code, usage when provided, before/after file hashes and a workspace diff. It records process completion as `completed`, **never as a rubric pass**. Timeouts, startup/auth/config failures and malformed/incomplete event streams remain distinct. It sends termination/kill to the owned process group, including remaining members after the leader exits; processes that deliberately create another group are outside that cleanup guarantee. No OS process-container isolation is claimed.

All native children inherit `PYTHONDONTWRITEBYTECODE=1`; Python verifier commands additionally use `-B` to avoid mistaking bytecode caches for requested edits. Arbitrary extra files or protected verifier/skill changes remain visible as scope violations. No generic ignore rule hides them. Requested sandbox settings are recorded separately from independently verified enforcement. No-web/external-service restrictions are not fully tool-enforced, so these host observations retain capability deviations and `case_compliant: false`.

## Independent verification and scoring

A verification command recorded in case metadata is a plan, not evidence it ran. After a completed implementation trial, independently execute the protected verifier against a fresh copy of its final project:

```sh
node scripts/evals/cli.mjs verify \
  --trial /tmp/tal-python-positive-01 --check-id independent-01
node scripts/evals/cli.mjs score-inputs \
  --trial /tmp/tal-python-positive-01 --out /tmp/tal-python-score-01
```

`verify` refuses protected input changes and retains `checks.json`, exact command, input hashes, stdout/stderr, exit/timeout and check-workspace changes. It does not mutate the candidate workspace. Cases without a verifier return `not_required`; the scorer inspects their answer/diff directly. Python fixture verification needs Python 3.11+, TypeScript needs Node with the supplied type-stripping flag, and Go needs Go 1.25+ plus supported race-detector configuration. Record any unavailable runtime honestly.

Give the scoring directory to a reviewer who authored neither the candidate nor response. It contains the frozen private rubric, raw/final project, evidence and a blank `score-template.json`; it is created only after candidate execution. The reviewer fills criterion scores with observable artifact/event evidence and independently checks required outcomes. The model candidate must never see that package. Do not request hidden reasoning.

```sh
node scripts/evals/cli.mjs check-score \
  --trial /tmp/tal-python-positive-01 \
  --rubric /tmp/tal-python-score-01/rubric.json \
  --score /tmp/tal-python-score-01/score.json
```

Score validation requires the exact run/output identity, case, candidate hash, actual rubric-content hash, explicit reviewer independence and every criterion once. The final workspace and captured artifacts are sealed after execution; later substitutions are rejected before verification or scoring. A passing implementation score also requires a matching successful independent verifier run. Blocked/incomplete runs and protected-input violations cannot become passing results by assigning all criteria 2; their observations remain available as annotated evidence. Use the repository's [0/1/2 scoring rules](../README.md); critical failures cannot be averaged away. Partial critical outcomes remain unresolved. Preserve failed attempts and fresh reruns; do not overwrite a trial or silently change a rubric after seeing an answer.

Archive selected `evidence/` outputs, scores and freeze manifest under `runs/<UTC-date>/`; preserve checks and trace locators. Review outputs for unrelated inherited configuration/secrets before public commit. If path normalization/redaction is necessary, retain hashes of originals and describe the transformation. Do not publish duplicate skill trees or mutable scratch paths as the only replay identity.

## Scope of the evidence

The [evaluation contract](../../research/engineering-toolkit/evaluation-contract.md) defines the cross-cutting A→B→C rollout, stale-cache-fill, reorder, restore and cleanup checks. The [host feasibility record](../../research/engineering-toolkit/evaluation-host-feasibility.md) documents prior metadata/selection probes and their limits. Native workflow fixtures and planning live in separately owned `native-fixtures/` and `native-planning/`; a native role/workflow smoke is not replaced by a single-skill prompt trial.

These twenty minimum observations support qualitative findings. Without matched controls/repetitions they do not estimate skill uplift or general reliability. Local synthetic checks do not prove live Kubernetes, database, broker, provider or full MCP/A2A conformance. Report actual authored/executed/scored counts and every blocked requirement separately.
