# Native workflow observations — 29 September 2026

All **eight latest Codex workflow runs passed their bounded task and native
behavior assessments**. Independent evaluators verified actual named roles,
ownership, review and acceptance evidence. The complete frozen rubric remains
**partial for all eight** because full input/tool confinement was not established;
no prohibited scope breach was observed. Claude initialization succeeded, then
expired OAuth blocked model execution.

The [machine-readable summary](summary.json) covers ten Codex attempts, eight
distinct workflows, and the sixteen planned host/workflow pairs. Scores are
local observations, not measured improvement over an unaided agent or a claim
that every task will succeed.

## Latest Codex results

Codex desktop CLI **0.153.4** used the user's inherited model and reasoning
settings. Native metadata identifies **13 specialist children** across these
eight runs. The main session remained the coordinator; only the four
implementation fixtures required source changes.

| Workflow and independent score | Observed native roles | Task evidence and limit |
| --- | --- | --- |
| [Backend delivery, attempt 02](tal-native-backend-20260929-02/independent-score.json) | Idempotency, Python | Complete SQLite reservation implementation; seven protected checks and seven added tests passed independently. The fixture models a lost client response after successful return; it does not inject a lost COMMIT reply or prove external-effect atomicity. |
| [Consistency diagnosis](tal-native-consistency-diagnosis-20260929-01/independent-score.json) | Consistency | Two actual threads reproduce the lost update before repair and preserve both increments afterward. Final source digest reviewed; one process and one forced schedule. |
| [Messaging evolution](tal-native-messaging-evolution-20260929-01/independent-score.json) | Messaging | Repair preserves duplicate handling, gap behavior and contiguous changes under the supplied deterministic histories. No broker, restart or concurrent-delivery proof. |
| [Worker rollout](tal-native-worker-rollout-20260929-01/independent-score.json) | Durability, infrastructure | Independent specialists challenge successive drafts; final review retains NO-GO until cohort admission, maintenance handoffs, fencing and recovery bounds are demonstrated. This is a rollout review, not an executed Kubernetes deployment. |
| [Recovery validation](tal-native-recovery-validation-20260929-01/independent-score.json) | Reliability, idempotency | Actual local restore/import and reconciliation find missing, unexpected and stale data, duplicate effects and false checkpoint completion. Correctly blocks reopening writes. [Report, harness and outputs](../../ARCHIVE.md) are retained; no production restore or provider repair occurred. |
| [MCP integration](tal-native-mcp-integration-20260929-01/independent-score.json) | MCP, consistency | Finds cached-resource owner bypass, forged principal and version mismatch in the supplied adapter model. Four probe observations reproduced; this fixture is not an SDK or OAuth conformance test. |
| [A2A integration](tal-native-a2a-integration-20260929-01/independent-score.json) | A2A, failure testing | Finds disconnect/cancellation confusion, duplicate effects, terminal-state mutation and task-owner access failure. Four observation groups reproduced against the unchanged local model; no durable peer or SDK conformance claim. |
| [Cleanup, attempt 02](tal-native-cleanup-review-20260929-02/independent-score.json) | Cleanup | Only README changed. The supported legacy command still succeeds, useful rationale remains, and the independent reviewer hashes the delivered document. |

Task/native behavior and isolation have separate outcomes. The compound
`isolation_and_scope` criterion is **1/2** because the host retains broad read
capabilities and write scope is audited afterward. `case_compliant` remains
false. All other criteria in the latest runs are 2/2. Consistency and messaging
originally graded observed scope alone; append-only clarifications apply the
same stricter interpretation as the other six scores while preserving originals.

## Earlier attempts and corrections

- [Backend attempt 01](tal-native-backend-20260929-01/independent-score.json)
  retained passing local checks but failed native orchestration acceptance.
  Default full-history delegation could not load an ephemeral parent, and no
  independent reviewer completed. Its historical classification covers four
  common criteria, not a fresh full implementation rescore.
- [Cleanup attempt 01](tal-native-cleanup-review-20260929-01/independent-score.json)
  completed the task with a disclosed generic fallback reviewer. It does not
  establish named native specialist execution. Fresh attempt 02 does.
- The corrected runner persists the coordinating session and collects V2 child
  identifiers before querying native role metadata. The
  [separate mechanism probe](../../../native-planning/persistent-delegation-probe.json)
  preserves both the usage-blocked attempt and later successful dispatch proof.
- Backend attempt 01 observed a changed global-config hash; its writer is
  unknown. All eight latest Codex runs record matching before/after hashes.
  Backend02 and cleanup02 score clarifications correct an evaluator's mistaken
  statement that those recorded digests were absent; outcomes are unchanged.
- Messaging's initial shell command used `path` as a zsh variable, overwriting
  PATH and causing `command not found`. A later broad executable-filename search
  was interrupted without captured content. The failed command is not counted
  as a code check; the final verifier and independent review are retained.

The first cleanup scheduler's elapsed time includes a suspended parent and a
usage interruption. It is not a workflow runtime or performance measurement.

## Claude result

The [fresh backend attempt](../../../native-planning/claude-backend-attempt/README.md)
used Claude Code **2.1.150**, inherited model/permissions and the installed
project artifacts. Initialization discovered eight project roles and eleven
project skill/workflow entries, then HTTP 401 reported an expired OAuth token. No model
work, review or acceptance verifier ran. The other seven workflows remain
`blocked-shared-authentication-not-run`; they are not seven independently
executed failures. One global Claude JSON configuration hash changed, with its
writer unknown. Authentication was not changed by the test.

## Provenance and reproduction

Each run retains its exact prompt, prepared dependency/source digests, baseline
and final file hashes, observable tool events, independent score, and selected
original/final files. `archive-manifest.json` binds original and published bytes.
Append-only supplement manifests retain clarification records and recovery
artifacts without replacing original scores or manifests. Installed dependency
trees are identified by hashes and repository source, rather than copied into
every archive. Third-party inherited skill bodies are omitted where encountered;
transformation records preserve event locators and original/published hashes.
Hidden reasoning and credentials are not publication evidence.

The [runner and capability contract](../../../native-planning/README.md) and
[frozen fixtures](../../../native-fixtures/) explain reproduction. For example,
run from the repository checkout with a fresh output path:

```sh
node scripts/native-smoke.mjs --case tal-backend-delivery --output /tmp/my-new-backend-smoke --timeout 1200 --run
```

This starts a real model session using the installed host and inherited settings.
Process exit or the runner's `completed-unscored` status is not independent
acceptance. Reproduction requires new scoring and new evidence. The
[session cleanup record](session-cleanup.json) confirms that all 24 temporary
persisted evaluation/probe sessions were archived after collection; their history
was not deleted. This archive does not modify or replace the separate
[runtime example evidence](../../../../../research/engineering-toolkit/verification.md).
