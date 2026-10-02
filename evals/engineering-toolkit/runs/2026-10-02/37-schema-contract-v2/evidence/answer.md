## Review

**Do not expose V2 reads or `refund_pending` yet.** The supplied [fleet snapshot](../final-project/fleet.csv) shows migration `orders_status_m17` still running on shard `40-80`: the column is absent and the index is unusable. An accepted `COMPLETE` command does not establish completion. Publishing one shared schema cache from shard `-40` would therefore put restarts at risk on `40-80`.

The [authoritative contract](../final-project/status-code-contract.json) maps `pending=0`, `paid=1`, and `refund_pending=2`. I reconciled the complete [transformed observation](../final-project/derived.csv) against the definitive [commit ledger](../final-project/commits.csv) at cut 207:

| Key | Expected at cut 207 | Transformed observation |
| --- | --- | --- |
| 11 | `order-a`, revision 1, pending `0` | Matches |
| 22 | `order-b`, revision 2, paid `1` | Matches |
| 43 | `order-c`, revision 1, paid `1` | Missing |
| 99 | Absent after committed delete 207 | Extra paid row at revision 1 |

Rejected update 206 does not change key 11. The expected paid keys are `{22, 43}`; filtering the supplied transformed rows for code `1` gives `{22, 99}`. The proposal’s cursor and count of 400 cannot establish membership or value correctness. Row-level fallback also cannot recover a missing row or remove an orphan from a listing.

The [generation contract](../final-project/versions.csv) says V0 writes only `status_text`; V1 writes both representations and falls back when `mapped_rev` differs from `source_rev`; V2 reads only `status_code`. It says all three advance the source revision on business mutations. That contract does not establish an admission fence: the [proposal](../final-project/rollout.md) explicitly allows an open V0 transaction to commit later and an old V0 job payload to replay. The write behavior of any other maintenance or handwritten-SQL path still needs inventory.

## Bounded sequence

1. **Finish schema installation.** Hold V2 reads and code `2`. Require observed `complete`, column presence, and usable index for `orders_status_m17` on *every* shard. Check that the generated Rails schema cache matches every shard before publishing it; test restarted processes and handwritten SQL against that cache. Stop on any mismatch.

2. **Run the V1 bridge.** Admit V1 dual writers for codes `0` and `1`, retaining its fallback while V0 can write. The paid listing must include authoritative stale or unmapped rows and exclude deletions; an index-only `status_code` predicate is premature.

3. **Repair and reconcile the data.** Backfill from a consistent source snapshot, conditionally applying each value against both incarnation and source revision. Retry intervening updates and handle deletes and recreated keys. Repair the demonstrated missing `43` and extra `99`, then compare complete source and transformed sets in both directions at one cut across all shards. Stop if coverage, values, revisions, or membership disagree.

4. **Fence incompatible writers, then expose V2.** Enforce a minimum writer generation at the actual write/commit boundary, or prove V0 transactions and queued or replayable V0 work have drained. A deployment percentage and heartbeat do not prove this. After the fence and reconciliation pass, canary V2 reads and the paid listing on every shard, then expand only while parity holds.

5. **Gate code `2` separately.** Enable `refund_pending` only after V0 and V1 readers, writers, jobs, and rollback paths can no longer encounter it, or after a tested compatibility conversion exists. Both older generations support only `pending` and `paid`.

For any shadow-table switch, the physical table identity, copy checkpoint, reverse-stream position, lock behavior, and engine/version contract are **unknown** in the supplied files. The following are proposed operating bounds, not observed engine guarantees; verify that the engine can enforce the lock wait before attempting a switch.

| Outcome | Proposed owner action and permitted traffic |
| --- | --- |
| Before switch / copying | Migration operator records serving table and durable copy/replay checkpoint. Keep the proven `status_text` path with V1 fallback; allow non-destructive copy. If identity or checkpoint cannot be established within **15 minutes of preflight**, make no switch attempt. |
| Confirmed blocked or failed | Cap switch lock wait at **30 seconds**. Pause the switching worker; within **10 minutes**, confirm serving authority, migration status, locks, and cleanup. Keep compatible fallback traffic. Retry only after catch-up and failure semantics are verified. |
| Unknown outcome | Pause switching and cleanup. Within **10 minutes**, reconcile catalog, routing, migration status, and durable writes. If serving authority cannot be proved, stop affected writes and escalate; do not infer failure from a timeout. |
| Confirmed success | Prove the new table serves, keep dual writers and reverse capture active, and check post-switch writes and parity within **15 minutes**. Freeze further exposure on failure; use only a verified revert or forward repair. |

## Rollback limits and checks still to run

A 24-hour retained table is not a demonstrated rollback window. The supplied reverse stream is five minutes behind, so an immediate rename could discard post-switch writes or deletes. The service also has 12-hour and 24-hour jobs, replayable V0 payloads, and transactions that can cross deployment boundaries. Retention must cover their *actual* eligibility and a verified reverse-stream catch-up point.

The supported first rollback target is **V1 with fallback and dual writing**. Admitting V0 again requires V2 code-only readers to be gone and every relevant `status_text` value to be current and V0-compatible. Once code `2` has been committed, V0 and V1 cannot interpret all persisted values; recovery then needs a tested forward repair or scoped restore/replay, not a table rename alone.

**Executed here:** read-only comparison of the supplied files at cut 207. No project files were changed and no external services or live database were used.

**Still required before exposure:** observe fleet completion and cache restarts; inventory all writers and SQL readers; exercise an intervening update, delete/recreate with revision reuse, rejected mutation, late V0 commit, and old job replay; compare complete base, transformed, and paid-listing results at the same cut; rehearse a blocked and ambiguous switch with its lock bound; and rehearse rollback after post-switch writes while verifying reverse-stream ordering and catch-up. The supplied ledger gives expected base state, but no live base-table or index-query observation is supplied.
