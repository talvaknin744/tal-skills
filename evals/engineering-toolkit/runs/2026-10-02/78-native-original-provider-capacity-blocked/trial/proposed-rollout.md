# Proposed rollout

Replace A, then B, then C. Readiness becomes false before SIGTERM, so the worker
is considered drained. The disruption budget will keep accepted jobs safe.

On SIGTERM, wait up to 85 seconds for all work to finish. If a job is still active,
call `fail(..., "deployment interrupted")` and exit. Do not change polling because
readiness is already false. Treat checkpoint timeouts as failed writes and start
that batch from the previous checkpoint on the successor.

Declare success when three new pods are Ready. Roll back the image if rollout
takes more than ten minutes. The checkpoint format is unchanged.
