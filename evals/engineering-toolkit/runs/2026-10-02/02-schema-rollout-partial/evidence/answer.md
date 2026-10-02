## Review

**Do not expose V2 reads under the proposed sequence.** The supplied evidence has two concrete blockers:

- Shard `40-80` is still running the migration, with no `status_code` column or usable index. Its `COMPLETE` command was accepted, but the shard has not completed. Publishing a schema cache from `-40` would send a schema that some requests cannot use. ([fleet.csv](../final-project/fleet.csv), [rollout.md](../final-project/rollout.md))
- At cut 207, the definitive ledger requires live rows `11/pending`, `22/paid`, and `43/paid`. The complete derived observation has `11`, `22`, and deleted row `99`: it **misses 43 and retains 99**. The rejected update at commit 206 must not change row 11. Equal counts of three here—and the proposal’s cursor/count of 400—do not establish correct coverage. ([commits.csv](../final-project/commits.csv), [derived.csv](../final-project/derived.csv))

The supplied [versions.csv](../final-project/versions.csv) says V0 writes only `status_text`, while V1 maintains both representations and falls back when `mapped_rev` differs from `source_rev`. A deployment report of “100% V1” cannot close that fallback: an open V0 transaction or replayed V0 job can still commit, and there is no database write-boundary check to stop it. A paid-orders query using only the new index can also omit stale or unmapped rows while V1 point reads appear correct. ([rollout.md](../final-project/rollout.md))

## Bounded exposure sequence

1. **Complete the schema stage on every shard.** Verify the migration’s completed state, required columns—including `mapped_rev` if it is persisted—and index usability per shard. Then build and validate the shared schema cache against the fleet; exercise restarts and the handwritten reporting SQL before publishing it.
2. **Run V1 as the compatibility bridge.** Keep values limited to `pending` and `paid`. Preserve its revision-aware fallback in reads and make the paid-orders listing include rows whose new mapping is absent or stale. Confirm V1 updates `status_text`, `status_code`, `mapped_rev`, and `source_rev` in the required row transaction.
3. **Repair and reconcile the backfill.** Read source identity, incarnation, revision, and value consistently; apply mappings conditionally against incarnation *and* revision. Cover concurrent updates, deletes, retries, and catch-up after the scan. At a declared cut, compare complete source, derived, and index result sets in both directions. Resolve missing `43` and extra `99` before advancing.
4. **Close V0 write eligibility, then expose V2 reads.** Drain, translate, or reject old queued and replayed work; account for open transactions. Enforce the writer floor at the write/commit boundary or demonstrate that no V0 commit can remain. Reconcile once more after the last eligible V0 write. Only then can code-only predicates and the paid-orders index become authoritative.
5. **Retain the bridge during the rollback window.** Keep V1-compatible writes and the fallback available. Enable `refund_pending` only after V0 and V1 readers, jobs, and rollback paths have been retired or an explicit value-preserving recovery path has been proved.

## Rollback limits

Before code 2 is written, a V2-to-V1 reader rollback is plausible **if** the bridge and `status_text` remain current. Re-admitting V0 writers requires restoring fallback reads before they can commit. Renaming the retained old table is not a proven rollback: five minutes of reverse-stream lag can omit post-switch writes, and 24-hour retention does not address replayed jobs or an unbounded open transaction. The stream must catch up to a defined cut and the old table must reconcile before any swap. Once `refund_pending` exists, V0 and V1 cannot interpret every value; recovery then needs a demonstrated forward repair or a scoped restore and replay, with its data-loss limit stated. ([rollout.md](../final-project/rollout.md), [versions.csv](../final-project/versions.csv))

## Checks still to execute

The files establish the blockers above; **no live database command or rollout rehearsal is evidenced**. Acceptance requires per-shard schema and cache-restart checks; old/new reader, writer, job, and handwritten-SQL compatibility checks; a complete ledger-to-base-to-derived-to-index comparison at one cut; intervening-update and delete/recreate tests with revision reuse; a V0 transaction attempting to commit across the writer-floor change; and a rollback rehearsal after new writes that verifies identities and values in both directions. Keep code 2 disabled until its separate recovery limit is accepted.

No project files were changed.
