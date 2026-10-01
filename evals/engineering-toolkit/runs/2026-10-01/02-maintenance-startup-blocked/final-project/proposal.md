# Proposed fix

The draft proposes 64 workers instead of 8 because CPU and disk utilization are
low. It will run an exact packing solver over the complete fleet for every new
plan, with no cap on candidate count, planning memory/time, pending plans, or
metadata updates. Each strategy would have its own worker limit; no shared budget
accounts for strategies, repairs, or foreground metadata traffic.

For eligibility it uses `live_fraction < threshold`, initially 0.95. Once per
minute, if observed storage debt rises it halves the threshold to "admit more
volumes"; otherwise it doubles the threshold. There are no actuator bounds,
deadband, stale-metric rule, or explicit pause/recovery policy. All deferred
plans would launch immediately when metadata utilization falls below its target.
No rule handles old debt that is repeatedly skipped by the ranking.

The team asks whether the approach is sufficient and what it should validate.
It has authorized a read-only review, not changes to the storage fleet.
