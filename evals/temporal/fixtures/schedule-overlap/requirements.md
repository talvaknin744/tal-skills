# Inventory snapshot Schedule

A Schedule launches a warehouse snapshot every five minutes. Each snapshot can
take twelve minutes during busy hours. Two concurrent snapshots for the same
warehouse can race on a replace-all destination table. The destination is not
transactionally isolated between snapshots.

The business needs the freshest completed snapshot and may skip intermediate
ticks. It requires at most one active snapshot per warehouse. The deployment
must also decide what happens to missed ticks after an outage; there is no
requirement to replay every missed tick.

Current configuration uses the Schedule's allow-all overlap behavior. The
proposal sets Workflow retry attempts to one and assumes that prevents overlap.
Nothing specifies a catch-up window or operator backfill behavior. The SDK and
server version must be checked before selecting concrete API enum names.
Do not edit or operate the Schedule; give a scoped configuration review.
