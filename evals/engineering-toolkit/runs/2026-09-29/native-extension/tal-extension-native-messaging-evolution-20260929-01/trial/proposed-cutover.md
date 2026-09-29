# Proposed regional failover

The replication dashboard is green and the source consumer committed next-offset 2.
Stop new source claims, copy that number to billing in the east aggregate, and
resume immediately. Turn on MirrorMaker group-offset sync while east-observer-1
stays connected so it can watch the transition. The new setting will overwrite
billing's start position before useful work begins. We can clean up the old owner
generation afterward because the offsets are already aligned.

The available aggregation-map-003 checkpoint can be kept as audit metadata; the
numeric committed offset should be enough to avoid duplicate billing. Source A1
and A2 already have receipts, so starting before target offset 2 looks wasteful.
Treat broker replication exactly-once as proof no downstream charge can repeat.
