# Static instruction review 06 — merge controls and deadline comparisons

No actionable technical defect was found in the four scoped instruction changes. This is an independent static review, not a model evaluation or a claim that the added completion requirements are followed in practice. I authored none of the reviewed candidate files and changed no candidates, fixtures, scores or prior reviews.

## Exact diff scope

| Comparison | File and current lines | Change |
| --- | --- | --- |
| Freeze08 → freeze09 | `skills/engineering/concurrency-correctness/references/merge-invariants.md:40–43` | Adds an uncontended successful control alongside conflict, duplicate and unavailable-authority controls; checks caller outcome and business state. |
| Freeze09 → freeze10 | `skills/engineering/concurrency-correctness/SKILL.md:57–60` | Adds a conditional final record for independently accepted decisions that merge, with separate control outcomes and proposed/executed status. |
| Freeze09 → freeze10 | `skills/engineering/microservice-operations/SKILL.md:51–56` | Requires original/reconstructed budget comparison at conversion/acquisition and later supplied checks, including clocks, earlier caps, unknowns and separate timing controls. |
| Freeze09 → freeze10 | `skills/engineering/microservice-operations/references/deadline-domains.md:58–63` | Separates clock steps before/after conversion and initial allowance from later observations. |

The exact before/after paths, content hashes and unified diffs are retained in `static-review-06.json`. OPS freeze08 snapshot bytes match its freeze09 manifest. No other file changes in the two packages occur across these three freezes. Infrastructure and overload candidate identities, runner/dependency identities and corpus identity records are also unchanged across the manifests; this is an identity comparison, not a re-evaluation of their behavior.

## Technical and instruction assessment

The merge additions address a valid distinction: rejecting all operations can preserve an invariant while failing useful success behavior. Separate caller results and business states distinguish one admitted request, genuinely competing requests and a replay. Authority loss/recovery is evaluated against the actual enforcement design; the prose does not prescribe a datastore, compensation policy or fixture answer. The existing reference still separates convergence, business validity and freshness, and retains the need for actual transactional/conditional boundaries where a repair depends on them.

The deadline additions require evidence at the point a timer allowance is acquired or reconstructed as well as at later observations. This is technically sound: a later remaining-budget value cannot by itself establish the duration initially supplied to a timer. Naming each clock and earlier cap, separating pre/post-conversion clock steps, and keeping unknowns explicit avoids unsupported subtraction across domains or invented skew bounds. No new arithmetic formula, numeric answer or runtime guarantee was added. Existing Go monotonic-data/reconstruction guidance remains unchanged.

The public names, descriptions and UI metadata are unchanged. New requirements remain conditional on the merge or changed clock/serialization branch and operate inside the existing task-mode/scope constraints. They do not make generic cache work perform a merge review or make unrelated microservice work perform deadline analysis. Proposed controls stay distinct from executed checks. Where a mechanism is absent, its applicability or missing evidence must be stated rather than inventing an authority, serialization hop or observation.

Using the writing-for-agents hierarchy, the short entrypoint additions make the final observable deliverable explicit while the references retain the mechanism and rationale. The small overlap is a deliberate completion-versus-explanation tradeoff. It is not blanket duplication to remove, though future changes should keep the paired requirements consistent. No independent discovery trigger or external package dependency was added.

The prior concurrency SKILL body through line 55 is byte-identical, including the acknowledgement/read/allowed-overlap record and four cache boundary rows. `cache-coherence.md` is byte-identical. OPS cancellation completion primitives, `wait_for()` overshoot, safe resource reuse, cleanup ownership/escalation, uncertain-effect reconciliation and useful recovery after cleanup are preserved. Source/fake-clock arithmetic still does not establish runtime timer, wire or cleanup behavior.

## Identities and checks

| Package | Freeze08 | Freeze09 | Freeze10/current |
| --- | --- | --- | --- |
| Concurrency | `477470e2c65567e814850c84f7d0dd913b4627e91380d7f3cc3882331c5b1644` | `945cdaa4913a1a37fbffa1be4a4fcbe8ef44a41d6ef8c50e778979ab90e0994d` | `3c6640491bc773487d4fa0eba18decf154cd17609bc2be32c295710da7916c22` |
| Operations | `fa2ade9d9a8f17467610fb05daa40ac41a04ccc3b0f1abc42fbd6bc4aea79b12` | same as freeze08 | `23f7986b50ece9a6e444c38dd87627e9afe188f6573ed3a4eec9d77b091969c9` |

Current file SHA256 identities:

- Concurrency `SKILL.md`: `9f33ba03c6760d0e2ebc420ecd2a1c6bb70e5a800beef1412757af673419e2c7`.
- Merge reference: `c5ece1aab0595f94eff9c49b306ac757744cbcdb2818d57efd861141b648ae16`.
- Operations `SKILL.md`: `330fcfa23a9d71e90852f9e74ba6b20280eaaf7b8751c9cf9125015ecd40fdf9`.
- Deadline reference: `5ab4749cb8fb200b3456144574b0fe56b324ed25699d45933bcb500a518fbdd9`.

All 21 current package files and 31 historical snapshot records match the declared exact file sets, hashes and modes. Package tree digests were recomputed. All three freezes pass the runner's metadata-only `validateFreeze`; runner tree remains `5228a920c35c3741c13798dd7be2f3fa00f31b135b51c997b8d7a0508ae89721` and library SHA remains `dab7d89dc3b782e7b5313c58e0c7a09afb173b1b0bb13ab6b33691238848c63e`. All 34 relative file pointers in the two packages resolve within their own package.

Native03's historical installed concurrency tree is **477**, whereas the current package is **3c** and current OPS is **23**. Its whole installed closure is not asserted to match the current candidate, and its prior model outcome is not used as validation of these changes. No models, evaluation responses, scores or fixture contents were read or modified for this static pass. The exact-source identity and technical checks here cannot replace fresh behavioral evidence for the changed instructions.
