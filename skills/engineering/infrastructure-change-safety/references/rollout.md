# Rollout practices

Read this for service, schema or capacity transitions. Choose checks from the workload's failure boundary; a small configuration edit does not require a full disaster-recovery exercise.

## Compatibility through retirement

- **Trigger:** Old and new application versions coexist with a schema or infrastructure change.
- **Failure:** New handlers pass while old workers, retries or rollback paths access removed fields or resources.
- **Mechanism:** List supported reader/writer generations and transition stages. Introduce compatible support, migrate or backfill as needed, switch consumers, then retire obsolete resources only after their last dependent work finishes or transfers safely.
- **Applicability:** Include long-lived jobs and retained/replayed inputs. The chosen database algorithm controls locks, cutover and rollback availability.
- **Counterexample:** Online DDL is not proof of application compatibility; reversing schema can discard data created only in new fields.
- **Verification:** Run old/new consumers against each supported stage, verify backfilled business invariants, and test the actual rollback or forward-repair path with post-change writes.

PlanetScale Vitess is a concrete limit, not a portable database contract: its instant deploys cannot be gated/reverted, may terminate queries while acquiring metadata locks, and foreign-key additions through deploy requests do not validate existing rows. Check the selected engine/version before adopting product-specific steps. [Current contract](https://planetscale.com/docs/vitess/schema-changes/deploy-requests)

## Capacity during transition

- **Trigger:** Rolling replacements, failover, changed concurrency limits or a cold replacement environment.
- **Failure:** Remaining capacity cannot absorb demand, or retries and cache warming overload the recovery target.
- **Mechanism:** Estimate available capacity at each stage, including bootstrap dependencies and competing retries. Gate admission and rollout progress on completed work, queue age and saturation; bound retry ownership and load rather than merely raising attempt counts.
- **Applicability:** Use observed workload costs and the promised failure domain. For long jobs, admission must exclude retiring generations and ownership must survive forced interruption; a larger shutdown timeout alone is insufficient.
- **Counterexample:** Three nominally healthy replicas can all be retiring, cold or dependent on the same unavailable facility.
- **Verification:** Interrupt a stage and observe useful throughput and accepted-work completion; include cold caches/dependencies when relevant. A canary needs representative work-unit outcomes, not only process readiness.

Cloudflare's outage account supports testing the complete recovery dependency set and controlled recovery admission. Its availability recovery did not eliminate all data gaps; specify acceptable data loss and usable state independently. [Incident account](https://blog.cloudflare.com/post-mortem-on-cloudflare-control-plane-and-analytics-outage/)

## Large storage copies

Use when cutover depends on a bulk copy or backfill. Track every required range
and unresolved failure, including cold and deletion-heavy history. Establish
the source position or comparison window and how concurrent writes/deletes
reach the destination. Ordinary dual writes need durable partial-success
evidence and reconciliation; sampled live-read equality cannot prove that all
historical ranges were copied.

Compare payload and relevant deletion, expiry and write-order metadata with
explicit tolerances. Test an incomplete cold range, changed TTL, missed deletion
and intervening update; completion remains blocked until required coverage and
semantic checks pass. Retain the supported recovery path through the authority
switch. [Discord's migration account](https://discord.com/blog/how-discord-stores-trillions-of-messages)
motivates checking the unfinished tail. The [ScyllaDB Migrator 2.1.x validator](https://migrator.docs.scylladb.com/stable/validate.html)
provides timestamp/TTL comparisons; its write-pause instruction is specific to
MySQL-to-ScyllaDB, not a universal migration procedure.

For tombstone-related timeouts, preserve the deployed engine's deletion/repair
contract and maintenance capacity budget. [Cassandra's tombstone rules](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/tombstones.html)
explain why shortening retention or forcing compaction is not a generic repair
for missing migration progress. Verify actual version/table settings before
proposing maintenance.
