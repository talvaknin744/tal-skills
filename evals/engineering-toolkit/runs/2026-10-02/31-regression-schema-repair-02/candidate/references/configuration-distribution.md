# Configuration distribution through a rollout

Read when an infrastructure or deployment transition changes how workers
acquire, retain or apply distributed configuration. Establish the authoritative
store, supported consumer generations and operation-specific freshness bound.
Security revocation, quota enforcement and ordinary parsing settings can need
different bounds even when they share a distribution service.

## Choose placement from measured data

For small, slowly changing configuration that fits on each worker, compare local
copies with repeated central reads. Count bytes, update rate, worker startup
concurrency and database connections. A publisher can distribute snapshots
through object storage and updates through a stream, leaving workers to serve
from local state. This can decouple startup from central database reads, but
requires a reachable bootstrap snapshot and sufficient distribution capacity.
Gate readiness on acquiring a coherent, supported configuration generation;
process health alone is insufficient.

[Datadog's design account](https://www.datadoghq.com/blog/engineering/scaling-config-delivery-containers/)
supports this placement for its measured data shape. Its ten-minute snapshot
interval and reported fleet results are not defaults for another workload.
When configuration is too large, changes too quickly or cannot be stale for the
operation, use a design that satisfies those constraints instead.

## Define the snapshot and update boundary

Name the snapshot's source position or version, where replay starts and how a
consumer prevents an older snapshot or delayed update from replacing newer
state. Include deletions and the maximum supported consumer interruption.
Retain a supported rebuild path when replay history expires. If application
state and a consumed offset must survive together, establish that contract in
the local store; Kafka transactions alone do not make external storage atomic.
Compacted streams also require deletion-retention and catch-up checks.
[Kafka's current delivery and compaction contracts](https://kafka.apache.org/43/design/design/)
define those boundaries; they do not supply the application's snapshot protocol.

Finish this design step when every supported consumer generation has a coherent
bootstrap/replay rule, an explicit stale-state outcome and a recoverable state
after interruption. Datadog's article omits watermark, deletion and offset/state
details; resolve them from the actual implementation.

## Stage and verify the transition

Keep old and new readers compatible with the published format through the last
supported replay or rollback window. Make a new snapshot generation available
before directing consumers to it, and retain the previous supported generation
until its consumers finish or can rebuild. Define what workers do when the
freshness bound expires; continuing with old security policy is not justified
by serving availability.

In an authorized disposable target, run concurrent worker startup while central
database reads are unavailable. Interrupt snapshot distribution and updates
separately, then recover each path. Include an update and deletion across a
snapshot replacement, a delayed older update and a consumer restart. Compare
applied versions and policy effects with the authority; measure readiness,
central read load and recovery lag against the declared bounds. An emergency
direct-database fallback must pass the same startup/load check before it can
count as a recovery path.

Finish when supported generations produce the intended configuration effects
through these transitions, or report the precise unresolved protocol boundary
and unexecuted check. These scenarios are verification proposals, not evidence
that a deployment has already passed them.
