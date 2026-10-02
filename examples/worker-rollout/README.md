# Finish a logical job across three worker retirements

This example replaces workers A, B, and C during one logical job. Its harmful
baseline treats each deployment retirement as a business failure: all three
workers exit cleanly, but the job exhausts its budget of three and cannot finish.
The protected path checkpoints each bounded slice, returns prefetched work,
and completes through a compatible successor with zero business failures.

The verifier uses real POSIX subprocesses, real SIGTERM/SIGKILL/SIGSTOP/SIGCONT,
loopback readiness listeners, and an owned disposable PostgreSQL container. Six
fast slices represent a 12/24-hour job; this is not an endurance demonstration.

| Worker | Useful durable progress before SIGTERM exit | Protected business failures |
| --- | --- | --- |
| A, v1 | Step 1; returns one genuinely leased prefetched job | 0 of 3 |
| B, v1 | Step 2; returns one genuinely leased prefetched job | 0 of 3 |
| C, v1 | Step 3; returns one genuinely leased prefetched job | 0 of 3 |
| A-new, v2 | Restores cursor 3, finishes steps 4–6 and the three returned jobs | 0 of 3 |

## Run

Requires a POSIX host, Python 3.11+, Docker Engine 28+ with a running daemon, and
the ability to fetch the pinned image and Python packages. From the repository:

```sh
python3 -m venv examples/worker-rollout/.venv
examples/worker-rollout/.venv/bin/python -m pip install -r examples/worker-rollout/requirements.txt
examples/worker-rollout/.venv/bin/python examples/worker-rollout/verify.py \
  --report /tmp/worker-rollout-report.json
```

The command exits nonzero if a required assertion or cleanup check fails. It does
not accept an existing database URL. Every run chooses disposable credentials, a
unique container name and ownership labels, a loopback-only database port, and
tmpfs storage. Cleanup refuses to remove a container without this run's labels.
No production resources or model settings are involved. The normal runtime
verification is separate from repository unit-test discovery.

The entire verification has a 300-second deadline (`--timeout`, maximum 600).
Docker calls, process/event waits, SQL calls and cleanup have separate finite
bounds. An owned worker that exceeds its join bound is killed and the check
fails. Shutdown is an acceptance condition; killing a worker does not establish
useful completion. The final report records both outcomes.

## Executed boundaries

- **Three retirements and their baseline:** each worker owns an active logical
  job and one unstarted prefetched job before SIGTERM. Readiness changes from
  HTTP 200 to 503 while work still exists. Local admission rejects more work,
  the worker closes its durable generation gate, inventories ownership from the
  database, finishes the current bounded slice and releases both reservations.
  The coordinator never performs those maintenance releases. Three harmful
  releases consume the business budget; three protected releases preserve it.
- **Admission at a bookkeeping seam:** an accepted claim commits before its
  local publication. SIGTERM then closes admission. Database inventory discovers
  that claim, releases it, and a successor completes it. A post-close claimant
  is rejected without changing ownership, epoch, progress, receipts or counters.
  Claims take a generation `FOR SHARE` lock; closure updates that same row before
  inventorying. Each permanently retired generation has a distinct identity.
- **Effect committed before checkpoint:** a v1 process is SIGKILLed at an
  acknowledged seam outside a transaction. The effect receipt and business
  total have committed; the cursor has not. A v2 successor finds the same
  receipt, advances the checkpoint, and finishes with the exact expected receipt
  set and total. This avoids a second business effect.
- **Final checkpoint before completion:** a separate SIGKILL leaves all effects
  checkpointed but the terminal completion transaction uncommitted. The successor
  finalizes that retained cursor without indexing past the input or adding effects.
- **Paused owner:** the verifier SIGSTOPs v1 before a protected mutation, advances
  its fixture lease into the past, and gives v2 a new ownership epoch. After
  SIGCONT, v1's effect, checkpoint and release are rejected. The entire successor
  state is compared before and after those attempts.
- **Compatible and incompatible successors:** separate v1/v2 entrypoints use
  different amount interpreters. v2 explicitly retains `(input 1, checkpoint 1,
  sum-v1)` support and also executes `(input 2, checkpoint 2, sum-v2)`. A candidate
  that only supports v2 is blocked from a retained v1 job before ownership changes.
  Input, input hash, schemas and interpretation are immutable. The unchanged
  receipt identity is `(job ID, step)` with matching amount and input hash.
- **Two deadlines:** the persisted business deadline uses PostgreSQL time and is
  retained across worker replacement. Expiry before a claim and during an active
  drain produce `deadline-exceeded`, never `completed` or a business retry. A
  separate first-SIGTERM monotonic budget stops an overlong slice. A second signal
  cannot extend that budget. The job remains pending; a successor waits for its
  natural two-second fixture lease to expire and then completes it.

`protocol.py` adapts the transaction/receipt rules in the historical
[draining example](../draining/README.md); that example and its evidence are
unchanged. The new `runtime.py` provides admission, readiness, prefetch accounting
and signal handling. `verify.py` selects boundaries by acknowledged events and
database observations rather than guessed sleeps. The short sleep in lease
recovery only paces bounded retries; the database decides when the lease expires.

## Evidence and limits

The author report is [verification.json](verification.json). Its `source_sha256`
map binds every code, schema, dependency and documentation file to the observed
run. Failed author attempts are retained under `evidence/` with the hashes of
their own source snapshots; a later modification does not rewrite their meaning.
Use a different report path for an independent run. Reports redact disposable
credentials and contain exact assertions, process outcomes, versions and cleanup.

Useful completion reconciles **every receipt's step, amount and input hash**, the
cursor, total, terminal status and persisted completion timestamp. Cleanup joins
all owned worker processes, closes their control streams, proves their readiness
listeners refuse connections, checks zero other example database sessions, closes
the observer, removes the owned container and proves its database port closed.

The example makes these limited claims:

- Effects, receipts, progress and fences share PostgreSQL. External providers
  need their own verified idempotency/fencing/reconciliation contract. Local
  prefetch reservations do not model a broker's independent redelivery budget.
- v1/v2 are distinct source entrypoints over a shared runtime and protocol. This
  proves the named interpretation matrix for these files, not arbitrary binary,
  configuration or release compatibility.
- The first-signal budget bounds cooperative waits and starting new work. Worker
  statements have a 100 ms default timeout and 50 ms lock timeout; new drain
  transactions reduce those bounds to the remaining monotonic budget. Those are
  **per-statement** bounds, not a strict cumulative transaction/commit deadline.
  Python signal delivery may wait for a C call. Parent escalation bounds a stuck
  owned process and records failure; it does not prove a graceful handoff.
- A business deadline is checked after obtaining the job lock. An effect admitted
  before expiry can commit afterward; no strict commit-before-deadline guarantee
  is claimed. Completion is a separate guarded transaction.
- The fixture lease is two seconds with no renewal. Receipt-gap and stale-owner
  tests deliberately advance the lease; business-expiry tests deliberately
  advance the deadline. Only the drain-budget recovery waits for natural expiry.
- The local schedules do not establish real 12/24-hour operation, Kubernetes
  rollout behavior, exhaustive concurrent gate races, distributed partitions,
  database failover, power-loss durability, restore or RPO. PostgreSQL runs on
  tmpfs even though `fsync` and `synchronous_commit` are enabled.

Primary contracts and the digest/dependency provenance are in [sources.md](sources.md).
