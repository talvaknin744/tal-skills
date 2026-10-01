# Engineering toolkit verification

Evidence snapshot: **2026-09-29**. The initial published toolkit validation
checkpoint is [`76f77f9`](https://github.com/talvaknin744/tal-skills/commit/76f77f9e478313f75f1eecab6d628ef0cbdc59ca),
with its exact CI results in the [release record](release-record.json).
The completed archives contain **20 unique skill cases in 26 attempts** and
**eight Codex workflows in ten attempts**. Latest skill results are 17 pass and
3 partial. All eight latest workflows pass their bounded task and observed
native behavior; all remain partial under the strict isolation criterion.
Claude model execution was authentication-blocked. These are the original release
results; the later article extension has separate evidence below.

Runtime examples, agent behavior and repository validation are separate forms
of evidence below. A successful fixture can mean an unsafe control was
reproduced; it does not turn that control into a recommended implementation.

## October distributed-systems and performance expansion

The repository now contains **49 skill packages, 15 agents, and eight workflows**.
The [October archive review](2026-10-01/README.md) records the same 60 surveyed
publishers, 58,178 metadata URLs, and 29 selected substantive article readings,
with historical/access boundaries explicit. Two new skills cover streaming
semantics and background maintenance; ten conditional branches deepen existing
guidance, including coordinated retries.

The [two-skill native archive](../../../evals/engineering-toolkit/runs/2026-10-01/README.md)
retains all six cases in nine attempts: latest results **4 pass, 2 partial**.
Startup failures and a timeout are retained. The original partial scores identify
verification and effect-boundary omissions. All attempts retain inherited-tool
and read-isolation limits; these were read-only reviews, not production engines
or current native workflow/role execution.

The [performance addition](../performance-capacity/README.md) supplies six
independent skills and 18 authored cases. Its
[verification record](../performance-capacity/verification.md) distinguishes the
six selected forward trials actually executed from corpus checks and unexecuted
scenarios. No production benchmark or portable speedup was established.

The [retry example](../../../examples/retry-coordination/README.md) passed eight
author and eight independent checks on custom loopback HTTP peers and bounded
models. It demonstrates nested amplification and propagation gaps; it does not
reproduce Uber middleware or prove fleet-wide admission/cancellation guarantees.

The [selectable launcher](../../toolkit-usage.md#choose-with-npx) resolves standalone
skills alongside agents/workflows. Actual
[packed npx installation](2026-10-01/launcher-installation.json) checks selection,
repeat installation, settings preservation, and collision rejection. The
[fresh public GitHub installation](2026-10-01/public-installation.json) resolved
the selected dependency closure and repeated with zero changes. The
[published release](2026-10-01/release-record.json) at `fe36680` passed
[Ubuntu CI](https://github.com/talvaknin744/tal-skills/actions/runs/36913341558)
with **438 tests, zero failures/skips**. Combined local validation also passed
the same counts; the
[command record](2026-10-01/validation.json) retains code identities and output. Installer
checks do not execute a model or establish native host task completion.
The upstream [skills CLI discovery check](2026-10-01/public-skills-discovery.json)
found all 49 expected names from public GitHub; list mode changed no destination
files and did not exercise an installed skill or interactive selection.

The later [focused research follow-up](../distributed-systems-followup/2026-10-01/README.md)
records online schema evolution, clock semantics, scheduling/isolation and
coordination design separately from the release's 29 selected readings.

## Additional article extension

The [additional research](extensions/README.md) adds 17 deep article records
(41 combined) and updates nine existing skills. Five additional Codex cases ran
in six attempts; the [latest five task and native outcomes pass](../../../evals/engineering-toolkit/runs/2026-09-29/native-extension/README.md).
Their strict rubric remains partial for unproven isolation. The first worker
attempt's missing operational drain owner is retained; a focused workflow
correction and fresh independent assessment followed. No baseline skill scores
were silently transferred to the changed packages.

The [ownership probes](../../../examples/ownership-boundaries/evidence/verified-run.json)
and [independent rerun](../../../examples/ownership-boundaries/evidence/independent-rerun.json)
observed three passing contracts and four expected unsafe controls, with zero
failures. They cover public Python semaphore acquisition, Go select operand
evaluation, and Node observer versus owned-stream cancellation. Two harness
defects were reproduced and corrected before final verification; the
[review](extensions/review-ownership-probes.md) preserves those observations and
the cleanup-evidence limit.

Local release validation passed **365 tests, zero failures/skips**. Runtime
attribution now checks **75 source hashes in 12 reports**; this check does not
rerun the experiments. A [fresh both-host installation](extensions/installation-after-workflow-review.json)
included 319 managed files plus the manifest, with all 320 operations unchanged
on repeat. The original release gates below keep their historical counts and CI
identities. The [extension release record](extensions/release-record.json)
confirms public checkpoint `6e46153` and its
[successful 365-test CI run](https://github.com/talvaknin744/tal-skills/actions/runs/36571396256).

## Deprecation and cache-design follow-up

The user-requested follow-up adds `technical-deprecation` and focused references
inside existing Python, operations, consistency, and infrastructure skills. The
repository now has **41 skill packages, 15 agents, and eight workflows**; no
Redis-specific skill or agent was added.

The [deprecation archive](../../../evals/engineering-toolkit/runs/2026-09-29/technical-deprecation/README.md)
contains six independently scored attempts across two relevant cases and one
nontrigger. Latest results all pass. The original configuration-migration partial
and its [instruction correction](extensions/deprecation-evaluation-correction.md)
remain visible. Positive runs read the skill body; no body activation was observed
in nontriggers. All retain the host confinement qualifications. Review cases did
not execute migrations; both cleanup nontrigger attempts passed their supplied
verifier and a separate coordinator execution.

[SQLAlchemy examples](../../../examples/sqlalchemy-gotchas/README.md) and their
[independent review](extensions/review-sqlalchemy-gotchas.md) reproduce three
passing contracts and five unsafe controls using real PostgreSQL and in-process
ASGI. [Cache examples](../../../examples/cache-load-protection/README.md) and
[independent review](extensions/review-cache-load-probes.md) pass eight bounded
scenarios. Both distinguish actual datastore observations from application models
and preserve failed development attempts. Neither establishes production capacity,
failover durability, or universal schedule coverage.

The [follow-up installation record](extensions/installation-followup.json) covers
325 managed files plus the manifest; all 326 operations were unchanged on repeat.
It installs the existing 19-skill dependency closure for all agents/workflows.
Technical deprecation remains a separately installable package.

Final local validation passed **369 tests with zero failures/skips**. Attribution
checks verified **86 runtime source hashes in 14 reports**, plus **55 evaluation
manifests, 882 published artifacts, and 1,006 source bindings**. These checks
validate packaging and evidence integrity; they do not rerun the experiments.

## Release gates

| Gate | Observed evidence | Boundary |
| --- | --- | --- |
| Local validation | **364 tests passed, 0 failed, 0 skipped** in the completed `npm run validate` run that preceded `76f77f9`, including archive-checker regressions. | Local checks and the independent CI run below cover the same published implementation. |
| Published repository validation | **364 tests passed, 0 failed** at `76f77f9` on public `main`, confirmed in the [successful validation run](https://github.com/talvaknin744/tal-skills/actions/runs/36565065139). Earlier checkpoints passed [355 tests at `a4ec975`](https://github.com/talvaknin744/tal-skills/actions/runs/36562226191) and [276 at `1b7b68c`](https://github.com/talvaknin744/tal-skills/actions/runs/36550139240). | Package shape, references, generation, installer behavior and declared regression cases; these counts do not measure model behavior. Later changes require their own validation. |
| Backend runtime CI | [Successful Ubuntu run](https://github.com/talvaknin744/tal-skills/actions/runs/36565065054) at `76f77f9`: Python, TypeScript and Go jobs all passed. | These three backend examples ran in CI. Other examples below have recorded local runs, not an asserted Ubuntu CI run. |
| Evidence attribution | Published validation checked **70 source hashes in 11 runtime reports**. | This detects source/report drift. It does not rerun, independently grade or broaden an experiment. |
| New skill behavior | [Archived independent results](../../../evals/engineering-toolkit/runs/2026-09-29/skills/README.md): latest 20 cases yield **17 pass, 3 partial, 0 fail**; all 55 critical criteria scored 2/2. | One relevant case and one nontrigger per new skill were executed. Ten second relevant cases remain unexecuted; three verification gaps remain. |
| Codex workflow behavior | [Archived independent results](../../../evals/engineering-toolkit/runs/2026-09-29/native/README.md): **8/8 latest task and native-behavior assessments passed**, with 13 named native children. | Strict rubric remains **partial for all eight** because input/tool confinement was not established. No prohibited scope breach was observed. |
| Claude workflow behavior | [One fresh backend attempt](../../../evals/engineering-toolkit/native-planning/claude-backend-attempt/README.md) initialized installed roles/skills, then returned HTTP 401 for expired OAuth before model work. | The other seven workflows were not run under the same authentication block. Initialization is not behavioral acceptance. |
| Evaluation archive | [Skill summary](../../../evals/engineering-toolkit/runs/2026-09-29/skills/summary.json) and [workflow summary](../../../evals/engineering-toolkit/runs/2026-09-29/native/summary.json) retain every attempt, exact candidate identity, independent scores and evidence links. | Reruns are not additional independent cases. Prior failures and append-only clarifications remain visible; no effectiveness improvement over an unaided agent was measured. |

The local [evaluation evidence checker](../../../scripts/check-evaluation-evidence.mjs)
verified **41 manifests, 655 published artifacts and 755 source bindings**.
Its [regression tests](../../../tests/evaluation-evidence.test.mjs) check altered
bytes, original-versus-published bindings, native scores and supplemental
artifacts. These integrity checks do not rerun or grade model experiments.

The installer tests exercise temporary projects, host selection, dependency
closure, no-op repeated installation, collisions, existing configuration
preservation, interrupted installation recovery and adversarial path/manifest
inputs. Generated adapters are checked against canonical definitions. These are
executed filesystem and contract tests; installation success does not establish
native discovery, delegation or task completion. See the
[installer contract](installation-contract.md),
[toolkit tests](../../../tests/toolkit/) and
[evaluation contract](evaluation-contract.md).

## Executed examples

Counts use each example's own unit of observation and should not be summed into
one effectiveness score. Local records were produced on macOS/arm64 with the
versions recorded in their reports. The CI backend run separately used Ubuntu,
Python 3.11 and Node 22 where selected; its Go version follows the example's
module. Fresh runs write fresh evidence rather than changing the meaning of these
historical observations.

| Example and retained report | Actual observation | Important limit |
| --- | --- | --- |
| [Python backend](../../../examples/backend/python/evidence/verified.json) | **18 scenarios passed** with Python 3.14.3, psycopg 3.3.6 and pool 3.3.3. Duplicate/conflicting operations, concurrent stock contention, cancellation, connection retirement, rollback and a real TCP proxy dropping a COMMIT response were exercised. | PostgreSQL-local effects and receipts; synthetic tenant identity, no remote provider transaction, replica or failover proof. |
| [TypeScript backend](../../../examples/backend/typescript/verification.json) | **16 scenarios passed** with Node 25.9.0 and pg 8.23.0. Runtime input rejection, uncertain COMMIT, contention and cleanup were observed; 20 pools closed and no application sessions remained. | Compilation and runtime validation are separate checks. No TLS, crash, restore or external-effect atomicity claim. |
| [Go backend](../../../examples/backend/go/verification.json) | **14 scenarios passed** with Go 1.27.1 and pgx 5.11.0. Same core operation contract; CI additionally ran `go test -race`, `go vet` and the verifier with `-race`. | A race detector covers exercised schedules. Cancellation/cleanup deadlines do not prove arbitrary driver work stops immediately. |
| [Messaging](../../../examples/messaging/evidence/verification.json) | **7 semantic model cases and 5 RabbitMQ cases** matched expectations. Commit-before-ack and independently published duplicate each produced one effect; ack-before-commit deliberately lost the operation. | One RabbitMQ 4.3.0 classic queue and SQLite ledger; connections closed gracefully. Durable settings were not tested by broker restart, power loss or quorum failover. Model ordering cases are not broker ordering guarantees. |
| [Cache consistency](../../../examples/cache/report.json) | **9 scenarios**, two independent processes/Redis clients, real SQLite and Redis 8.10.2. Four unsafe controls were reproduced, four preservation/fallback cases passed, and the DB/cache acknowledgement gap was observed. Atomic Lua rejected obsolete fills after acknowledgement and after value eviction. | DB commit and cache transition remain separate. An overlapping snapshot may be older; a read beginning after acknowledgement has the declared revision floor. Lost/expired floor uses the authority; no Redis persistence, automatic floor reconstruction or distributed transaction claim. |
| [Long-running job handoff](../../../examples/draining/verification.json) | **8 checks** covered rolling handoffs, stale owners, effect-before-checkpoint, admission/schema gates, poison input, business budget, deadline and immutable input. 18 worker processes exited, with no remaining DB sessions. | Short local PostgreSQL processes, not a 12/24-hour Kubernetes rollout. No SIGTERM/prefetch, mixed-binary compatibility, network partition, remote-effect fence or disk-loss recovery was demonstrated. |
| [Infrastructure changes](../../../examples/infrastructure/verification.json) | **5 Terraform checks**, plus checksum rejection and the separate signal-cleanup check. Partial apply persisted completed work; recovery, stale saved plans, same-state movement and retained removal were observed with Terraform 1.16.4. | Disposable `terraform_data` resources only. No cloud provider, out-of-band cloud drift, cross-state adoption or remote lock test. The [SIGTERM harness](../../../examples/infrastructure/signal-verification.json) uses a synthetic child, not Terraform. |
| [Recovery validation](../../../examples/recovery/report.json) | **8 scenarios** used actual PostgreSQL 18.6 `pg_dump`/`pg_restore`, a newly created isolated target and a restricted application role over password-authenticated TCP. Missing role, wrong password, identity mismatch, a one-cent semantic error, known missing acknowledged work and interrupted COPY were detected; a fresh rehearsal succeeded. | Logical backup only; no PITR/WAL chain, production RTO, external objects or cross-service restore. Restore-command time is separated from target provisioning and application acceptance. |
| [Cleanup and failure testing](../../../examples/quality/evidence.json) | Before/after observations agreed for **15 golden histories and 27 generated fault schedules per implementation**. Five seeded defects were detected. A five-step counterexample reduced to two steps. | Sequential in-memory model. The reduction is deletion-minimal under its retained precondition, not globally minimal; no database/network/restart or universal equivalence proof. |
| [MCP](../../../examples/protocols/mcp/observed.json) | **42 checks passed**: 14 Python/raw HTTP, 2 Python cancellation, 10 Go client and 16 synthetic authorization/cache checks against a real TypeScript server. | Selected loopback interoperability, synthetic identity and memory-only effects. No OAuth/JWT validation, token revocation, MRTR/tasks, stdio or full protocol conformance claim. |
| [A2A](../../../examples/protocols/a2a/evidence/verified-run.json) | TypeScript→Python: **16 passed cases and 2 observed unsafe stock validations**. Go→Python: **7 checks passed**. Go→Go: **5 top-level tests with 30 race subtests**, no race-detector report. Ownership and actual server-restart probes also ran. | Empty Part and explicit task/context mismatch executed effects on the stock Python endpoint; narrow guards rejected them. Restart lost memory-only task state. Two Go handlers demonstrated a late unfenced effect after cancellation; this is an adverse observation, not durability or cancellation safety. |

The backend, draining and recovery examples use PostgreSQL **18.6** from the
digest-pinned image declared in their launchers. Cache and messaging record
requested image digests, observed server versions and cleanup separately.
Dependency locks, commands and source hashes remain alongside each report;
consult the relevant README before reproducing a run. Containers, child processes
and generated data are scoped to the fixture. Passing cleanup assertions do not
authorize removal of unrelated resources.

MCP is pinned separately to [specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28):
TypeScript server/core 2.2.0, Node adapter 2.1.0, Python MCP/types 2.2.0 and Go SDK
1.8.0. A2A uses specification **1.0.1**, wire **1.0**, TypeScript SDK 1.2.1,
Python SDK 1.1.5 and Go SDK 2.6.0. The
[protocol ledger](protocols.json) records official source/release pins; that
research record itself did not execute interoperability. The example reports
above supply the later runtime evidence. Neither protocol's selected tests are a
conformance certification.

## Research and audit coverage

The [session record](research-session.json) measures **70.55 elapsed minutes**
between research start and synthesis, including a recorded usage-limit
interruption of unknown duration. Exact active research time is unavailable;
implementation and final evaluation followed this window.

The [survey](publisher-survey.json) contains **60 distinct publishers across six
lanes and 24 deep article records**. It is a curated coverage survey, not a ranking
of the best companies or a claim to have read every publisher's archive. Each
lane retains actual access/read scope, applicability, counterexamples and
verification suggestions.

The **14 book records** distinguish accessible full text from what was actually
read. [Language records](books-languages.json) include complete selected chapters
of *Architecture Patterns with Python*, selected *Effective Python* and
*Effective TypeScript* items, and *Learning Go* previews/example code rather than
complete prose chapters. [Operations records](books-operations.json) include
selected complete chapters of *Designing Event-Driven Systems*, official SRE
sections and *Infrastructure as Code*/*Enterprise Integration Patterns* excerpts;
they preserve the earlier DDIA draft and *Release It!* provenance limits.
[Quality records](books-quality.json) include five complete *Software Engineering
at Google* chapters, *Refactoring*'s complete opening chapter and author articles
plus introductions for *Effective Software Testing*. No complete-book reading is
inferred from a complete book being accessible.

All **30 existing skill entrypoints** were audited at baseline `7279a66`. The
[engineering audit](audit-engineering.md) inspected its 15 packages' references
and metadata (87 files). The [Temporal/productivity audit](audit-temporal-productivity.md)
read the other 15 entrypoints with selected risk-focused reference checks. This
is not an exhaustive external-link crawl or live Temporal/production test.
Independent crosschecks and [review corrections](review-corrections.md) preserve
the source distinctions and issues found during implementation.

## Skill behavior and remaining gaps

The [skill archive](../../../evals/engineering-toolkit/runs/2026-09-29/skills/README.md)
contains 30 authored cases, of which 20 unique cases were executed and scored in
26 attempts. Latest-attempt selection yields **17 pass, 3 partial, 0 fail**.
The initial 20 scored 15 pass, 4 partial and 1 fail; all attempts and revisions
remain in the [summary](../../../evals/engineering-toolkit/runs/2026-09-29/skills/summary.json).
These repeated cases do not establish a causal improvement estimate.

The three remaining partial results are concrete verification gaps: Python did
not exercise cancellation before connection acquisition; Go did not force the
interval between a completed `Get` and its worker's result send; messaging did
not provide a concrete concurrent schedule and assertion. None is represented
as a pass merely because every latest critical criterion passed.

All latest positives have observed candidate-body reads; none of the latest
nontriggers has an observed candidate-body read. Absence of a recorded read is
not proof of absence. Seven implementation-positive attempts have independently
rerun supplied verifiers bound to final files. These single-skill trials disabled
subagents and do not establish named-agent behavior. All retain
`case_compliant: false` because strict capability isolation was not established;
no protected-input or file-scope violations were recorded.

## Native-host behavior

The [compatibility research](native-compatibility.md) observed Codex desktop
0.153.4 skill discovery, an explicit skill invocation and a custom role registered
through invocation-only configuration. Automatic loading in an untrusted scratch
project was blocked; the captured JSONL did not expose the full V2 spawn payload.
Homebrew Codex 0.142.5 did not complete a model run. Claude Code 2.1.150 listed the
test artifacts during initialization but model execution was authentication-blocked.
Those research probes remain historical observations. The later
[workflow archive](../../../evals/engineering-toolkit/runs/2026-09-29/native/README.md)
records actual named-role metadata, executed commands, stable candidates and
independent reviews from Codex 0.153.4 with inherited model settings. Its latest
selection covers all eight workflows and 13 named specialist children.

| Workflow and archived independent score | Observed outcome and scope |
| --- | --- |
| [Backend delivery](../../../evals/engineering-toolkit/runs/2026-09-29/native/tal-native-backend-20260929-02/independent-score.json) | Main owner plus native idempotency advice and Python review; seven protected SQLite checks and seven added tests passed. Lost response is modeled after successful return, not an injected COMMIT transport failure. |
| [Consistency diagnosis](../../../evals/engineering-toolkit/runs/2026-09-29/native/tal-native-consistency-diagnosis-20260929-01/independent-score.json) | Two actual threads demonstrate the forbidden lost update, then the repaired result under a forced local schedule. |
| [Messaging evolution](../../../evals/engineering-toolkit/runs/2026-09-29/native/tal-native-messaging-evolution-20260929-01/independent-score.json) | Local consumer repair and deterministic duplicate/reordering checks; no real broker, restart or concurrent-delivery guarantee. |
| [Worker rollout](../../../evals/engineering-toolkit/runs/2026-09-29/native/tal-native-worker-rollout-20260929-01/independent-score.json) | Native durability/infrastructure review correctly retains NO-GO until admission, maintenance handoff, fencing and recovery bounds are demonstrated. No cluster deployment occurred. |
| [Recovery validation](../../../evals/engineering-toolkit/runs/2026-09-29/native/tal-native-recovery-validation-20260929-01/independent-score.json) | Disposable local import and reconciliation expose missing/stale data and duplicate effects; writes remain blocked. No production restore or provider repair occurred. |
| [MCP integration](../../../evals/engineering-toolkit/runs/2026-09-29/native/tal-native-mcp-integration-20260929-01/independent-score.json) | Native MCP/consistency review identifies warm-cache owner bypass, forged principal and header/body mismatch in the unchanged local adapter. |
| [A2A integration](../../../evals/engineering-toolkit/runs/2026-09-29/native/tal-native-a2a-integration-20260929-01/independent-score.json) | Native A2A/failure-testing review identifies observer cancellation, missing ownership, context rebinding and terminal continuation producing a second effect. |
| [Cleanup](../../../evals/engineering-toolkit/runs/2026-09-29/native/tal-native-cleanup-review-20260929-02/independent-score.json) | One README edit, successful documented legacy command and native cleanup review bound to the final document hash. |

All eight latest task/native assessments pass; every strict rubric remains
partial solely on `isolation_and_scope` (1/2). The host retained broad filesystem
read capability, write scope was audited afterward, and effective tool inventory
was not fully observed. No prohibited scope breach was found. MCP/A2A workflow
fixtures are local models; actual SDK interoperability belongs to the separate
runtime examples above. Successful review can correctly conclude that a
candidate or rollout must not proceed.

Historical backend attempt 01 lacked independent review because default
delegation could not load its ephemeral parent. Historical cleanup attempt 01
used a disclosed generic fallback reviewer. Both remain archived alongside the
successful fresh attempts. The corrected runner persisted the parent session and
collected child role metadata. An earlier global-config hash change has unknown
writer; all eight latest Codex runs record matching before/after hashes.
Append-only score clarifications correct interpretation or factual errors while
preserving original records and candidate responses.

Claude Code 2.1.150's fresh backend attempt discovered eight project roles and eleven
project skill/workflow entries before expired OAuth blocked execution. It performed no
model task or acceptance verification; the other seven cases are explicitly
not run. Its observed global JSON configuration hash change also has unknown
writer. See the [host matrix](../../../evals/engineering-toolkit/runs/2026-09-29/native/summary.json)
for per-workflow status. Structural Claude validation remains distinct from this
unavailable behavioral evidence.

Earlier failed attempts remain in example history/development reports. In
particular, recovery preserves the report whose restore timer included target
provisioning; infrastructure preserves its pre-fix signal-cleanup result. These
are historical failure evidence, not current passing reports. Re-check source
hashes and regenerate runtime evidence after changing the corresponding code.
