# Cleanup follow-up

The follow-up restores explicit activation boundaries, portable sibling handoffs
and source indexes inside the four independently installable Temporal packages.
The stale one-time evaluation timing override is removed from AGENTS.md.

The README Reference catalog gives each of the 35 promoted names a one-line
purpose. Completion bullets in the affected docs describe observable outcomes,
and examples follow their governing rules. Historical productivity documentation
is preserved under docs/misc. Current prose metrics cover skills/, docs/, README,
AGENTS, CHANGELOG and CONTRIBUTING; vendored integrations, research and historical
evaluation records have separate scopes.

## Git archive and clone measurement

The original backup tag, backup branch and five obsolete development branches
are preserved in a [verified release bundle](https://github.com/talvaknin744/tal-skills/releases/download/v1.0.0/tal-skills-pre-cleanup-refs-2026-10-05.bundle)
and removed from origin. Marketing was also bundled and rebuilt on clean main;
its three publication drafts retain their exact original bytes. The
[operation receipt](cleanup-git-archive.json) records every ref and the bundle
SHA-256. An ordinary clone after these changes measured 5,734,268 pack-and-index bytes
(5.47 MiB, the Git size-pack metric), with no old schema blobs reachable from its advertised branches/tags.
The bundle also preserves older pull-request heads.

To inspect a historical ref, download the bundle from the release and run
`git bundle verify <bundle>` inside a repository, then fetch only the needed ref
into a separate archival checkout. Recreating backup refs on origin would make
ordinary clones download their old history again.

## Evidence integrity

All 967 original protected records still match their original identities through
exact publication receipts. Historical scores, prompts, criteria, manifests and
freezes are preserved. The old review's spacing correction and three documentation
moves are bound by [publication receipts](cleanup-followup-publication.json).

The seven original focused cases now have
[canonical prompt and rubric bindings](../evals/phase5-cleanup/runs/2026-10-05-final/focused-corpus-binding.json)
verified against their archived authored inputs. Their original fixture projects
were empty, including the purported Go handler, comment and source-evidence
fixtures. This gap is preserved and disclosed; new complete native-host cases
are versioned separately.

## Behavioral evaluation

The [case report](../evals/cleanup-followup/runs/2026-10-05/review.md) preserves
120 native Codex attempts: 119 executed and independently scored, plus one
capacity failure followed by a matching fresh-workspace retry. Responders and
fresh single-case graders requested Luna on Codex CLI 0.160.0. Exact backend
model revision and default reasoning settings were not emitted.

The four requested nontriggers and Go/Python cases ran unchanged against
`pre-cleanup-2026-10` and the revised packages with the same harness. All four
nontriggers passed their critical boundaries without observed target body reads.
Both language verifiers passed, including independent reruns. Python's uncertain
remote-effect criterion scored zero in the baseline and first two revisions,
then partial in the final revision. The supplied provider has no reconciliation
or deduplication contract, so a passing cancellation verifier does not prove
safe remote retry. A new contract-gap case passes without inventing that API;
it does not replace the unchanged case or erase its partial result.

All 35 unchanged positives ran through normal discovery in two revisions.
Automatic target body reads increased from 28/34 to 32/34; architecture is
explicit-only. The latter run omitted messaging-reliability and
technical-deprecation, which were read in the first. A final narrow Temporal
payment run also omitted its target body. These observations establish coverage,
with inconsistent activation still visible. The final revision changes only
Python and Temporal reliability; all 35 descriptions and the other 33 packages
match the second full discovery run.

Complete versioned cases demonstrate actual primary and sibling body reads in
both generated Codex and canonical packages, native-reader fallback, a comment
nontrigger, and an installed Temporal source-index lookup. An explicit
architecture rerun did not prove a body read. Seven original empty fixtures and
two invoice-worded extraction cases remain disclosed as material coverage gaps.
Claude execution and a literal Skill tool are unavailable. Filesystem reads do
not establish either host guarantee.

All 119 final evidence-excerpt audits match observable evidence. Original grading
attempts, quote mismatches and technical score-support disputes are preserved;
attribution verification does not settle disputed scores. Five earlier
critical-zero runs and 19 critical-partial runs remain in the report. The
[archive manifest](../evals/cleanup-followup/runs/2026-10-05/archive-manifest.json)
binds the compact corpus, scores, candidate identities and full release evidence.

## Retention and targets

Retention governs every count. The former 2,500 / 1,250 / 25,000,000-byte targets
were below the retained source even before this follow-up. Phase 5 had 3,008
tracked files and 1,699 eval files, approximately 25.9 decimal MB.

At this follow-up checkpoint, the measured source floor and revised targets are
3,093 tracked files, 1,738 files under evals/, and 29,495,273 actual bytes
(28.13 MiB). The file-count ceilings equal these retained measurements.
No protected record is removed to meet a number. The revised ordinary-clone
pack ceiling is 6,500,000 bytes, including its index. The earlier 6,000,000-byte
estimate is already exceeded by the 6,251,207-byte ordinary clone before the
identity metadata fix. The final measurement is recorded in the PR body;
local Git object storage is not that measurement. Raw runtime copies remain in
the verified release archive, outside cloneable source.
