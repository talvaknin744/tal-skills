# Shared worker residency

This fictional pool has four interchangeable worker slots and enough CPU/memory
for four jobs. Receiving a job binds one slot until the job finishes or its local
state is explicitly released. A slot remains bound while prefetched, waiting for
dispatch, blocked on a dependency, retry-waiting, executing, or cleaning up. The
durable broker backlog before receipt owns no worker slot. No extra slots can be
created during this trace. Times are seconds; intervals are half-open.

The job payload and stable identity remain recoverable at the broker until the
worker's successful effect settlement and acknowledgement. A received job may be
returned before execution only after releasing its local state. An executing job
cannot be interrupted or checkpointed: a cancellation request returns immediately
but it keeps its slot until its specified finish time. No effects occur twice in
this trace. Repeated or interrupted work is not assumed to make useful progress.

| Job | Tenant | Arrival | Execution duration | Useful finish deadline |
| --- | --- | ---: | ---: | ---: |
| A1, A2, A3, A4 | A | 0 | 8 each | 20 each |
| B1 | B | 1 | 1 | 3 |
| C1 | C | 1 | 1 | 3 |

The current worker receives A1-A4 at time 0. It executes A1/A2 on [0,8) and
prefetches A3/A4 into the other two slots, waiting on A's execution limit of two.
When A1/A2 finish, it starts A3/A4 on [8,16). A1/A2's released slots can execute
B1/C1 on [8,9). The dashboard's `active_A` counts only executing handlers and
reports two throughout A's work. It reports idle CPU in the two prefetched slots.

Draft alternative:

```text
reserve two worker slots for B/C when they are waiting
if B/C queues are empty, lend both reserved slots to A
allow borrowed A3/A4 to execute on [0,8), outside active_A's regular limit
on B/C arrival, send cancellation to borrowed work and immediately count
those reserved slots as available for B/C
```

The draft claims that fair next-delivery order and `active_A <= 2` already protect
B/C. It promises B1/C1 finish by time 3 under either policy, while all A jobs
eventually finish usefully. Its separate FIFO comparison runs A1-A4 on [0,8)
and B1/C1 on [8,9). It compares FIFO's busy fraction at horizon 9 with a reserved
policy's busy fraction at horizon 16 to claim superior utilization.
No real broker, worker, or cancellation experiment has been run. The team asks
for a read-only design review and a minimal feasible allocation contract.
