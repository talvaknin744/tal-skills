# Failure headroom and scaling control

Select the scenarios material to the task: representative peak and growth;
workload/key/tenant skew; rolling drain; replica or zone loss; cold replacement;
dependency cap or slowdown; retry surge; and accepted-backlog recovery. For each,
state ready/routable capacity, demand, constrained resources, usable throughput,
latency objective and recovery timeline. Match the promised failure domain.

A provisioned replica may be starting, warming, retiring or unroutable. Calculate
overlap explicitly. Capacity lost during rollout or failure changes load on the
survivors; cache misses and retries may also raise cost per operation. Verify
remaining-zone routing and shared dependencies before treating zone counts as
independent capacity.

For autoscaling, map the signal to pending demand or resource pressure. Inspect
sampling/aggregation, controller delay, missing/not-ready metrics, startup,
warmup, maximum quotas and scale-down stability in the actual platform/version.
Fast shedding responses can mask overloaded useful work. Queue depth needs age,
arrival rate and processing cost; frontend growth can exceed database capacity.
Include behavior while new capacity is unavailable and when the maximum is hit.

Separate sustained capacity changes from transient admission/queue controls.
Define the scaling trigger, target range, growth bounds and scale-in/drain
conditions against measured work. Use damping/stabilization where oscillation is
observed or predicted by the relevant delays; derive settings from that system.

**Verify:** rehearse the requested load and capacity transition in an authorized
environment or provide exact proposed observations. Record useful completions,
deadline misses, saturation, rejection, queue age, downstream load and restoration
of normal operation. State what remains a model when a failure scenario has not
run. Successful autoscaler actions alone cannot demonstrate the service objective.
