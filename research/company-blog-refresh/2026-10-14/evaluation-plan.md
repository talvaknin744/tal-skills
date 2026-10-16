# Company blog refresh evaluation plan

This plan applies the existing change evaluation contract to the October 14 company blog refresh. It separates preservation of existing behavior, new capability behavior, normal discovery and packaging. A completed crawl, corpus check, native process or generated adapter does not establish a behavioral pass.

The selected implementation scope is one new `agent-evaluation` package and extensions to `performance-diagnosis` and `database-performance`. Their descriptions remain unchanged for the two existing skills. The wider schema, clock, fairness and retry topics below are conditional coverage if later instruction edits adopt those findings. Research alone does not require an unrelated case roster.

## Selected preservation and capability cases

| Candidate | Existing cases against the revised candidate | New cases and discovery observations |
| --- | --- | --- |
| `performance-diagnosis` | `held-pool`, `throttled-container`, `format-only` | Execute both new trace evidence positives and their new nontrigger from `cases-v2-trace-evidence.json`. |
| `database-performance` | `pool-and-lock`, `cardinality-skew`, `transaction-only` | Execute both new pooler compatibility positives and their new nontrigger from `cases-v2-pooler-compatibility.json`. |
| `agent-evaluation` | No prior package or prior behavioral result is available. | Execute `refund-success-without-effect` three times, `biased-repeated-trial-report` three times and `pure-helper-assertion` once in fresh normal discovery sessions. |

This selects 19 responder attempts if all declared cases are ready: six unchanged regression cases, six supplemental extension cases, six positive discovery observations for the new skill and one new skill nontrigger. Each positive discovery case needs at least two observed candidate body reads in its three fresh attempts. A strong answer without an observed read can still receive a task score, but does not establish the candidate's activation or its causal contribution.

## Conditional topic coverage

| Finding adopted into instructions | Relevant unchanged coverage | Existing focused capability coverage | Boundary requirement |
| --- | --- | --- | --- |
| Online schema evolution | Infrastructure `schema-cutover-window`, `three-pod-rollout`, `terraform-comment` | Integration `backfill-recreated-identity`, `shard-publication-rollback-floor-v2`, `migration-comment-only` | Distinguish writer overlap, stale work and publication readiness from a comment edit. Preserve the earlier schema case and its retained input audit. |
| Clock handling and cancellation | Operations `retry-amplification`, `canary-metric-gap`, `stylesheet-review-nontrigger` | Integration `go-deadline-handoff`, `python-cancellation-completion`, `duration-format-nontrigger` | Distinguish serialized clock domains and completed cancellation from a static duration label. |
| Tenant fairness and residency | Overload `tenant-fanout`, `adaptive-feedback`, `status-copy` | Integration `resident-reserve`, `delivery-and-dependency`, `local-label-rotation` | Include queued and prefetched residency, actual reclaim, useful completion and a finite local preview boundary. |
| Retry coordination and observability | Operations `retry-amplification`, `canary-metric-gap`, `stylesheet-review-nontrigger` | Add a focused case for any new retry owner, observation or recovery contract. | Use the supplied attempt counts and distinguish effect identity from a pure GET retry loop. If idempotency instructions change, preserve its existing `pure-get-backoff-nontrigger` and relevant effect recovery cases. |

These conditional cases remain unexecuted in this refresh unless their associated instruction behavior changes. Existing historical results remain bound to their earlier candidate identities.

## Native runner and immutable staging

Use [the refresh helper](../../../scripts/evals/company-blog-refresh.mjs) over the unchanged [evaluation library](../../../scripts/evals/lib.mjs). The helper registers four narrow suites and snapshots complete packages, selected raw fixtures, cases, private rubrics, runner files and package lockfiles outside the checkout. Supplemental case files become exact byte aliases named `cases.json` in an external source view. The staging manifest retains original names, byte hashes, mode bits, origin HEAD and each alias mapping. Original corpora and historical evidence are unchanged.

Do not stage until all writers finish and root generation and canonical integration are complete. Changes to any candidate, case, fixture, rubric, runner or dependency need a new stage and fresh trial paths. Origin HEAD is context for uncommitted files. Complete package tree hashes identify the actual candidate, and `candidate_commit` remains null until an exact committed source association exists.

```sh
TASK_EVAL_ROOT="$(mktemp -d)/company-blog-refresh"
TASK_CODEX_BINARY="/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex"
node scripts/evals/company-blog-refresh.mjs stage --out "$TASK_EVAL_ROOT"
node scripts/evals/company-blog-refresh.mjs prepare \
  --repo "$TASK_EVAL_ROOT/views/company-blog-refresh-regression" \
  --freeze "$TASK_EVAL_ROOT/freezes/company-blog-refresh-regression.json" \
  --skill performance-diagnosis --case held-pool \
  --out "$TASK_EVAL_ROOT/trials/performance-held-pool-01"
node scripts/evals/company-blog-refresh.mjs run \
  --trial "$TASK_EVAL_ROOT/trials/performance-held-pool-01" \
  --binary "$TASK_CODEX_BINARY" --execute --timeout-ms 600000
node scripts/evals/company-blog-refresh.mjs score-inputs \
  --trial "$TASK_EVAL_ROOT/trials/performance-held-pool-01" \
  --out "$TASK_EVAL_ROOT/grading/performance-held-pool-01"
```

Create `trials` and `grading` parent directories before using those example paths. The helper's other suites are `company-blog-refresh-trace`, `company-blog-refresh-pooler` and `company-blog-refresh-agent`. Use the same helper for prepare, run, verifier execution, scoring input creation and score validation because its in-process suite registry is required to resolve those frozen identities. Keep normal positive and nontrigger prompts verbatim. Do not add an explicit skill invocation to make normal discovery pass.

The native runner owns at most two execution slots. The user's authorization for 20 parallel research agents does not replace that existing runner limit. Check a slot's recorded PID before any stale lock recovery. Each retry gets a fresh trial and retains the failed or partial original attempt.

## Host observations and limits

Metadata preflight on the desktop bundled Codex 0.160.1 observed the staged candidate in a catalog of 54 skills and reported inherited `gpt-6.1-sol` with `xhigh` reasoning. It also reported requested read only sandbox mode, approval policy `never` and disabled child agents. This was metadata only, with no responder turn or behavioral score. Model settings remain inherited for the actual attempts and must be recorded from those attempts.

The older PATH Codex 0.142.5 failed preflight because it rejects the invocation's `agents.enabled=false` setting. That unsuccessful probe is retained externally. The historical default binary path in `lib.mjs` is absent in this host layout, so pass the tested bundled path explicitly. Claude Code 2.1.285 is installed, but no current candidate behavioral trial or authenticated host execution is established. Structural host installation and invocation metadata checks do not close this Claude gap.

Filesystem reads are not jailed to the trial directory. Global, system and plugin guidance remains inherited. No web and external service restrictions are instructed, but not fully enforced for every inherited tool. Requested sandbox settings are not independent enforcement proof. Retain `case_compliant: false` and the original capability deviations, while scoring the observable answer separately. Single skill execution disables child agents and does not test native workflow coordination or production infrastructure.

## Independent grading and publication record

After every terminal attempt, retain the exact prompt, metadata discovery, native observable trace, final answer, before and after inventories, allowed changes, workspace diff, elapsed time and available usage. Score no hidden reasoning. Preserve raw artifacts outside the source tree. Public transformations must retain original and published hashes plus the reason, including personal path masking and omitted reasoning payloads. Never silently rewrite a sealed run or historical score.

Give a reviewer who authored neither the candidate nor responder answer only the frozen grading packet and its private rubric. Each criterion gets score 2, 1 or 0 with an exact observable artifact locator and a supporting observation. Report critical gates separately, weight major criteria at 2 and minor criteria at 1, and keep a partial critical criterion unresolved. Adjudicate disputed critical judgments independently and preserve both initial scores and the resolution.

Validate each completed score with the helper's `check-score` command. A blocked, timed out or invalid attempt is retained as that outcome and cannot become a passing behavior record. Implementation cases also need the supplied verifier independently executed against a fresh final project copy. The selected review and nontrigger cases require unchanged raw fixtures, so score their answer and recorded input integrity directly.

Publish the original and supplemental results separately, with attempt IDs, exact candidate and freeze hashes, responder host and inherited settings, body read evidence, independent criterion scores, actual checks, efficiency observations and unexecuted coverage. Run `npm run validate` and `npm run check:generated` after integration. These structural results remain separate from agent behavior. No baseline comparison, causal uplift or universal host or production guarantee is claimed from these forward observations.

## Versioned source and capability follow up

The first external stage was retained without responder execution after its new staging guard failed a test through the macOS temporary directory alias. The corrected guard resolves the existing destination parent before comparing containment and also rejects a source directory symlink. The original failed assertions remain unchanged. A later cold filesystem timeout is retained separately from the subsequent three passing helper checks.

The r02 stage executed all 12 extension cases plus one observation of the initial `agent-evaluation` candidate. Its six remaining initial agent invocations were intentionally prevented before any model request after the named sibling fallback contract was corrected. Fresh trial directory refusal and explicit scheduling receipts record that disposition. The r03 candidate remained staged only after another handoff phrase correction. Neither staged candidate is represented as final behavioral evidence.

The final agent package is frozen separately in r04, with tree SHA256 `650872c043064bb5c7a4392cd68bafaa1e0ea4247ed61b86e4a9641f19d179cf`. The preserved initial agent observation uses `9dffe272c13cf08d048f24864d986a3039da210c918e02eb6451b5203af47f6f`. Its independent major criterion partial remains visible. No rubric or capability requirement was relaxed in response.

The original `throttled-container`, `pool-and-lock` and `cardinality-skew` observations used web search despite their declared `web: false` capability. Their raw prompts, traces and rubric scores remain retained. The original prompt frame did not encode that declaration, and the inherited host did not enforce it. These rubric results cannot establish the declared no web conditions.

The follow up uses a separately hashed external wrapper for three fresh unchanged case retries and all seven final agent observations. It injects `web_search="disabled"` after the `exec` or `app-server` subcommand, keeps model settings inherited and preserves the raw case prompts. The [official configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) documents this setting as removing the built in tool. A metadata only preflight observed `disabled` with the inherited model and reasoning settings. Earlier global override placement produced no observed setting and is retained as an unsuccessful probe, with no responder execution.

Each final packet seals the wrapper source, wrapper SHA256 `62645780d053ca8859c30a65a48656ed3ffeeb6a8ae2d67e4a9391baf0824140`, effective native arguments and the sanitized preflight record. This improves the specific built in tool constraint. Other MCP tools, command network behavior and filesystem read isolation remain unverified, so `case_compliant: false` remains explicit. The final matrix contains 19 governing observations, with three replaced capability observations and one initial agent observation retained separately, for 23 actual responder executions if every scheduled follow up completes.

## Grounded future trial report correction

All three r04 refund plans omitted the same existing major repeatability requirement. Their partial scores and full critical passes remain unchanged. The subsequent instruction repair makes the future trial report state its fresh session and state, identities and settings, limits and artifact capture, applicable success and refusal or error boundaries, and unknowns that still need capture. It also distinguishes local oracle sensitivity from a future agent trial plan. Case prompts, descriptions, fixtures and rubrics remain unchanged.

The repaired r05 package has tree SHA256 `b7ca2295d82249968f739a4fd49ae7483af24e13fd7c3f45f1af98893ba07e24`. Seven fresh observations ran on the same hashed web disabled wrapper with inherited model settings. Both positive cases observed candidate body reads in three of three attempts. No candidate body read was observed for the nontrigger. All seven captured zero external or delegation events, with the broader host deviations still retained.

The [versioned execution manifest](../../../evals/company-blog-refresh/runs/2026-10-14/execution-manifest-v2.json) records 30 actual responder executions and 19 governing observations against their exact candidates. Eleven prior observations, including the seven r04 agent results, remain separately retained. The original execution manifest is unchanged and scoped to its earlier candidate stage. Reused raw basenames are disambiguated by stage, exact candidate and run evidence hashes. New scores use the `scores/r05` namespace, preserving every earlier filename. Independent grading and [the review](../../../evals/company-blog-refresh/runs/2026-10-14/independent-review.md) remain separate from this execution account. These forward results do not establish causal improvement or a production guarantee.

The independent reviewer scored all seven r05 observations at 2 on every criterion and validated their exact score bindings and gates. Current extension coverage also retains all criteria at 2, using the separately identified no web retries for the three original capability breaches. The original four major partials and all host limitations remain visible. Literal quote and retention audit evidence is owned by the independent review, with archive bindings recorded separately.
