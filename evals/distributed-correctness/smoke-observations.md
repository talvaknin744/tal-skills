# Behavioral observations — 2026-09-29

Seven fresh-agent trials exercised six of the eleven authored cases. One case
was repeated after a reference correction. These are qualitative smoke trials,
not a randomized benchmark, a comparison against an unaided agent, or evidence
that a production service has been fixed.

## Executed work

| Case | Mode | Observable result |
| --- | --- | --- |
| rolling-worker-drain | Review | Reconstructed deployment cancellations consuming the failure budget; specified admission closure, eligible successors, bounded checkpoint/defer, and verification. |
| handoff-ack-loss | Review | Addressed terminal replay, atomic cursor/ownership checks, delayed cleanup, uncertain acknowledgments, and pre-existing corruption. |
| cache-fill-invalidation | Implementation | Changed only the service adapter. The supplied verifier went from 2/5 to 5/5; the reviewer independently reran the 5/5 result. |
| postgres-write-skew | Review, then repeat | Both responses diagnosed the cross-row race and chose a coherent isolation/lock protocol. The repeat provided a narrower email-delivery recommendation. No database was run. |
| resume-mutable-input | Review | Rejected an offset-only resume over changing inputs; specified retained accepted input/configuration, compatible execution, restore validation, and reconciliation when recovery evidence has expired. |
| lost-commit-response | Review | Separated confirmed abort from uncertain commit, preserved request identity, and used the atomic outcome record to resolve retry races with bounded recovery. |

The [scores and evidence](runs/2026-09-29/scores.json) record each criterion
separately. Saved run folders contain the actual prompt, answer, authored command
summary, initial input fingerprints, and run metadata. The cache folder also
contains the implementation diff and independent verification output. No hidden
reasoning was requested or scored.

## Candidate revisions and refinements

The initial five runs preceded the additional DDIA/SRE reading. Their manifests
identify the exact candidate files; `candidate-diff-from-release.patch` in each
folder reconstructs its earlier skill text from the published candidate. Apply
these zero-context patches with `git apply --unidiff-zero` from a copy of the
corresponding skill directory; all seven reconstructed candidates were checked
against their recorded hashes. The cache project patch uses the same option
from a copy of its fixture directory. The two
new book-derived cases used snapshots matching the final skill files.

Independent document review caught two issues before the book refinements:
provider deduplication retention must cover the recovery window, and a regression
barrier must allow a correctly locking actor to proceed. The first transaction
response already avoided the barrier mistake, so its repeat does not demonstrate
that the wording correction caused an improvement.

The later source reading added reproducible input identity and restore evidence,
clock-domain limits, lock/snapshot timing, unknown commit handling, monotonic
reads, and authoritative version ordering. Final independent reviews found no
material issues in those additions. Source review is evidence about the
instructions, not runtime verification.

## Method and limits

Each agent started without conversation history and received only its skill,
raw project, prompt, and task restrictions. Rubrics were withheld until review.
Web/subagent prohibitions and directory scope were prompt instructions, not
platform-enforced restrictions. Final hashes confirm the saved files' state;
the command summaries are agent-authored records, not a complete security audit.
Accordingly these runs are **not declared-capability-compliant executions** under
[the evaluation procedure](../README.md), even when their answers meet the rubric.

Exact runtime model identifiers, token usage, elapsed time, and complete tool-call
counts were not captured; metadata uses unavailable values rather than estimates.
Only the cache's supplied deterministic model executed. It assumes atomic shared
revision floors and successful adapter calls; it does not validate a real
Redis/database transaction or recovery from a cache/database crash gap. The
PostgreSQL, broker, shutdown, and restoration checks in review answers are
proposals, not executed integration tests.

Five cases were not run: shared-grace-budget, deadline-and-outage,
primary-read-lost-update, replica-read-your-writes, and sequential-file-transform.
Provider retention expiry, clock changes, real partitions, and a representative
24-hour deployment also remain untested. Six sampled cases cannot establish
coverage of every instruction branch or correct automatic skill selection.

Structural corpus and harness checks are separate: they validate inputs and
verify that the intentionally broken cache fixture is detected. They do not
score model behavior.

The isolated publication snapshot passes **113 repository checks** across 16
installed skill packs. [Saved validation output](runs/2026-09-29/release-validation.log)
includes packaging checks and 26 new corpus/harness checks; the other checks
cover pre-existing skills. The shared working tree also passed 190 checks,
including separately authored local drafts outside this publication.
