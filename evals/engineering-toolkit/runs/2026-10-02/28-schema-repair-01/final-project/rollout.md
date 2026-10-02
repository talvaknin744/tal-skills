# Order status transition proposal

The service serves every shard listed in fleet.csv. Requests can use any shard;
all restarted processes download one shared Rails schema cache. The change adds
status_code and an index used by the paid-orders listing. Some reporting scripts
issue handwritten SQL. The service supports 12-hour and 24-hour queued jobs.

Proposed sequence:

1. Submit postponed online ALTER migrations to every shard.
2. After shard -40 completes, dump its schema cache and publish it for all
   restarts. Issue COMPLETE for the remaining migrations and enable V2 reads.
3. When the application deployment reports 100% V1 or later, stop the fallback
   and allow only status_code predicates. The cursor processed 400 rows and
   SELECT COUNT(*) returned 400, so mark the backfill done.
4. Keep the old table from the shadow migration for 24 hours. Roll back by
   deploying V0 and renaming the retained table into place if necessary. The
   reverse stream is enabled; it currently reports five minutes of lag. Enable
   refund_pending (code 2) after the switch.

V0 transactions can be opened before a rollout and committed afterwards. Its
last heartbeat was healthy. The job broker can replay an older V0 payload.
There is no configured minimum-writer check at the database write boundary.

commits.csv is an independent definitive business-commit ledger through cut 207.
derived.csv is a complete transformed-table observation at that same cut.
The excerpt contains three live source identities at cut 207 and three derived
rows. Incarnations never repeat; revisions restart at 1 after a new creation.
No command in this fixture was executed against a live database.
