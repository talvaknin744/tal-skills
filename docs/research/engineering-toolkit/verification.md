# Engineering toolkit verification

Evidence snapshot: **2026-09-29 09:41 UTC**. The published implementation checkpoint is
[`1b7b68c5bbf7a546f2d403d60ec6f5ceb0e9ff5b`](https://github.com/talvaknin744/tal-skills/commit/1b7b68c5bbf7a546f2d403d60ec6f5ceb0e9ff5b).
Runtime examples and repository validation passed within the scopes below.
Skill trials and complete native workflow observations remain pending in this
snapshot. A successful fixture can mean an unsafe control was reproduced; it
does not turn that control into a recommended implementation.

## Release gates

| Gate | Observed evidence | Boundary |
| --- | --- | --- |
| Core repository validation | **276 tests passed, 0 failed** on the published checkpoint, independently confirmed in the [successful validation run](https://github.com/talvaknin744/tal-skills/actions/runs/36550139240). Toolkit checker reported 15 roles, 8 workflows and 46 native artifacts. | Package shape, references, generation, installer behavior and declared regression cases; no model behavior is inferred. |
| Backend runtime CI | [Successful Ubuntu run](https://github.com/talvaknin744/tal-skills/actions/runs/36550139340) at the same checkpoint: Python, TypeScript and Go jobs all passed. | These three backend examples ran in CI. Other examples below have recorded local runs, not an asserted Ubuntu CI run. |
| Evidence attribution | The core validation run checked **70 source hashes in 11 reports**. | This detects source/report drift. It does not rerun, independently grade or broaden an experiment. |
| New skill behavior | **Pending:** 20 trials dispatched; final responses, executed checks and independent scores are not yet recorded here. | Authored cases and a functioning harness do not demonstrate that agents followed a skill. |
| Codex workflow behavior | **Pending:** eight complete workflow smoke observations and independent scoring. | Research loader probes below are separate from these workflows. |
| Claude workflow behavior | **Blocked by authentication:** installed host initialization was inspected; model execution returned HTTP 401 with an expired OAuth token. | Do not claim successful Claude workflow execution. Structural adapter validation remains available. |
| Final evaluation publication | **Pending:** replace these placeholders with immutable run paths, scored outcomes, limitations and the final commit/CI links. | The development harness's reported 340-test run preceded native-runner changes; it is not the published core's 276-test result or a final release count. |

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

## Native-host and evaluation completion record

The [compatibility research](native-compatibility.md) observed Codex desktop
0.153.4 skill discovery, an explicit skill invocation and a custom role registered
through invocation-only configuration. Automatic loading in an untrusted scratch
project was blocked; the captured JSONL did not expose the full V2 spawn payload.
Homebrew Codex 0.142.5 did not complete a model run. Claude Code 2.1.150 listed the
test artifacts during initialization but model execution was authentication-blocked.
These results establish bounded compatibility observations, not eight completed
workflows or successful Claude agent behavior.

<!-- RELEASE-EVIDENCE-PENDING: replace with actual immutable runs and independent scores. -->

| Completion item | Required final evidence | Current status |
| --- | --- | --- |
| Ten new skills | Relevant and nontrigger responses, candidate hashes, executed checks, independent rubric scores and any failures | Pending 20 dispatched trials |
| Eight Codex workflows | Installed artifact manifest, exact host version, invocation, actual delegation/short-path behavior, owner/reviewer handoff and independent result scoring | Pending |
| Eight Claude workflows | Same evidence, or precise unavailable-capability record without substituting structural validation | Authentication blocked |
| Final repository state | Final commit, `npm run validate` count at that commit, generated-adapter freshness, evidence hashes and CI result URLs | Pending evaluation publication |

Earlier failed attempts remain in example history/development reports. In
particular, recovery preserves the report whose restore timer included target
provisioning; infrastructure preserves its pre-fix signal-cleanup result. These
are historical failure evidence, not current passing reports. Re-check source
hashes and regenerate runtime evidence after changing the corresponding code.
