No. The persisted cursor records traversal position, and the completion epoch check protects only job status. Neither prevents stale publication or unsafe deletion. The [supplied worker](/private<trial>/workspace/project/design.md:41) also checkpoints before publication, publishes buffered output without sealing it, and ignores `has_more`.

A permitted failure schedule is:

| Step | Action and consequence |
|---|---|
| 1 | A foreground reader pins S/7; a retention hold also requires it. Worker A claims epoch 1, reads x/1 and y/1, saves cursor `y`, and runs `copy_buffered` into D1. A pauses before publication. |
| 2 | A user deletes x, creating its newer tombstone, and updates y to authoritative version 2 on S/8. Another live identity `a`, sorting before `y`, is admitted on S/7. |
| 3 | Worker B takes over at epoch 2. Starting after saved cursor `y`, B reads z and saves cursor `z`, then pauses before copying or publishing z. |
| 4 | A resumes. Its unconditional publication clears x’s tombstone and points y at D1’s stale version-1 bytes. Ownership epoch 2 does not fence this write. |
| 5 | A calls `force_delete(S/7)`, despite z and a still referencing it, the reader pin, and the hold. A’s completion update is rejected because its epoch is stale. |
| 6 | The system crashes. D1’s unsealed buffered bytes may be lost. After recovery, cursor `z` conceals unfinished work; S/7 is gone, x has been resurrected, and y’s serving location no longer preserves its authoritative version-2 value. |

The completion rejection cannot undo either publication or deletion. Independently, even a successfully published page ending at `y` cannot establish coverage of later admissions before `y`.

A minimal enforceable protocol would be:

1. **Register work before creating output.** Claim J, then use `metadata_tx` to check the current epoch and persist a pending attempt in J’s metadata: unique destination name, selected identities/versions/source locations, and page boundary. Keep the committed cursor unchanged. This makes output created before a crash discoverable without assuming a destination-listing API. Pin S/7 while reading its bytes; pin acquisition must check ACTIVE in the metadata authority.

2. **Seal before publication.** Run `copy_buffered`, then `durable_seal`. Retain the returned manifest/checksums and the mapping between selected inputs and destination contents. Never modify or reuse a sealed output. If recovery lacks recorded seal evidence, it must not infer durability from output existence or a copy return; leave that candidate tracked and, if needed, recopy into a fresh name.

3. **Publish conditionally at the protected operation.** For each selected object, one `metadata_tx` must check:
   - J still has the attempt’s epoch;
   - the object is live, with the selected version and exact source location;
   - successful seal evidence exists for its proposed replacement.

   Atomically publish the destination location and its durable replacement record. A tombstone, newer version, or changed location rejects the stale result. If the current version still references S/7, it remains outstanding work for a retry or rescan.

   A lost publication response means **unknown outcome**, not failure. Reconcile from authoritative metadata and publication records. Preserve any subsequent update or delete; never replay an unconditional write.

4. **Checkpoint completed page handling, then rescan.** Advance the cursor under the epoch check only after every selected row has a known publication or revalidation outcome. A crash before that checkpoint causes safe replay through the same conditional checks.

   Honor `has_more`. Bound work per activation and preserve safe continuation across pauses. After reaching the end, attempt retirement; if live references prevent retirement, start another sweep from the beginning. A pass ending is only a traversal observation—there is no snapshot or mutation watermark.

   With finite admissions, released pins/holds, and fair retries, repeated sweeps can drain S/7. Ongoing admissions can delay completion indefinitely. Budget exhaustion or pass exhaustion must therefore leave J visibly incomplete.

5. **Authorize retirement atomically.** In `metadata_tx`, check the current epoch and invoke the supplied retirement gate: no live references, reader pins, or retention holds still need S/7, and required durable replacement records exist. An earlier empty page or separately observed zero count is insufficient.

   Persist the immutable retirement record/token and reclamation-pending state. The ACTIVE→RETIRED transition closes admission in the same authority. Do not clear reader pins or holds merely because ownership changed. Release a copy pin only once its source I/O has ended; takeover alone does not prove that a paused worker stopped reading.

6. **Delete using the retirement proof.** Call only `delete_retired(S/7, token)`. Retry after crashes or uncertain responses: repetition is explicitly harmless. The token remains valid across takeover, so physical deletion does **not** require the deleting worker to retain J’s epoch. Generation binding prevents an old token from authorizing deletion of a reused volume’s newer generation.

   Record confirmed cleanup and completion under the current epoch. Keep traversal, accepted publications, retirement authorization, and physical cleanup separately recoverable.

Temporary output needs an explicit boundary too. Persist planned names before creation and retain records for uncertain, sealed-unpublished, and published outputs. A publication timeout must never cause a referenced destination to be classified as orphaned. The supplied APIs provide no general destination deletion/listing operation and no automatic pin expiry. Consequently, the protocol can keep temporary output recoverable and identify collection candidates, but cannot promise physical orphan cleanup using an unstated API. Unresolved output accumulation should limit further copying.

After recovery, coverage and semantic checks should use an oracle independent of the cursor and job status:

- **Interrupt every boundary:** before/after intent registration, buffered copy, sealing, publication commit with lost response, checkpoint, retirement, and deletion with lost response. Resume an old owner after takeover at each boundary. Verify that stale publication/checkpoint/retirement writes fail, while deletion with an already valid retirement token remains safe.
- **Exercise mutable pagination:** retain z beyond the first page; add identities before the saved cursor, during restart, and between page exhaustion and retirement. Under quiescence, verify eventual drain through rescans. Under continuing admissions, verify that remaining references stay discoverable and block retirement.
- **Check actual serving semantics:** fresh reads return y’s version-2 bytes; x’s tombstone remains authoritative. Every published location has seal evidence and correct contents, not merely a matching version label. z and late admissions are either durably handled or remain recoverable on an intact S/7 with J incomplete.
- **Check pins and holds:** retirement fails while either needs S/7. Already pinned readers can finish their resolved reads. Exercise both orders of admission versus retirement: admission first blocks retirement; retirement first rejects admission to S/7.
- **Check recovery inventory:** account for every registered output and unfinished page. Keep uncertain attempts visible; preserve committed publications despite lost acknowledgments. Verify generation-mismatched deletion tokens cannot delete a reused volume.

This was a static contract review. The file is unchanged; no destructive operations or crash tests were run.
