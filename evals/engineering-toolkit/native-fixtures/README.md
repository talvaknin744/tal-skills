# Native workflow smoke inputs

Eight small projects for the eight installed native workflow entrypoints. These
are authored fixtures, not native-execution results. Codex runs are planned; Claude
execution remains subject to the separately recorded authentication blocker.

For each trial, copy only the selected directory's `rawfiles/` contents and its
`prompt.md` into a new disposable project. Install that workflow's actual native
dependency closure. Prefix the prompt with `$<workflow>` in Codex or `/<workflow>`
in Claude. `case-index.json`, `author-checks.json`, and `manifest.json` are evaluator
inputs and must remain outside the candidate workspace. A copy is not an enforced
sandbox: record access/tool restrictions and any deviations honestly.

The index declares task mode, allowed source edits, runtime outputs, exact local
verification arguments, and separate acceptance criteria. Public `verify.py` files
express the user contract and are protected from candidate edits. A review probe
prints observations; exit zero is not a release recommendation or protocol pass.

| Workflow | Candidate task | Local command |
| --- | --- | --- |
| `tal-backend-delivery` | Complete duplicate-safe Python/SQLite reservations | `python3 -B verify.py` |
| `tal-cleanup-review` | Consolidate one repeated README command | `python3 -B cli.py --mode legacy` |
| `tal-consistency-diagnosis` | Repair deterministic threaded lost update | `python3 -B verify.py` |
| `tal-messaging-evolution` | Repair reordered account snapshot handling | `python3 -B verify.py` |
| `tal-worker-rollout` | Review three-pod, 18-hour-job rollout | No runtime verifier; evidence-backed procedure review |
| `tal-recovery-validation` | Rehearse the inconsistent ledger restore | `python3 -B restore.py backup.json scratch/rehearsal` |
| `tal-mcp-integration` | Review pinned private-handle gateway | `python3 -B probe.py` |
| `tal-a2a-integration` | Review pinned observer/task adapter | `python3 -B probe.py` |

All commands run from their copied project root. They use Python's standard library
and synthetic local files/SQLite; no network, live infrastructure, paid service,
credentials, or model calls are needed to execute the raw fixtures. The protocol
pins identify the intended peer contracts; these local adapters are not SDK peers
and cannot establish protocol interoperability. Native model execution is a
separate, explicitly launched test of installed workflows and named roles.

`author-checks.json` records fixture-author observations, including expected red
baselines and local corrected-probe controls. These are not candidate model runs,
independent evaluation scores, or host-discovery evidence. Native runs must capture
actual delegation, one writer per overlapping source path, a stable candidate,
separate review, correction/re-review when needed, and final acceptance evidence.
