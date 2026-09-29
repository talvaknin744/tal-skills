# Durable handoff feasibility with PostgreSQL and worker processes

Executed 2026-09-29 at 08:24 UTC. This research experiment tests the failure
mechanisms behind repeated deployment interruptions. It uses a real PostgreSQL
18.6 server and 15 spawned Python processes, with short steps standing in for a
long job. It is not a Kubernetes deployment or a 24-hour endurance test.
[Machine-readable evidence](draining-feasibility.json)

## Result and scope

A job completed after A, B, and C each checkpointed and handed off, followed by a
successor completing the remaining work. It retained its logical identity, used
four ownership epochs, produced six distinct effects totaling 21, and spent zero
of its three permitted business failures. A separate actual process kill after
an effect committed but before its checkpoint also recovered without another
application of that effect.

| Tested history | Observed acceptance evidence |
| --- | --- |
| A completes step 1 and retires; B completes step 2 and retires; C completes step 3 and retires; A-new resumes | Checkpoints 1 → 2 → 3 → 6; epochs 1 → 2 → 3 → 4; final status `completed`; three maintenance handoffs; zero business failures |
| Old A remains alive while its lease expires and B claims a new epoch | Old A's effect, checkpoint, and release operations are all rejected; B remains owner and successfully advances the job |
| C commits step 1's effect; coordinator observes that checkpoint is still zero; coordinator sends SIGKILL | Exit code -9; successor resumes at checkpoint zero, recognizes the saved step receipt, checkpoints it, and finishes with six effects rather than seven |
| A retiring generation tries to claim after its admission gate closes | Claim rejected with no ownership allocation |
| A worker with a mismatched checkpoint schema version tries to claim | Claim rejected with no ownership allocation |
| Three separately injected confirmed business failures | Counter reaches three; terminal `business-failed` state prevents another claim |
| A job's durable deadline has passed | Claim rejected; terminal `deadline-exceeded` state recorded; no effect |
| All test cases end | All 15 worker processes joined; zero remaining probe database sessions; owned container stopped and removed |

The fencing and admission cases intentionally stop after proving their boundary;
their jobs remain durably pending. They are not mislabeled as completed jobs.
Business failures were explicitly injected classified outcomes, not inferred from
process exit codes. The killed process was recorded separately as infrastructure
interruption; its saved effect was reconciled when the successor resumed.

## Mechanism actually executed

The fixture stores a job manifest, input hash, checkpoint schema version,
checkpoint index, owner, monotonically increasing epoch, lease expiration,
deadline, separate counters, and terminal status. A generation row supplies the
authoritative admission gate. Claims lock that row for shared reading, lock the
job for update, verify eligibility, and allocate the next epoch. This lock order
also defines how a retirement update and an already-started claim serialize.
The executed admission case covered the already-closed gate; concurrent gate
transition stress was not run.

Every effect, checkpoint, completion, and release transaction locks the job row
and verifies the owner, epoch, lease, input identity, and deadline before writing.
The lock remains held while the protected local effect is committed. This avoids
a time-of-check/time-of-use gap between checking ownership and changing that
resource. A client merely reading an epoch and later sending an unchecked write
would not have the same guarantee. PostgreSQL documents both the conflicting
row-lock behavior and the release of these locks at transaction end.
[PostgreSQL row locking](https://www.postgresql.org/docs/18/explicit-locking.html)

Steps have durable operation identity `(job ID, step index)`. The effect receipt
and its business total update commit together. A duplicate verifies the retained
amount and input hash and returns the existing result. The checkpoint then
advances in a separate transaction only after verifying that receipt. Separating
those transactions deliberately creates the crash gap being studied. In a real
service where the same database owns both states, committing effect and progress
together is the simpler default. This experiment demonstrates recovery when such
a gap exists; it does not recommend introducing one.

Maintenance release changes the owner and maintenance counter without changing
business failures. That policy is safe here because durable progress and effect
evidence remain available. A business failure changes its own finite counter.
Neither policy controls an external broker's receive count or a Kubernetes
controller's retry accounting.

Leases use the database clock. For deterministic expiry tests, the fixture moved
the selected lease expiration into the past; it did not change the host clock or
wait five minutes. `clock_timestamp()` supplies the actual database time, whereas
transaction timestamps are fixed at transaction start. No wall-clock-jump or
lease-renewal test was performed.
[PostgreSQL time semantics](https://www.postgresql.org/docs/18/functions-datetime.html)

## Reproduction record

The original scratch script and raw results remain outside the repository.
The JSON records the script SHA-256, PostgreSQL image digest, runtime versions,
observed states, and cleanup. The Python interpreter was the existing research
virtual environment with Psycopg 3.3.3; no final example or skill was changed.
With the interpreter and scratch working directory normalized, the executed
commands were:

```sh
"$PYTHON" probe.py > results.json
docker stop tal-draining-probe-20260929
docker ps -a --filter label=tal-skills.research=draining-20260929 --format '{{.Names}}'
```

The probe exited successfully in approximately four seconds. IPC commands and
acknowledgements controlled each boundary; no guessed delay decided when to
kill a worker or transfer ownership. The final container query returned no
names. Synthetic data and disposable credentials stayed local, and the database
port bound only to loopback. This record is not a public installer: rerunning the
scratch program requires fresh tables and new disposable connection settings.

## Limits and implementation acceptance

- All worker processes run the same Python program. Their names represent
  successive compatible executors; mixed old/new binaries, schema migration, and
  deployment configuration compatibility were not exercised. The schema test
  rejects a version mismatch only; matching version numbers cannot establish
  semantic compatibility.
- The input manifest and its digest are assumed immutable for the job lifetime.
  The fixture does not enforce that policy through restricted database roles or
  migration guards. Real recovery must also pin mutable lookup data, configuration,
  and interpretation when those affect a step's result.
- Effects are local PostgreSQL mutations, not an external payment/email API or
  a simulated provider promising production semantics. External resources must
  enforce fencing themselves or provide an independently verified identity and
  reconciliation contract. A database fence cannot stop an unchecked external
  call from an old process.
- The test does not cover SIGTERM handling, prefetch/reservations, lease renewal,
  broker redelivery limits, network partitions, database crashes, replication,
  failover, power loss, long-duration resource use, or cluster rollout behavior.
  No claim is made about these capabilities.
- A fixed manifest, retained receipts, and an available authoritative database
  make recovery possible here. Receipt expiry, missing inputs, incompatible
  checkpoints, or unavailable ownership storage require explicit escalation;
  they must not silently become success or an unlimited fresh retry.

Use this evidence to strengthen the existing `graceful-draining` evaluation,
without creating another overlapping draining skill. The final workflow should
show the same handoff and stale-owner histories with its actual runtime, preserve
operation identities through the crash gap, keep independently enforced budgets
visible, and report durable completion separately from a safe pending handoff.
