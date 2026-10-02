## Review of the supplied evidence

**The proposed switch is blocked.** Shard `40-80` is still running the migration and has neither the column nor a usable index; its accepted completion command is not evidence of completion. Publishing the schema cache from `-40` would expose a schema that one serving shard lacks. [fleet.csv](../final-project/fleet.csv) [rollout.md](../final-project/rollout.md)

At the supplied cut 207, the definitive ledger and complete transformed-table observation disagree:

| Identity | Expected from committed operations | Observed transformed row |
|---|---|---|
| 11 / `order-a` | pending, revision 1, code 0 | Matches |
| 22 / `order-b` | paid, revision 2, code 1 | Matches |
| 43 / `order-c` | paid, revision 1, code 1 | Missing |
| 99 / `order-d` | Deleted | Extra paid row at revision 1 |

The rejected update to 11 changes nothing. A code-only paid listing over the observed rows would return **22 and 99**, instead of **22 and 43**. Equal row counts do not detect either error, and the 400-row cursor/count claim does not establish coverage or correctness. [commits.csv](../final-project/commits.csv) [derived.csv](../final-project/derived.csv)

The supplied version contract says V0 advances the authoritative revision on every business mutation, which makes a revision-guarded backfill possible. V0 still writes only `status_text`; its open transactions and replayable jobs can leave `status_code` stale after V1 has filled it. Deployment percentage and a healthy heartbeat do not close that write path. [versions.csv](../final-project/versions.csv) [rollout.md](../final-project/rollout.md)

## Bounded exposure sequence

1. **Finish schema installation.** Keep the old read path and `refund_pending` disabled. Require migration completion, column presence, and index usability on **every** serving shard. Then validate and publish a shared schema cache that works on every shard, including after process restart. Check the handwritten reporting SQL against the resulting schema.
2. **Run the V1 bridge.** Use V1’s same-row dual writes and revision-aware fallback. Backfill from a consistent source snapshot, applying each value only if both incarnation and source revision still match; handle deletes and retries. While V0 can write, keep the paid listing on a path that includes stale or unmapped rows—an index-only `status_code` predicate can omit them.
3. **Reconcile before switching reads.** Repair the missing 43 and extra 99 results, catch up concurrent mutations, and compare complete source, transformed, and paid-listing sets at one definitive cut. Require matching identities, values, incarnations, and revisions in both directions.
4. **Establish a V1 writer floor, then expose V2 reads.** Reject V0 at the actual write/commit boundary, or prove that all open V0 transactions and 12-hour/24-hour queued or replayed work have drained. Reconcile again after that boundary. Only then allow code-only reads and predicates. Continue writing both representations.
5. **Gate code 2 separately.** Enable `refund_pending` only after V0 and V1 readers, writers, reporting paths, and replayable work have lost eligibility, and its representation is verified. Enabling it ends the simple rollback path to those generations.

## Rollback limits and acceptance checks

Before code 2, an application rollback from V2 to V1 can use V1’s fallback **if dual writes and old-compatible values have been preserved**. Admitting V0 writers requires code-only readers and predicates to stop first, followed by reconciliation. A retained shadow table is not, by itself, a recovery point: the reverse stream is reported five minutes behind, and a 24-hour retention period does not prove that post-switch writes and deletes can be recovered. After code 2, V0 and V1 do not support the value; recovery needs a validated compatible forward repair or a lossless restore and replay, not a table rename. [rollout.md](../final-project/rollout.md) [versions.csv](../final-project/versions.csv)

**Established by the supplied files:** the incomplete shard, the stated writer contracts, and the exact cut-207 row discrepancies above. **Still to execute:** live per-shard and schema-cache checks; backfill tests with an intervening update, delete/recreate, and retry; a full-set comparison after repair; proof that an old open transaction and replayed V0 job cannot commit across the writer-floor boundary; paid-listing and handwritten-SQL checks; and a rollback rehearsal after new writes that verifies reverse-stream catch-up and recovered values. The fixture reports that no command was run against a live database. [rollout.md](../final-project/rollout.md)

All files were left unchanged; no external services were used.
