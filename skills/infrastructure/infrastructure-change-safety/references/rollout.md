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
