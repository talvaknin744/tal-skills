# Cache ordering across two services

Run from the repository root with Python 3.11+ and Docker running:

```sh
python3 examples/cache/verify.py --report /tmp/tal-cache-report.json
```

The standard-library-only verifier starts a disposable Redis **8.10.2** server,
two separate service processes, and a temporary SQLite database. Each process
opens its own Redis connection and SQLite connection. Only generated local data
is used. Redis is exposed on a random loopback port. The image is pinned to
`redis@sha256:3811787313eba226a2ef38658c6ccb91cd5e110edc89c37767de373120a0e5a0`;
Docker downloads it if absent. The run checks the reported server version.

The verifier removes its own labelled container, workers, and temporary database
after success or ordinary failure. It retains the downloaded image. It does not
connect to an existing Redis service or delete another invocation's resources.
Without `--report`, structured JSON goes to stdout. `TAL_EXAMPLE_REPORT` also
selects an output file. Missing Docker or a failed assertion produces a nonzero
exit and a failure report. Run without Python's `-O` option.

## Contract

A read invoked after a successful service write acknowledgement at revision R
must return R or newer. A read already in flight may return its older snapshot,
but publishing it must not make later reads regress. Every source record carries
its payload and monotonically increasing revision in the same SQLite row.

Redis stores the cached value and revision floor under **separate keys**. The
fixed Lua operations atomically check and publish a replacement snapshot, advance
the floor and invalidate an older value, or validate a cache read. A successful
write response follows both the database commit and floor advancement. Those
remain two separate operations.

## Nine observed scenarios

| Scenario | Expected observation |
| --- | --- |
| Naive cache-aside | A delayed revision 1 fill poisons a read after acknowledged revision 2. |
| Client check followed by write | A check passes at floor 1, then a competing write advances to 2 before the stale fill. |
| Atomic conditional fill | The stale fill is rejected; a later read returns revision 2. |
| Value removed, floor retained | Removing the value does not allow the delayed old fill. |
| Reordered write notification | Revision 2 cannot lower a floor already advanced to 3. |
| Expired floor treated as zero | Actual floor expiration permits stale resurrection in the unsafe variant. |
| Missing floor treated as unknown | Cache use and filling stop; an authoritative source read returns revision 2. |
| Database/cache acknowledgement gap | A committed source update can coexist with an old cache before floor advancement; service success is withheld. |
| Applying the snapshot rule to deltas | Discarding a late `+1` after a newer `+10` produces 10 instead of 11. |

Passing means the four unsafe controls reproduced their expected counterexamples,
four corrected cases met the contract, and the partial-write case exposed the
remaining gap. Process messages force the read/write schedules. A bounded poll
observes expiry; timing sleeps do not establish the races. Warm reads also verify
that a populated valid cache avoids extra source reads.

## Limits

This is integration evidence for the local fixture, not a production adapter.
Deleting a value models eviction; memory-pressure eviction was not tested.
The floor starts only during quiescent fixture setup. Missing metadata is never
silently rebuilt: reads bypass the cache until a recovery protocol exists.
A TTL does not preserve ordering history. The delta counterexample is deliberate:
increments need their own sequencing/gap-repair protocol or an authoritative
replacement snapshot.

SQLite and Redis do not share a transaction. The partial-write check pauses the
protocol; it does not kill a process or implement a durable outbox. Unknown
outcomes, lost acknowledgements, repair, and operation identity remain separate
design obligations. Persistence, restart, replication, failover, network faults,
script errors, memory exhaustion, deletion tombstones, and fallback capacity were
not validated. Lua revision comparison is exercised only for small exact
integers. These checks do not prove every interleaving or benchmark performance.

The [recorded report](report.json) binds the observations to the verifier's
SHA-256. Rerun after changing the candidate. Technical contracts come from the
[Redis scripting documentation](https://redis.io/docs/latest/develop/programmability/eval-intro/),
[expiration semantics](https://redis.io/docs/latest/commands/expire/),
[replication limits](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/),
and [SQLite isolation documentation](https://www.sqlite.org/isolation.html).
The [image manifest](https://github.com/docker-library/official-images/blob/master/library/redis)
identifies the upstream image. Related skills: `concurrency-correctness`,
`failure-oriented-testing`, and `recovery-validation`.
