# Finish a long job across worker replacements

A 12- or 24-hour job should not fail just because a deployment retires three
workers. This example keeps the logical job, its progress, and its business
failure budget separate from the process executing it.

The verifier starts real worker processes and a disposable PostgreSQL 18.6
container. Six short steps represent a long job:

| Executor | Durable progress before stopping | Business failures |
| --- | --- | --- |
| A | Step 1 | 0 of 3 |
| B | Step 2 | 0 of 3 |
| C | Step 3 | 0 of 3 |
| A-new | Steps 4–6, then durable completion | 0 of 3 |

Three planned handoffs do not exhaust the business budget. A separate test kills
a process after its effect commits and before its checkpoint advances; the
successor finds the retained operation receipt and finishes without duplicating
that effect.

## Run

Requires a POSIX host, Python 3.11 or newer, and a running Docker daemon. Run from
the repository root:

```sh
python3 -m venv examples/draining/.venv
examples/draining/.venv/bin/python -m pip install -r examples/draining/requirements.txt
examples/draining/.venv/bin/python examples/draining/verify.py \
  --report examples/draining/verification.json
```

The PostgreSQL image is pinned by digest in `verify.py`. Each run creates a unique
container with ownership labels, a loopback-only port, random disposable
credentials, and temporary database storage. The verifier removes only its own
container and joins its worker processes on success or failure. It never accepts
an existing database URL. The whole run has a five-minute deadline, configurable
with `--timeout`; queries and IPC waits also have bounds.

The command exits nonzero on failure. Its JSON output records each scenario,
database and runtime versions, resource cleanup, limitations, and hashes of the
files actually checked. `verification.json` is an observed run, not a promise
that a later modified copy passes. This runtime verifier is intentionally
separate from automatic repository unit-test discovery.

## What to read

- `worker.py`: claim, effect, checkpoint, release, and completion transactions.
- `schema.sql`: durable job/receipt state, counters, and immutable input guard.
- `verify.py`: Docker ownership and the controlled process schedules.

Claims consult an authoritative generation gate and allocate a new ownership
epoch. Every protected write locks the job row, checks the current owner/epoch,
and keeps that lock until its transaction ends. A resumed stale executor cannot
change the effect, checkpoint, or successor's ownership. Lease expiry by itself
does not provide that protection.

An effect has identity `(job ID, step index)`. Its receipt and business-total
change commit together. Checkpoint publication is deliberately separate so the
verifier can expose the crash gap. Where one datastore owns both effect and
progress, committing them together is the simpler default. An external provider
needs its own verified identity, fencing, or reconciliation mechanism.

The manifest, input hash, and checkpoint schema cannot change after insertion.
Claims reject incompatible schemas and quarantine malformed retained input.
Confirmed business failures stop at their configured limit. The next claim or
current-owner operation records an expired job as `deadline-exceeded` and clears
its owner; there is no background deadline scanner. A planned handoff remains
visibly pending until a successor completes it. The verifier checks expiry both
before a claim and during ownership, as well as the other rejection paths.

## What this establishes

The executed cases cover three maintenance handoffs, a live stale owner after
takeover, SIGKILL between effect and checkpoint, closed-generation rejection,
schema mismatch, poison input, finite business failures, deadline rejection, and
input immutability. IPC acknowledgements and database observations select the
failure boundary; guessed sleeps do not decide when a worker is killed.

These are short local process/database tests. They do not establish 24-hour
operation, Kubernetes rollout behavior, SIGTERM handling, lease renewal, broker
delivery counters, prefetch behavior, or distributed failover. The fixture moves
lease/deadline timestamps into the past instead of waiting for real expiry.
Database storage uses tmpfs; this is not power-loss or restore evidence.

All workers run the same code. A matching schema version does not prove old/new
binary compatibility. Real work also needs retained input/configuration versions,
available successor capacity, retirement inventory, and tests of admission racing
with rollout. Close admission for the entire retiring generation before
transferring work; this example exercises rejection after that gate is closed.
It does not alter a broker's independently enforced redelivery budget.

Use the existing `graceful-draining` skill and the long-running-worker deployment
workflow to apply these checks to a real service. The corresponding
[research report](../../docs/research/engineering-toolkit/draining-feasibility.md)
separates the earlier feasibility run from this runnable example.
