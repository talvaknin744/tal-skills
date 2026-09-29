# Worker rollout change request

The `index-workers` Deployment has three replicas. HTTP readiness controls
whether a Pod receives traffic through its Service. Jobs arrive through an
outbound queue poller with its own credentials, and changing readiness does
not stop that poller. Each Pod has two job slots; a job normally takes 14 hours
and can save progress between batches. Storing the last batch and relinquishing
a delivery took 38–50 seconds in the last ten shutdowns.

The platform team supplies this termination contract for this cluster: the
Pod termination grace countdown begins before the preStop hook executes;
SIGTERM reaches the main container after that hook returns. The remaining
time is available to the application. At expiry, the runtime forcefully stops
the container. Do not assume a second full grace period starts at SIGTERM.

A trial produced these observations:

```text
12:00:00 Pod deletion starts; preStop calls /drain
12:00:00 readiness becomes false; poll loop is still enabled
12:00:08 poller claims delivery q-919 in a newly free slot
12:00:25 /drain returns; main process receives SIGTERM
12:00:25 application starts checkpoint-and-release for both slots
12:01:00 container killed; second checkpoint request has no recorded result
```

The proposed manifest below doubles the old 30-second grace period and adds a
PodDisruptionBudget. The release note says: “The PDB prevents the Deployment
controller from taking down another worker while an import is active. The
25-second hook lets readiness propagate, then shutdown has 60 seconds to save
work.” `/drain` currently changes only readiness and waits 25 seconds. SIGTERM
closes the poller and waits up to 50 seconds for checkpoint-and-release.

The deployment operator uses ordinary Deployment rollouts. Its rollout changes
replicas through the Deployment controller; it does not request Pod evictions
through the Eviction API. There is no job-aware rollout controller.
