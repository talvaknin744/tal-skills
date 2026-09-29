# Rebuild while updates continue

Use when stale cache or projection state originates at a snapshot/live-stream
handoff. A verified quiescent rebuild needs no online collision protocol.

1. **Establish the handoff.** Identify the supported global snapshot cut or
   per-chunk window/watermark protocol, stream positions, and comparison domain.
   Record how source identity and
   position remain valid after restart or failover. Use the datastore or
   connector's bootstrap procedure; an unrelated export followed by “start from
   now” can omit intervening changes.
2. **Merge overlapping history.** Determine which component arbitrates a delayed
   baseline row against a live update or DELETE. Preserve deletion evidence
   through that handoff. Apply the source's documented collision rule before
   exposing rebuilt state; reuse the atomic effect/progress rules in
   [delayed-work.md](delayed-work.md) for downstream consumers.
3. **Admit a usable projection.** Establish baseline/window completion and the
   applied source positions required by its read contract. Retain recoverable progress
   and a supported rebuild/reconciliation path if the stream no longer covers
   the gap. A healthy connector alone does not prove consumer catch-up.

These are application review steps, not one universal algorithm. Debezium 3.6
resolves incremental-snapshot collisions per chunk using a window and keyed
buffer; it does not provide one global transactional snapshot. PostgreSQL 18
exported snapshots provide one baseline cut. Check the selected mode and
version. Neither mechanism orders
arbitrary parallel downstream mutations or makes external effects transactional.

**Verify:** pause a baseline row, apply its deletion through the live stream,
then release the old row and restart the consumer. The rebuilt result remains
deleted and resumes from valid progress. Repeat with an intervening update and
unavailable retained history. Report unexecuted schedules explicitly.

Sources: [Debezium 3.6 PostgreSQL connector, incremental snapshots and recovery](https://debezium.io/documentation/reference/3.6/connectors/postgresql.html),
[PostgreSQL 18 logical decoding, slots and exported snapshots](https://www.postgresql.org/docs/18/logicaldecoding-explanation.html).
