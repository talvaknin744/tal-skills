# Evaluation contract for the engineering toolkit expansion

Designed 2026-09-29; this document proposes execution and evidence requirements. It is not a result ledger. It extends the existing [evaluation guide](../../evals/README.md), [distributed correctness corpus](../../evals/distributed-correctness/README.md), and [book-skill evidence](../../evals/book-skills/README.md). Current authoring guidance was read from the local `skill-creator` and `writing-for-agents` skills: evaluate observable decisions, keep activation precise, disclose references conditionally, and give an independent evaluator a realistic request without the intended solution.

## Scope and minimum observations

Author **30 new cases: two relevant cases and one nontrigger for each of the ten new skills**. Execute at least the first positive and the nontrigger for every skill: **20 fresh-session trials**, independently scored. Authoring the second positive is not evidence that it ran. A language example or existing draining trial does not replace one of these 20 skill trials.

Keep four evidence classes separate:

| Class | What a pass establishes | What it does not establish |
| --- | --- | --- |
| Structural | Schemas, references, package closure, generation and installation checks succeeded. | Agent selection, sound advice, SDK interoperability. |
| Behavioral trial | The observed answer, tools and changes satisfy the selected fixture's criteria. | Broad reliability, successful native loading, production behavior. |
| Runtime experiment | The recorded executable contract passed for named runtimes/dependencies and fault schedules. | Different adapters, untested schedules, production durability. |
| Native host smoke | The named installed host discovered and used the installed workflow/roles, with recorded outcome. | Every workflow, every host version, unrelated protocol compliance. |

One trial may link several evidence classes, but each retains its own status. The proposed additions are new skills, so a single passing run is not proof of improvement over a previous candidate. If making a comparative claim, use matched fresh runs, the same model/capabilities, randomized order, and anonymized scoring as the existing guide requires.

## Paths and record shapes

Preserve existing per-skill corpus layout. These are proposed paths until created:

- `evals/<skill-name>/cases.json`: `format_version: 1`, with the existing `id`, `title`, `tags`, `prompt`, `fixture_dir`, `fixtures`, `capabilities`, `activation`, `task_mode`, and `rubric` fields.
- `evals/<skill-name>/fixtures/<case-id>/`: only raw project files. Usually `request.md`, one implementation/configuration file, and a trace or contract file. Keep each fixture independently understandable and small.
- `evals/engineering-toolkit/README.md`: execution instructions and evidence limitations.
- `evals/engineering-toolkit/scenario-index.json`: references to the 30 new cases plus existing cross-cutting scenarios; no duplicate prompts or rubrics.
- `evals/engineering-toolkit/runs/<UTC-date>/<run-id>/`: `prompt.txt`, `answer.md`, `run.json`, `manifest.json`, `trace.jsonl` when available, `tools.md` when only a summary is available, `workspace.patch`, and `checks.json` with linked command outputs.
- `evals/engineering-toolkit/runs/<UTC-date>/scores.json`: independent criterion scores, artifact evidence, critical gates and unresolved findings.
- `evals/engineering-toolkit/runtime/<run-id>/`: runtime manifests, command logs, scenario results and replay artifacts.
- `evals/engineering-toolkit/native/<host>/<run-id>/`: installation manifest, host version, discovery output, observable delegation trace, workspace diff and final result.
- `tests/engineering-toolkit/evals.test.mjs`: corpus/reference/manifest integrity. Keep native execution and model trials outside automatic test discovery.

Keep the existing 0/1/2 rubric scale and critical/major/minor severities. Add fields to run records rather than changing all existing corpora. Suggested `run.json` additions:

```json
{
  "format_version": 1,
  "run_id": "python-backend-cancelled-export-candidate-a-01",
  "case_id": "cancelled-export",
  "skill": "python-backend",
  "trial_kind": "behavioral",
  "status": "not_run",
  "candidate_commit": null,
  "candidate_tree_sha256": null,
  "fixture_tree_sha256": null,
  "prompt_sha256": null,
  "rubric_sha256": null,
  "model": null,
  "model_settings": null,
  "discovery_mode": "native-or-explicitly-described-catalog",
  "capabilities_declared": {"web": false, "subagents": false, "commands": true},
  "capability_deviations": [],
  "case_compliant": null,
  "activation_observed": null,
  "trace_kind": "unavailable",
  "artifact_paths": {},
  "elapsed_seconds": null,
  "token_usage": null,
  "limitations": []
}
```

This is a schema illustration; nulls are unknown/unmeasured, not zero or a fabricated pass. Operational results use `pass`, `partial`, `fail`, `blocked`, `not_run`, or `invalid`. Record failed attempts and subsequent reruns separately.

## Isolation, identity and scoring

Freeze the candidate before dispatch. Hash every included skill file and its entire installed dependency closure, not just `SKILL.md`. For workflow trials also hash canonical workflow/agent definitions, generated adapters and installer manifest. Record relative path, byte SHA-256, and executable mode for each file; reject escaping symlinks. Compute a tree digest over the canonical JSON serialization of those records sorted by relative path. Store the serialization rules with the runner. Include fixture files, exact prompt, rubric, verifier and dependency lockfiles under separate manifest namespaces.

The candidate receives only its prompt, raw fixture, permitted reference/skill dependency files, and declared tools in a fresh workspace. It receives no `cases.json`, research synthesis of that case, answer key, scorer prompt, prior answer, or this contract. A public behavior check may express the user's contract; it must not contain evaluator point values or a proposed fix. Record allowed editable paths. Review/nontrigger files remain unchanged; implementation trials preserve supplied verifier/adapters unless their explicit task permits changes.

A directory copy alone is not an enforced sandbox. If the candidate can still read the scorer directory or use prohibited tools, report that capability deviation and `case_compliant: false`; observable rubric quality can still be scored separately. Use platform restrictions when available and never describe an agent-authored command summary as an independently captured full trace. Report missing model/settings/timing information as unavailable.

For positive trials, expose the normal description and allow skill discovery; an explicit invocation can separately test execution. The nontrigger must expose the same discoverable name/description **without preloading its body or explicitly naming it in the request**. If actual skill reads/host selection are unobservable, report activation as unknown; a sensible answer alone cannot prove activation accuracy. Offline catalog selection is an offline trial, not native host discovery.

After the candidate finishes, a reviewer who did not author its skill or response gets the raw fixture, saved answer/diff/check evidence, and separate rubric. Each criterion needs a path/line, trace event or test assertion that supports its score. Critical failures cannot be averaged away. Treat a partial critical criterion as unresolved, and report noncritical partials individually. A second reviewer adjudicates disputed critical or security judgments; preserve both initial scores and the resolution. Do not score hidden reasoning, prescribed headings, agent headcount, deletion count, or name-dropping sources.

Verify input hashes and allowed changes independently. Recompute source-vs-snapshot hashes before publishing. Edits after a trial create a different candidate: retain attribution to the old snapshot, rerun affected evidence, and report any remaining gap. Do not relabel an old pass as validating a changed release. Never modify a rubric silently after seeing an answer; version the case and preserve the original result.

## Thirty-case inventory

The following discriminators belong only to the evaluator. The eventual user prompts should ask the ordinary task and refer to supplied facts, without explaining the intended diagnosis. Execute **P1 and N** at minimum. P2 is authored coverage until actually run.

| Skill / case IDs | Raw fixture and requested task | Evaluator discriminator |
| --- | --- | --- |
| `python-backend` P1 `cancelled-export` | Async exporter, two child requests, fake resource owner, cancellation trace; repair incomplete shutdown. | Cleanup occurs once; children are joined; cancellation propagates; a committed external effect remains reconcilable. Tests gate cancellation before/after effect. |
| P2 `blocking-report-handler` | Async HTTP report handler calls a blocking client; concurrent health requests stall; client has a documented thread-safety limit. | Identifies event-loop blocking; chooses a bounded supported adapter rather than unbounded threads; deadline/ownership semantics remain explicit. |
| N `notebook-list-expression` | Explain a short Python list transformation in a notebook; no service, concurrency or external I/O. | Gives the correct values directly; no backend architecture, lifecycle refactor or package changes. |
| `typescript-backend` P1 `untrusted-command-body` | Handler casts parsed JSON to a command; malformed amount/tenant examples and adapter contract; repair the boundary. | Runtime validation precedes effects; trusted identity is separate from body claims; types alone are not validation; valid behavior remains covered. |
| P2 `aborted-payment-response` | Abortable request, operation ID, commit/response trace, resource callback; diagnose duplicate payment on retry. | Abort does not prove rollback; stable identity and result reconciliation; pending I/O cleans up; no fresh mutation identity after uncertain commit. |
| N `stylesheet-spacing` | Change one CSS spacing declaration in a TS repository. | Makes the requested visual edit only; no backend validation layer or runtime dependency changes. |
| `go-backend` P1 `cancelled-fanout` | Worker goroutines send into a result channel after caller cancellation; fake clients and ownership notes; repair completion. | Send/receive paths can terminate; context reaches blocking work; owned workers exit and resources close; no close-while-send panic. |
| P2 `split-lock-counter` | Mutex-protected individual reads/writes, two update calls, business requirement that both count. | Finds the semantic lost update even with clean `-race`; protects the entire invariant or uses version arbitration; deterministic two-read schedule. |
| N `go-comment-typo` | Correct a comment's spelling in a covered pure helper. | Bounded edit; no goroutine redesign, race framework or API change. |
| `messaging-reliability` P1 `reordered-account-events` | Consumer plus history: revision 12, duplicate 12, then 11; snapshot-event contract and effect log. | No state regression or duplicate effect; ordering rule scoped per entity; message identity distinct from entity version; poison input gets a bounded explicit policy. |
| P2 `commit-before-ack` | Broker redelivers after consumer DB commit but before ack; local transaction and external notification contracts. | Persisted deduplication and effect/result boundary; distinguishes DB atomicity from external delivery; no unsupported end-to-end exactly-once claim. |
| N `local-observer-callback` | Add a synchronous in-process notification to an already tested single-owner object. | Uses the local mechanism; no broker, outbox or distributed ordering machinery. |
| `infrastructure-change-safety` P1 `three-pod-rollout` | Three-pod replacement, 18-hour resumable job, retry budget 3, 90-second grace, actual queue policy; assess rollout. | Admission, durable handoff and maintenance-vs-failure accounting; bounded termination; PDB/readiness do not prove queue drain. See existing case below. |
| P2 `schema-cutover-window` | Migration plan, gh-ost version/lock timeout, old/new client fields and rollback proposal. | Brief cut-over lock acknowledged; compatibility before/after cut-over; explicit stop/recovery criteria; rollback data loss not hidden by an atomic rename. |
| N `terraform-comment` | Fix a comment in an infrastructure file without changing values. | Confirms comment-only diff; no apply, credential request, environment mutation or mandatory rollout ceremony. |
| `recovery-validation` P1 `restored-order-ledger` | Local snapshot, accepted-order manifest, effect ledger and restore script; rehearse recovery in a scratch directory. | Detects missing/extra records and inconsistent progress, not merely successful import; measures defined recovery bounds; source remains intact; replay avoids duplicate effects. |
| P2 `expired-input-history` | Eight-day paused job, seven-day mutable-source history, cursor and current pricing. | Admits exact recovery is unsupported without retained accepted inputs; no silent use of current cohort/pricing; identifies needed retention and reconciles existing effects. |
| N `backup-label` | Rename a dashboard label from “Nightly copy” to “Nightly backup.” | Makes the text change only; does not claim backup validity or initiate a restore. |
| `failure-oriented-testing` P1 `race-clean-lost-update` | Two-step locked update, green happy tests, invariant “two accepted increments add two”; add meaningful tests. | Reproducible gate forces both reads before writes; semantic assertion fails original; retains failing schedule; `-race` pass is not treated as proof. |
| P2 `green-transaction-fake` | Fake adapter always returns commit success; production trace loses a commit response. | Chooses a discriminating post-commit fault; states fake fidelity limits and required real-adapter check; asserts effects/results rather than implementation call order. |
| N `pure-format-assertion` | Add an expected output assertion for a deterministic pure formatter. | Adds focused assertion; no distributed fault framework, unnecessary new dependencies or fabricated concurrency concern. |
| `code-and-docs-cleanup` P1 `similar-policy-cleanup` | Two similar policies with independent owners, one unused private wrapper, docs containing a required prerequisite; tidy locally. | Preserves independent policies and prerequisite/rationale; proves wrapper callers absent; removes only evidenced redundancy; behavior checks pass. |
| P2 `newcomer-setup-path` | Duplicate setup sections disagree on a flag; maintained CLI help and compatibility note. | Consolidates against the actual CLI, retains compatibility condition, verifies a fresh-project path; brevity alone earns nothing. |
| N `new-export-format` | Add one requested output format to a stable module. | Delivers the feature through normal implementation; no opportunistic cleanup sweep or deletion of adjacent documented behavior. |
| `mcp-engineering` P1 `private-resource-handle` | Pinned current MCP HTTP adapter, two principals, handle store and mismatched header/body requests. | Per-request authority, principal-scoped handles, explicit version/envelope consistency, no cross-principal cache result; uses actual pinned schema/SDK. |
| P2 `mcp-disconnect-after-effect` | Current MCP request stream disconnects after effect commit; continuation state and callback trace. | Revision-specific cancellation and cleanup; uncertain outcome reconciled; tampered/expired/wrong-principal state rejected; integrity alone not replay prevention. |
| N `plain-json-rpc-helper` | Maintain a standalone JSON-RPC calculator explicitly unrelated to MCP. | Solves its local contract; does not introduce MCP initialization/capability/transport semantics. |
| `a2a-engineering` P1 `task-observer-disconnect` | Pinned A2A server, two task subscribers, disconnect/reconnect trace and persistent-task contract. | One observer leaving does not cancel work; authoritative state/reconnect and artifact handling; task access authorized; terminal task not restarted by continuation. |
| P2 `duplicate-agent-message` | Repeated SendMessage with one business command, task store, second principal's get/cancel attempt. | Optional protocol dedup is not assumed; application effect identity and cross-principal denial; repeated cancellation handles completion race without inventing success. |
| N `ordinary-job-endpoint` | Add polling to an ordinary HTTP background-job API, with no A2A peer requirement. | Preserves the requested API; does not add Agent Cards, A2A envelopes or agent-team orchestration. |

Every fixture must state enough domain facts to decide the discriminator. Avoid asking the candidate to guess whether events are snapshots/deltas, what failure counts mean, or who owns a resource. Language-specific cases can reuse a conceptual contract, but each raw fixture remains a complete independent project. Source examples and book passages are not copied.

## Cross-cutting runtime coverage

Reference the existing `rolling-worker-drain` and `cache-fill-invalidation` cases by ID; their old results remain bound to their old candidate hashes. New workflow/runtime executions get new run records. The infrastructure P1 may reference the same raw draining facts via a copied fixture with its own manifest; its prompt and new-skill scorer remain distinct.

- **Three rolling pods / retry budget three:** Force A→B→C replacement during the same job; planned, safely checkpointed deferrals consume zero business failures under the fixture's explicit queue contract. Resume on the replacement and complete once. Retain a poison-job control that exhausts three real failures. Also test admission in flight, failed/uncertain checkpoint, stale ownership and forced kill. Kubernetes-style shutdown is a simulation unless a real cluster was exercised; do not equate readiness or PDB configuration with stopping queue acquisition.
- **Stale cache fill:** Preserve the supplied contract: a read overlapping a write may return its old snapshot, but a read invoked after acknowledged revision R must return R or later. Pause an old database read, complete a newer write/invalidation, evict the cached value, then release the old fill. Shared revision knowledge must survive that eviction; process-local locks and TTL alone are insufficient in this fixture. Passing the supplied adapter test does not prove Redis atomicity or solve a crash between DB commit and invalidation.
- **Messaging reordering:** Snapshot revision 12 followed by 11 must not regress state. Add a separate delta-event case where dropping every older revision would lose a required change; sequence/gap handling follows that contract. Replay duplicate delivery around commit/ack and retention expiry. Real broker claims require a real selected broker test, not only an in-memory queue.
- **Restore rehearsal:** Restore to a new isolated location from a known artifact. Compare expected accepted identities, payload versions, effect counts and progress before reopening writes; test corrupt/missing artifacts and incompatible schema. Capture measured RPO/RTO using their defined reference times. A verified local file restore proves that file contract, not cloud snapshot consistency or production recoverability.
- **Behavior-preserving cleanup:** Identify relevant outputs, side effects, errors, ordering, cancellation and operational signals first. Preserve independent policies that merely look alike. Verify code callers and try documentation from the stated starting point. An intentionally requested bug fix has a separate desired-behavior regression; characterization must not freeze that bug.

Run the equivalent TypeScript/Python/Go backend example through duplicates, payload mismatch, uncertain committed result, cancellation before/after commit and resource cleanup. Capture the controlled history plus native runtime evidence. Use the [language testing crosscheck](crosscheck-quality-backend.md) for seeds, shrinking, scheduler limitations and replay artifacts. Actual protocol integration must use the separately pinned [protocol contracts](protocols.md): local SDK peers, malformed envelopes, authorization boundaries, duplicate delivery, disconnect and cancellation. A handwritten HTTP mock alone is not SDK compatibility evidence.

## Native workflows and release report

Test the primary backend-delivery workflow end to end through each native host: installed entrypoint, relevant specialist selection, one implementation owner for overlapping paths, independent review, correction return and acceptance evidence. A second short-path cleanup smoke verifies that a simple task does not dispatch the entire roster. Maintain a matrix of all eight workflows across both hosts: validate each installed entrypoint and attempt a bounded representative native smoke on supported hosts. Statically validate every workflow graph and reference as a separate check. Record unexecuted or blocked matrix cells explicitly. The primary backend path requires full task execution; other smoke runs can use smaller realistic fixtures. Sentinels can verify loading, but cannot substitute for task behavior.

Use clean temporary target projects and the real installer. Record dry-run outputs, first install, identical repeat, name/file collisions, missing dependencies and untouched existing user configuration. Hash installed files and compare deterministic regenerated adapters against canonical definitions. Keep model preferences inherited.

The [native compatibility research](native-compatibility.md) currently records different Codex CLI versions, a project-trust restriction, and expired Claude OAuth. Preserve those facts. A Codex session flag explicitly registering a role proves that registration path, not automatic project discovery. Claude startup listing an agent proves discovery, not successful model execution. A generic child reading role text is a prompt fallback, not a native-role pass. Authentication or trust blockers require an honest blocked result and rerun after the environment changes; do not rewrite user settings or change models to manufacture success.

Publish a concise matrix for all required evidence with status, candidate hash, artifact link and limitation. Keep “authored 30,” “executed 20,” “independently scored 20,” runtime checks and native workflow checks separate. Do not mark an unexecuted case passed, call a timeout complete, or claim the expansion's validation is complete while a required host remains blocked. Structural passing checks and completed work can be published with that remaining limitation clearly identified.
