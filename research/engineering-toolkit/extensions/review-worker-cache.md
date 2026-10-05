# Independent review: worker rollouts and cache consistency

Reviewed 2026-09-29 against the four extension records listed below and the
existing platform-shutdown, cache-coherence, replica-reads, and ordering-and-replay
references. **No material unsupported claim or contradiction found in the
reviewed research.** The proposed changes are appropriately conditional additions
to existing skills. They do not justify new general skills or expanded runtime
validation claims.

## Source checks

| Claim checked | Independent result and boundary |
| --- | --- |
| ECS protection acquisition, renewal, and expiry | Supported. The historical queue sample acquires protection before receiving work. Current protection lasts 1–2,880 minutes, defaults to 120, and covers service/deployment scale-in. Inspect actual per-task state and failure bodies. It is neither atomic with queue receipt nor protection against every termination cause. [AWS sample](https://aws.amazon.com/blogs/containers/announcing-amazon-ecs-task-scale-in-protection/), [current endpoint contract](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-scale-in-protection-endpoint.html) |
| Protected workers can block rollout | Supported. Replacement capacity, maximum percentage, tooling deadlines, and the protected population matter. Removing protection requires an accepted-work disposition; it is not merely a deployment-status repair. [Current ECS guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-scale-in-protection.html) |
| ECS success can precede source retirement | Supported for the documented rolling strategy with deferred source cleanup. Cleanup attempts continue for up to two weeks; deployment rollback mechanisms stop at completion. Completed deployment counts are historical, whereas service counts are live. The research correctly requires separate logical-work evidence and a recovery owner. This is not a two-week task-survival guarantee. [Early success criteria](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/early-success-criteria.html) |
| Blu Insights and deregistration | The extension correctly rejects a universal full-delay wait and does not present the custom scaler as an atomic retirement protocol. Current ALB documentation permits immediate completed deregistration when neither connections nor requests remain, even while the displayed state remains draining. The delayed-unprotect test is explicitly an engineering inference. [Historical account](https://m2-beta.bluinsights.aws/blog/scaling-out-in-policies-and-task-protection-in-practice/), [current ALB contract](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-target-group-attributes.html#deregistration-delay) |
| Shopify continuation and Sidekiq retry behavior | Supported at the pinned job-iteration revision: Active Job retries preserve the successful cursor; backend retries are unsupported for this continuation and restart from the beginning. This is not a claim that every Sidekiq job or its separate iteration APIs lose progress. Current Sidekiq guidance uses early TSTP, later TERM, a configurable 25-second default, and additional shutdown allowance. [Pinned iteration guide](https://github.com/Shopify/job-iteration/blob/c3b0eb1db5bd6681664913d57dfe5b5b28ab2ad8/guides/iteration-how-it-works.md), [Sidekiq deployment](https://github.com/sidekiq/sidekiq/wiki/Deployment) |
| Cache acknowledgment and failed invalidation | Supported: CacheFront explicitly returns success for a successful database write even if invalidation fails. The research correctly separates that outcome from read freshness and avoids prescribing its TTL or availability tradeoff universally. [Uber account](https://www.uber.com/us/en/blog/how-uber-serves-over-150-million-reads/) |
| Freshness authority bootstrap | Supported: Chrono depends on Panda-enforced commit bounds, prior write-attempt registration, and restoring a persisted bound before serving. Its authors report an earlier startup bug omitted from their steady-state model. The extension correctly refuses to transfer these guarantees to ordinary cache metadata or application-clock timestamps. [Dropbox account](https://dropbox.tech/infrastructure/meet-chrono-our-scalable-consistent-metadata-caching-solution) |
| Historical cuts, deletion, and retained history | Supported: Quicksilver distinguishes ahead/behind replicas, retains historical versions and deletion intervals, and protects recent updates locally. Its workload-specific history window is not a portable default. etcd separately documents exact range revisions, compaction errors, and per-key version reset on deletion. [Cloudflare account](https://blog.cloudflare.com/quicksilver-v2-evolution-of-a-globally-distributed-key-value-store-part-1/), [etcd 3.6 API](https://etcd.io/docs/v3.6/learning/api/) |
| Snapshot/stream handoff and restart | Supported within the named protocols: Debezium resolves buffered snapshot/live-event collisions before emission, while restarts can redeliver events. PostgreSQL exported snapshots supply a baseline boundary; slot recovery can resend changes, and failover continuity needs the documented synchronized state. Neither supplies arbitrary downstream transaction semantics. [Debezium 3.6](https://debezium.io/documentation/reference/3.6/connectors/postgresql.html), [PostgreSQL 18](https://www.postgresql.org/docs/18/logicaldecoding-explanation.html) |
| Redis acknowledgment limits | Supported: WAIT applies to preceding writes on the current connection, returns an acknowledgment count even on timeout, and cannot guarantee preservation through failover. The research does not substitute it for a durable freshness authority. [WAIT contract](https://redis.io/docs/latest/commands/wait/) |

## Implementation cautions

These are boundaries to preserve, not defects requiring research-ledger changes:

- Distinguish one exported snapshot cut from Debezium's per-chunk incremental
  snapshot windows. The latter supports a documented reconciliation protocol,
  not one global transactionally consistent historical view. Keep per-key
  collision handling, durable consumer progress, and final serving criteria
  explicit. Do not promote connector emission ordering into ordering of
  downstream parallel effects.
- Bootstrap admission concerns reads that depend on the missing freshness
  authority. Preserve an authoritative fallback when it satisfies the requested
  contract and capacity budget; do not require every permissive cache to implement
  Chrono or stop all service traffic.
- Keep ECS protection lifetime separate from broker visibility, receipt,
  retry, and job-identity contracts. A protected 24-hour ECS task does not extend
  the independent SQS visibility limit already documented in platform-shutdown.
  Preserve the difference between a retiring worker and a reusable idle worker
  when testing delayed protection transitions.

The new acceptance schedules are useful hypotheses, not executed evidence.
No cloud operation, model invocation, connector/failover experiment, runtime
test, or source-ledger/skill edit was performed during this review. Source text
and relevant documentation sections were independently checked; proprietary
implementations, article diagrams, throughput claims, exhaustive URL deduplication,
and 12–24-hour operation were not validated.

## Reviewed records

SHA-256 at review completion:

| Record | SHA-256 |
| --- | --- |
| `worker-rollouts.md` | `d3b22b1a2c02199d7b7bd7c18a5949b15dbe2efe5d7c7c7adbb522a733281450` |
| `worker-rollouts.json` | `05843041519a37d9ed35cae197b62b7858f8251883ac2651e71502b64ac9473e` |
| `cache-consistency.md` | `73a86f7586cffcfe832107fb5943eea50b1ffc54824ff361d71dd430e7215df2` |
| `cache-consistency.json` | `34ea6225d89255f86ca4b73042abc9428907c99acfd02993dbd4b8505761b337` |

## Implementation candidate crosscheck

The two implementation owners subsequently requested review of their reference
changes. Independently read the seven files below and their diffs. **No material
finding.** The projection reference explicitly distinguishes a global cut from
per-chunk windows; cache startup permits the contract's authoritative fallback.
The ECS/Rails material preserves the researched scope and separates retirement
from deployment success. Both skills keep their public entrypoints unchanged.
All package-local link targets and anchors checked in these files resolve;
the scoped `git diff --check` passed. This is source/structural review, not
execution of the proposed failure schedules.

Paths are relative to `skills/engineering/`; SHA-256 identifies the reviewed
candidate rather than subsequent edits:

| Reference | SHA-256 |
| --- | --- |
| `graceful-draining/references/platform-shutdown.md` | `1455fa5df92c9636bbacfe7032b93dda4d1fe22dfcb31499d7f49781605e341d` |
| `graceful-draining/references/durable-handoff.md` | `6551852265b5f7445b76ff64b61366294f32062059e09c8d18a42ece8f0841bc` |
| `graceful-draining/references/sources.md` | `d88caf22fbe5695a8c70a38c45c26ca70daa37b5d348c57d700769beedabce6f` |
| `concurrency-correctness/references/cache-coherence.md` | `d35560bc9e1e478f7d162b91effa1f33eda4fdb04efacc8bb6b743a855bc2ae7` |
| `concurrency-correctness/references/replica-reads.md` | `26d4eaa7c36cfaeb96fb6e6e07b341901ddcd4589b822eb82159e5d755a6f593` |
| `concurrency-correctness/references/projection-rebuild.md` | `9635ce4dc2682bd07922b271f62484052a7086b0cbf0af2f6cdd1a799fc0f998` |
| `concurrency-correctness/references/sources.md` | `59036630faa36d57a375bb7c363e1037f233f23e8cef73a8be59f8957e8e0a01` |
