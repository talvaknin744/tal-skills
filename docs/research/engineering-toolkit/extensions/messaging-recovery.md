# Messaging and recovery: additional primary evidence

Researched on 2026-09-29. Three new article bodies were read completely: two
engineering retrospectives and one incident report. Their titles/URLs were checked
against existing research before selection. The [structured record](messaging-recovery.json)
contains dates, reading scope, applicability, and proposed verification. No skill,
example, infrastructure, or model evaluation changed in this pass.

The most useful addition is a conditional **cross-cluster recovery** branch.
Other findings should extend existing references and acceptance fixtures, rather
than create another general messaging skill.

| Priority | Existing location | Already covered | Actionable addition |
|---|---|---|---|
| 1 | [Ordering and replay](../../../../skills/engineering/messaging-reliability/references/ordering-and-replay.md) | Completed consumer prefixes; reassignment; Kafka transaction scope | Identify the cluster/topic/partition behind each position; translate progress before switching independently replicated logs. |
| 1 | [Recovered history](../../../../skills/engineering/recovery-validation/references/recovered-history.md) | Reconcile progress and effects surviving a restore | Make failover acceptance compare logical event identities, replication coverage, translated checkpoints, and the effect ledger. |
| 2 | [Durable handoff](../../../../skills/engineering/graceful-draining/references/durable-handoff.md) | Admission closure, reserved work, ownership epochs, separate interruption accounting | Exercise a reservation stranded before execution, transfer racing with late pickup, and release of the wrong owner's reservation. |
| 2 | [Capacity](../../../../skills/engineering/microservice-operations/references/capacity.md) | Startup/warmup, downstream pressure, backlog age, cold caches | Rehearse admission and reservation recovery with a cold failover target and recovery automation enabled; observe useful completion before ramping. |
| 3 | [Delivery and recovery](../../../../skills/engineering/messaging-reliability/references/delivery-and-recovery.md) | Storage limits shortening deduplication retention; poison versus interruption | Retain the existing rule; add capacity-driven early eviction and paired publication/identity-snapshot recovery cases. |
| 3 | [Projections](../../../../skills/engineering/microservice-data/references/projections.md) | Rebuild without repeating business effects; authoritative reconciliation | Select historical replay versus current-state reconciliation explicitly, with a destination/effect policy checked on the replay path. |

## Evidence and present-day limits

**Uber — [Disaster Recovery for Multi-Region Kafka at Uber](https://www.uber.com/us/en/blog/kafka/),
2020-12-21.** Independently aggregated regional logs can contain identical events
in different orders. Uber records source/destination position mappings and chooses
a conservative restart point. This is an architecture account, not evidence that
its custom algorithm is implemented by every Kafka replication product.

[Kafka 4.3 MirrorMaker configuration](https://kafka.apache.org/43/configuration/mirrormaker-configs/)
confirms that automatic group-offset installation is disabled by default and
requires no active consumers in that target group. Offset-sync records are needed
for checkpoint translation. Verify topic/group filters, mapping availability,
target membership, and freshness before cutover. The
[geo-replication documentation](https://kafka.apache.org/43/operations/geo-replication-cross-cluster-data-mirroring/)
describes a separately configured exactly-once replication mode; that mode does
not make an application's external effects part of one transaction. These docs
were read for the relevant configuration, transaction, and monitoring sections,
not as an executed MirrorMaker deployment.

**Segment — [Delivering billions of messages exactly once](https://www.twilio.com/en-us/blog/insights/exactly-once-delivery),
2017-06-29.** The implementation replaced an expensive in-memory deduplication
design, bounded retained identities by capacity, and reconciled local identity
state against published output after failure. The historical four-week observation
is not a product guarantee or a proof of arbitrary external-effect atomicity.

Current [duplicate-data documentation](https://www.twilio.com/docs/segment/guides/duplicate-data)
describes approximately 24-hour, 99% ingress deduplication and distinct destination
behavior. Current [replay documentation](https://www.twilio.com/docs/segment/guides/what-is-replay)
also matters: disabled destinations can receive replay, current destination filters
apply, and replaying historical Engage state can overwrite newer state. Prefer a
current-state resync when that is the recovery objective. Treat these as
Segment-specific contracts; require equivalent evidence from other products.

**Trigger.dev — [Incident report on June 22, 2026](https://trigger.dev/blog/incident-report-jun-22-2026),
displayed 2026-06-22; incident continued into June 23.** Pre-execution reservations
in the failed region blocked shared concurrency after failover. Recovery automation
and cold starts also overloaded recovering capacity. The report distinguishes
completed mitigations from planned work; it does not prove those plans shipped.

The current [run-state documentation](https://trigger.dev/docs/runs) says
`DEQUEUED` and `EXECUTING` consume concurrency. The
[queue documentation](https://trigger.dev/docs/queue-concurrency) broadly describes
queued work as not consuming slots and explains that a checkpointed `WAITING`
run releases its slot and must reacquire it on resume. Distinguish these exact
states; neither document establishes that every historical regional reservation
bug is fixed. Pausing intake is also different from canceling existing work.

## Proposed verification, not executed

The following are bounded model designs. A passing model would establish its
state transitions only; actual broker, scheduler, retention, and load guarantees
still require the installed product and representative deployment.

1. **Different log orders.** Source log `A1,A2,B1,B2` has completed `A1,A2`;
   target log is `B1,B2,A1,A2`. Copying next-offset `2` skips both B events.
   A translated conservative restart plus durable effect identity must complete
   all four once. Remove the required mapping or an unreplicated event: fail
   acceptance or report the resulting loss boundary, rather than invent progress.
2. **Published output versus restored identity state.** Restore an identity
   snapshot behind a retained output record, then the inverse mismatch. Reconcile
   against the explicitly authoritative publication history before admitting new
   work. Include a late old publisher and unavailable history: without a supported
   transaction/fence or a conclusive outcome, keep the affected operation on hold.
3. **Retention shortened by capacity.** Evict identity evidence before the
   advertised retry horizon despite an unexpired TTL. An in-contract repeat must
   not silently become a fresh effect. This checks enforcement of an existing
   rule, not a newly discovered retention principle.
4. **Reservation failover.** With two global slots, reserve both in a region that
   cannot start work. Recover into a healthy region while one old pickup arrives
   late. Assert at most two accepted executions, eventual useful progress, and
   no stale release of a successor's reservation. A suspected-running task needs
   outcome/ownership reconciliation; a timeout alone is insufficient evidence.
5. **Replay intent and destination policy.** A historical event targets a
   destination holding newer state. Require either a version-aware replay or an
   explicit current-state reconciliation path. A disabled destination flag alone
   must not authorize or isolate side effects. Exercise representative historical
   payloads under the actual replay transformation/filter configuration.

General outbox atomicity, publication versus consumer acknowledgement, schema-era
fixtures, poison-input classification, and recovery beyond deduplication retention
are already present. This pass found corroboration for those topics, not grounds
for duplicate instructions. Native behavior and production capacity remain
unmeasured by this research.
