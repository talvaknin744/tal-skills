# Verification

Use when evaluating a design, testing a scoped implementation, or preparing an
authorized tuning rehearsal. Select scenarios for the changed boundaries; keep
proposed checks distinct from executed observations.

## Policy and resource evidence

Replay or simulate representative steady-state, middle-distribution, and
extreme-tail inputs when those shapes exist. Include a distribution shift, many
small objects, a hot domain, and a costly or old unit that the preferred ranking
could starve. Vary the debt arrival rate as well as the existing backlog. Check
which work each policy admits, overlap or gaps, cost per useful result, and
eventual handling of deferred work.

Measure net reclaimed capacity, placement improvement, or index usefulness
alongside copied bytes, metadata operations, planner time/memory, temporary
space, worker I/O, network traffic, and queued/in-flight work. Account for failed
and repeated work. Run foreground traffic concurrently and observe its latency,
errors, throughput, and the constrained downstream resource. A faster maintenance
completion rate is unsuccessful if it violates the declared serving contract.

Test enforcement of bounds, including configuration interactions. Compare
single-policy and concurrent-policy operation to expose a shared budget exceeded
by individually valid limits. A model can validate selection and accounting;
an actual engine or platform rehearsal must validate enforcement and contention.

## Control evidence

Introduce delayed and missing telemetry, noisy measurements near a threshold,
a foreground surge, and recovery after throttling or pause. Observe actuator
changes, workload admission, overshoot, oscillation, debt age, and last progress.
Confirm the response sign using concrete eligible inputs. Require bounded change
and bounded outstanding work over the declared interval, followed by controlled
recovery. Check the declared fallback when debt and foreground goals cannot both
be met. Do not claim stability from one successful static load point.

## Semantic evidence

Schedule interruptions immediately before and after durability, publication,
retirement authorization, and cleanup. Include restart from a checkpoint, a lost
publication response, concurrent delete or update, a pinned reader, and an old
owner resuming after takeover. Check the protected operations directly; worker
exit status and a successful claim do not demonstrate safe retirement.

Use an oracle independent of job success: compare live object identities and
content or checksums, preserved deletions and versions, permitted reader results,
placement constraints, and retained recovery evidence. For an index, compare
queries with an authoritative result through the rebuild/switch. For a backfill,
change source membership and authoritative versions around the cursor and during
restart; observe complete bounded coverage, catch-up, and preservation of newer
values rather than only a completed scan status. For a rebalance,
check acknowledged reads/writes and required replica placement throughout the
move. After recovery, verify the semantic result again and account for orphaned
destinations or unreclaimed sources.

## Completion record

Report the baseline, workload shape, candidate settings or scoped change,
observed useful yield, foreground outcomes, resource peaks, and semantic oracle
results. Name the checks actually run and their environment. A local deterministic
schedule demonstrates the supplied model's behavior, not engine crash durability,
distributed fencing, production latency, or fleet-wide controller stability.
Record material gaps with the next specific validation step; the evaluation
cases are authored checks, not evidence that this skill has passed them.
