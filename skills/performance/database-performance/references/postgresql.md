# PostgreSQL workload diagnosis

Use deployed-version documentation and existing instrumentation first. Align
application observations with pg_stat_activity state/wait_event, observed
blockers, I/O and interval statistics. Active sessions may be waiting. Record
counter resets, collection settings and observation transactions; disabled timing
is unknown rather than a measured zero.

Use pg_stat_statements deltas to locate aggregate workload cost and connect
normalized statements to affected operation/parameter classes. Averages can hide
tenant skew and latency tails. Preserve the incident window and compare calls,
execution, rows, buffers, temporary work and WAL where collected. Installation or
collection changes may require environment mutations and overhead assessment.

For representative EXPLAIN evidence, inspect estimates versus actual rows,
loops, join/access paths, buffers and spills. Planner cost units differ from time.
Actual per-node time/rows are per-loop values; nested parent timings include
descendant work. Account for repeated work without summing inclusive durations.
Sequential scans can be appropriate. Check affected parameter classes and
statistics freshness before treating one plan as universal.

EXPLAIN ANALYZE executes the statement, adds measurement overhead and excludes
client result delivery. Preserve that boundary when comparing client latency;
the target and statement effects determine whether execution is appropriate.
Small data or a warm cache may produce another plan from the production workload.

For memory changes, budget concurrent operations, parallel workers, hash
multipliers and maintenance alongside sessions. work_mem is not a process or
cluster cap. For maintenance, inspect statistics freshness, long transactions,
dead tuples, growth and vacuum progress. Ordinary vacuum and VACUUM FULL have
different locking/space consequences. Include maintenance interference in the
foreground workload and recovery plan.

**Verify:** choose the observed branch: contention, parameter skew, pool ceiling,
spill or maintenance. Compare the candidate under representative concurrency
and writes. Query correctness, client outcomes and resource costs must move with
the claimed improvement; one faster isolated plan supplies only plan evidence.
