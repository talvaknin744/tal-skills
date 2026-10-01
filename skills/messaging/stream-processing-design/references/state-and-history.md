# State lifetime and historical input

Account for visible output, pending future changes, join/index state, retained dimension versions, and identity/revision evidence separately. State bounds depend on rates, key cardinality, skew, lateness, correction/replay horizons, and outstanding progress. A small result set does not bound pending state.

State TTL is a semantic decision. Identify its clock, refresh rule, removed state, and downstream consequences. Check whether expiry emits a retraction, merely forgets old input, or causes a later arrival to be treated as new. Use a time predicate that defines result membership when records must disappear visibly; internal cleanup alone need not remove an already materialized result. Read the installed engine's actual behavior before equating retention with result expiry.

For bootstrap or backfill, define a consistent cut between snapshot/history and live changes, identities across that seam, dimension-history coverage, and the progress condition for catching up. Decide whether historical input rebuilds operator state, revises visible output, or replays external actions. Keep changed schemas and business meanings compatible with the supported history.

Size live and historical serving separately when replay competes with the latency-sensitive head. A separate historical storage/read path may reduce contention, but one journal or shard can still limit writes. Use measured capacity, not a vendor topology name, to justify partitioning.

Verify snapshot/live overlap without missing or doubled contributions; replay after identity expiry; a far-future row; dimension-history eviction; and progress stalled longer than TTL. Inspect result values, retained recovery evidence, and state growth. Record the tradeoff if a finite bound requires refusing older input or shortening correction history. Source distinctions are in [sources.md](sources.md).
