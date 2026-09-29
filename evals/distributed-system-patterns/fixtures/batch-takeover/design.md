# Dataset processing design

A submitted dataset has an immutable manifest containing exactly 120 object IDs.
Each object must produce a compact representation and a statistics record.
Objects are independent; both transformations must finish for every object
before the dataset's source objects can be deleted. The statistics stage reports
an object-level sum and count. The final dataset report must contain the total
sum and total count across every manifest member.

The coordinator copies each input to separate compact and statistics queues.
Workers publish result references to corresponding output queues. A merger
forwards whichever output arrives next into one combined queue. Workers can
still be running while any of these queues is empty. The proposed coordinator
deletes all sources when the combined queue has been empty for 30 seconds.
It emits the final report from the sums and counts seen so far. The author says
merging guarantees that both branches have completed, and reduction requires
waiting until every partial result is present before doing any arithmetic.

Two coordinator replicas provide failover. They use a consensus-backed store
with a 20-second renewable lease and atomic conditional updates. A lease record
contains owner_name and generation. Renewals compare both fields; release
compares only owner_name. The owning process maintains a local owns_lease flag,
refreshed by a renewal thread every 5 seconds. Every destructive request sent
to the object service carries owner_name only. That service reads the current
owner name, then performs deletion in a separate unguarded operation.

We observed coordinator A pausing for 25 seconds. B acquired the expired lease,
then A resumed and sent its queued deletion request before its renewal thread
ran. A can later acquire a new lease under the same owner_name. The object
service can be modified to store and atomically check a per-dataset generation
alongside the protected state change. No such check exists today.

Workers may be retried, and immutable outputs are addressed by dataset, object,
and transformation. The requested review is about topology, ownership, and
completion rules; a separate change will implement repeated-delivery handling.
There is no authorization to run this pipeline or delete any objects.
