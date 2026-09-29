# Import workers during the September rollout

Our own queue service delivers immutable `job_id` values to three worker hosts.
This is a generic process supervisor deployment. An import takes 12–24 hours,
and its input manifest never changes. Workers persist a completed-page cursor
every five minutes. Reprocessing a page is supported. The queue retains the
job and cursor independently of any worker process.

Queue contract: `fail(delivery, reason)` increments `failure_count`; count 3
moves the job to the dead-letter list. A lost delivery lease also counts as a
failure. `defer(delivery)` makes the job eligible again without incrementing
that counter. `ack(delivery)` removes a completed job. Delivery is at least
once. The worker library turns an exception from `run` into `fail`, including
`TaskCancelled`. Lease renewal continues while a handler is running.

Rollout log for import `imp-884`, expected runtime 18 hours:

```text
09:00:00 host A starts job, failure_count=0, cursor=0
09:41:02 supervisor terminates A for version 42
09:41:03 TaskCancelled -> fail, failure_count=1, cursor=480
09:41:05 host B resumes from cursor=480
10:22:11 supervisor terminates B for version 42
10:22:12 TaskCancelled -> fail, failure_count=2, cursor=965
10:22:14 host C resumes from cursor=965
11:03:07 supervisor terminates C for version 42
11:03:08 TaskCancelled -> fail, failure_count=3, state=dead_letter
```

The supervisor replaces A, then B, then C, waiting for the replacement's health
check before moving on. It sends SIGTERM and allows 90 seconds before killing
the process. Deployments happen twice daily. Operations proposed calling
`shutdown()` from SIGTERM, setting the health endpoint to unavailable, and
raising the retry limit from 3 to 10. They call this a graceful drain. Import
owners want infrastructure maintenance to preserve resumable work; malformed
input must still exhaust the ordinary failure policy.
