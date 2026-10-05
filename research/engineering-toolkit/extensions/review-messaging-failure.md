# Independent review: messaging and failure evidence

Reviewed 29 September 2026; file snapshot recorded at 12:15 UTC. **No material
factual error, unsupported universal rule, or activation overreach found in the
reviewed additions.** This is a source and instruction review, not runtime or
agent-behavior evidence.

## Scope

Read both extension reports and JSON records in full, then examined the added
messaging and failure-testing reference text and the recovery skill's new
conditional route, reference, and source card. Independently checked the six
articles against their primary publishers, relevant current documentation, etcd
maintainer discussion and changed code, and the pinned historical TigerBeetle
simulator. Both JSON records parse successfully.

Only this review was written. No skill, ledger, broker, Cloud resource, model
trial, fault schedule, restore, or dependency configuration was changed or run.
The existing repository as a whole was not re-audited.

## Checked claims and retained boundaries

1. **Kafka progress and ownership are distinct.** Uber's custom aggregation
   account supports different relative event order across cluster logs; it does
   not describe the default MirrorMaker topology. Kafka 4.3 documents offset-sync
   prerequisites, disabled-by-default automatic group-offset installation, and
   installation only when the target group has no active consumers. The reference
   explicitly separates that condition from fencing an old source consumer and
   limits its reordered-log example to a local aggregation model. Missing mapping
   evidence and acknowledged but unreplicated work remain visible recovery limits.
   [Uber](https://www.uber.com/us/en/blog/kafka/),
   [Kafka configuration](https://kafka.apache.org/43/configuration/mirrormaker-configs/),
   [mirroring scope](https://kafka.apache.org/43/operations/geo-replication-cross-cluster-data-mirroring/).

2. **Segment's historical implementation is not a present guarantee.** The
   2017 account discusses output-based recovery and capacity-related identity
   eviction, with an observed four-week window. The references retain the current
   approximately 24-hour/99% ingress description and distinguish downstream
   effects. The proposed reconciliation controls are application inferences;
   they do not claim that reading an output log alone prevents all late-publisher
   races. The replay documentation supports disabled-destination exceptions,
   destination filters, and the risk of older Engage data replacing newer state.
   [Implementation account](https://www.twilio.com/en-us/blog/insights/exactly-once-delivery),
   [current deduplication](https://www.twilio.com/docs/segment/guides/duplicate-data),
   [replay and resync](https://www.twilio.com/docs/segment/guides/what-is-replay).

3. **Reservations and cold recovery are conditional risks.** Trigger.dev's
   incident reports pre-execution regional reservations consuming concurrency and
   recovery activity overwhelming a recovering control plane. It labels the
   proposed reservation redesign as future work. Current run documentation counts
   `DEQUEUED` and `EXECUTING` toward concurrency; checkpointed `WAITING` can release
   it. The new text requires the actual scheduler's state contract and does not
   assume every queue wait releases a slot, every timeout proves death, or planned
   mitigations shipped. The cold-target rehearsal is an inferred verification
   technique, not a production capacity result.
   [Incident](https://trigger.dev/blog/incident-report-jun-22-2026),
   [run states](https://trigger.dev/docs/runs),
   [queue concurrency](https://trigger.dev/docs/queue-concurrency).

4. **Stable progress testing keeps its premises.** TigerBeetle's account shows
   random restarts masking a repair stall. The pinned simulator separately checks
   a bounded convergence phase and missing-primary, missing-quorum, or missing-log
   conditions. The added branch declares healthy participants, data, resources,
   residual faults, and completion bounds. It does not prescribe randomized repair
   as a general solution or promise progress under arbitrary continuous faults.
   [Article](https://tigerbeetle.com/blog/2023-07-06-simulation-testing-for-liveness/),
   [pinned simulator](https://github.com/tigerbeetle/tigerbeetle/blob/9ff5f4a470ed6d66b4be535e689c39eee9f24993/src/simulator.zig),
   [specific fix](https://github.com/tigerbeetle/tigerbeetle/pull/934).

5. **The etcd correction and valid late-response control are preserved.** The
   maintainer explicitly retracted the stale-read resolution claim for PR 21375.
   PR 21399 creates fresh retry IDs while retaining accepted IDs for the current
   read; its discussion identifies a regression from forgetting previous requests.
   The reference therefore tests both inappropriate old evidence and still-valid
   delayed evidence. It keeps business idempotency identity separate and labels
   the paired controls as a transfer, not an exact etcd reproduction. Antithesis's
   reported discovery rates remain vendor observations without a race-detector
   comparison.
   [Retraction](https://github.com/etcd-io/etcd/pull/21375#issuecomment-3997236858),
   [retry discussion](https://github.com/etcd-io/etcd/pull/21399),
   [changed code](https://github.com/etcd-io/etcd/pull/21399/files),
   [Antithesis account](https://antithesis.com/blog/2026/causality_analysis/).

6. **Recovery inputs are judged against their intended use.** GitLab's
   postmortem supports the distinction between configured failure mail and
   delivered notification, and between a valid staging transformation and a
   suitable production restore input. The added route is conditional; it does not
   require a monitoring redesign or a reservation protocol for every restore.
   Failure injection is scoped to an isolated test pipeline. The research also
   correctly rejects the postmortem's broad version-mismatch rule: PostgreSQL 18
   `pg_dump` supports selected older servers but refuses newer server major
   versions.
   [GitLab postmortem](https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/),
   [PostgreSQL 18 contract](https://www.postgresql.org/docs/18/app-pgdump.html).

## Review limits

Proposed cases remain unexecuted. Historical seeds, the etcd failure, and real
Kafka/Segment/Trigger behavior were not reproduced. This review did not inspect
private reports or linked talks, independently estimate discovery probabilities,
or certify production guarantees. The checked instructions preserve those limits
and add no passing model/evaluation totals. Later changes to the files below need
a corresponding review update.

## Reviewed file hashes

SHA-256; paths are repository-relative.

| Path | SHA-256 |
| --- | --- |
| `docs/research/engineering-toolkit/extensions/messaging-recovery.md` | `ba88de84e0568edf3ef0eafefb73d657ceaedc0723d2c5f44f793565e25020d2` |
| `docs/research/engineering-toolkit/extensions/messaging-recovery.json` | `4b316a6f267c36741fa56af210768b833c57de21fa48648ed1260483050ab33b` |
| `docs/research/engineering-toolkit/extensions/failure-evidence.md` | `238261d423b2db3e71d00344e4cd6041d7418ec739727db795aba83167ff199b` |
| `docs/research/engineering-toolkit/extensions/failure-evidence.json` | `90fc7c9c4a03b7a78fa9e17d70ecbad64f66ad6edf7f750d71c34201592fa8ee` |
| `skills/messaging/messaging-reliability/references/ordering-and-replay.md` | `0c298ebc53279fe31757f580941f46bc740242afe76dfd5bafa2314126209270` |
| `skills/messaging/messaging-reliability/references/delivery-and-recovery.md` | `acb3a837bb3881d394ae56283a63ff1f42954c98d9713b8051673133916865f5` |
| `skills/messaging/messaging-reliability/references/sources.md` | `6c1ef96cccc384edea3588f2c089816c2e2adab304e4fd8f16104bc2b9ce2452` |
| `skills/testing/failure-oriented-testing/references/fault-histories.md` | `2acd49e69bca0dc3426ad805794d2cdf0c5770bdc1e974e444f0b2475bce0a4c` |
| `skills/testing/failure-oriented-testing/references/sources.md` | `b8b6fc6c58cb6d48038ce9f325fd86e54b86ce60a708f3cf7b380ab2b70d0bcd` |
| `skills/reliability/recovery-validation/SKILL.md` | `9240367c490ab5e34080a1016de8b92ff5b750c4776ce0675ee35d34d45100a7` |
| `skills/reliability/recovery-validation/references/recovery-inputs.md` | `fa02610ee95edcfc4f93cbb59fc6224dea93d2b2a37ead134a4e2d0d485f8496` |
| `skills/reliability/recovery-validation/references/sources.md` | `b74b33426eccc3072f1818462278b598c066d1e8f38671831b8bc14a4b1d3f1c` |
