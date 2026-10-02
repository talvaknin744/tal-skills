# Worker-rollout native integration cases

Three authored scenarios are independent of the candidate workflow instructions
and trial responses. Root owns native execution and archive integration. No model
trial ran during preparation. [scenario-manifest.json](scenario-manifest.json)
binds scenario identities and frozen inputs. Each scenario root contains a
withheld `case-index.json` rubric and `control.json` invariants; only its
`tal-worker-rollout/prompt.md` and `rawfiles/` are supplied to the candidate.
Withholding is a staging rule, not OS read isolation.

| Scenario | Candidate task and allowed edit | What it exercises |
| --- | --- | --- |
| [repeated-retirements](repeated-retirements/case-index.json) | Replace `rollout-plan.md`; optional new `handoffs/` and `reviews/` notes. | A/B/C business budget, SIGTERM with buffered/in-flight admission, paused owner, uncertain checkpoint/final receipt and format-2/3 continuation. |
| [deadline-cancellation](deadline-cancellation/case-index.json) | Replace `shutdown-plan.md`; optional new `handoffs/` and `reviews/` notes. | Shared deadline, native call continuing after cancellation, takeover, uncertain RPCs, product intent and accountable cleanup. |
| [local-script](local-script/case-index.json) | Change only `summary.py`. | Finite CSV wording task stays local; no rollout/team expansion. |

The positive deliverables are **planning artifacts**, despite the adapter's
`implementation` mode permitting their requested local edits. They do not test
worker-source implementation, actual persistence, Kubernetes termination or a
real cancellation API. The positive common rubric checks an assigned artifact
owner and independent reviews of the stable candidate. An independent final
evaluator subsequently scores those actual artifacts/events; that scoring is a
different stage from the workflow's own reviews.

## Adapter and host requirements

The existing native adapter selects by workflow name and hardcodes that name's
`prompt.md`/`rawfiles/` paths. Three cases sharing one workflow therefore have
three fixture roots. Prepare one without executing a model:

```sh
node scripts/native-smoke.mjs --case tal-worker-rollout \
  --fixtures evals/worker-rollout-integration/rollout/repeated-retirements \
  --output /tmp/tal-worker-rollout-repeated-prepare-01
```

Root can schedule execution with the same arguments and `--run`, using another
fresh output directory. `--run` prepares again; it cannot reuse a dry-run output.
The default verified binary is `/Applications/ChatGPT.app/Contents/Resources/codex`;
the index bounds positive turns to 600 seconds. The host needs the installed
workflow/role dependency closure, enabled project configuration, an authenticated
persisted app-server root, native named-role dispatch and child-thread inspection,
and workspace writes for the declared artifact. Preserve inherited model and
reasoning settings. The main session can coordinate and own the artifact; a
second coordinator layer is unnecessary.

The single-skill runner disables subagents and its body-read evidence cannot
establish coordinator/owner/reviewer behavior. For native workflow scoring, retain
metadata discovery separately from actual reads, role `agentRole`/parent IDs and
delegation events, path assignments, final candidate digest, reviewer findings,
and any correction/check/re-review chain. Generic children reading role text are
reported as fallback. Missing event evidence is not proof of successful dispatch.

The native collector always prepends `$tal-worker-rollout`. Thus local-script is
an **explicit invocation boundary nontrigger**, not an implicit selection test.
Its prompt omits that invocation, but the collector adds it. A true implicit
selection observation needs a separately controlled unforced turn; neither body
read nor absence of body read is graded as implicit activation here.

`prepared.json` drops unique scenario IDs and acceptance fields, and does not
validate a preexisting source freeze. Root must externally bind the fixture-index
hash and scenario ID, and compare/bind source digests across the selected runs.
The run schema validates an envelope; it does not grade criterion coverage or
independence. Per-file writes are audited afterward; filesystem reads are broad,
global guidance is inherited and configured tool restrictions are not a jail.
Record deviations and case compliance separately from task correctness.

## Calibration and overlap

[calibration.json](calibration.json) records completed local raw-observation
commands. The observers only project supplied JSON and compute finite arithmetic;
they do not execute the source excerpts, clocks, queues or cancellation APIs.
Their exit zero is not a release acceptance. The nontrigger's initial output is
`Finished exports: 2` and `Failed exports: 1`; its changed wording is judged from
the actual final script output and bounded diff.

Existing `rolling-worker-drain`, `shared-grace-budget`, `handoff-ack-loss`,
`deadline-and-outage` and `three-pod-rollout` review cases already cover individual
failure patterns. Earlier native worker-rollout fixtures request read-only
recommendations with no local observation command. These new cases combine the
contracts in candidate procedures and require observed native ownership/review
behavior. Mixed-format progress, buffered/in-flight delivery and final receipt
observations are separate schedules, not a fabricated single incident.

The sibling deadline corpus reviews Go wire-time and Python connection lifetime;
this shutdown case instead scores the integrated rollout procedure, remaining
ownership and reconciliation/cleanup assignment. The fairness corpus owns resident
reserve and dependency allocation, so this admission case does not require a
fairness redesign. No claims of skill uplift, production reliability or runtime
conformance follow from these authored cases or finite checks.
