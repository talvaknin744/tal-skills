# Policy and control

Use when choosing eligible work, bounding planning and execution, or adapting
maintenance to changing demand.

## Distribution and yield

Describe where debt lives and how it is created. Inspect tails and per-domain
histograms as well as totals: occupancy for blob consolidation, overlap and
read/write amplification for engine compaction, skew for rebalancing, or index
age and update volume for rebuilds. These measures are examples to select from,
not interchangeable policy inputs.

Compare candidate policies on the same representative inputs. Include an input
shape where the current policy succeeds and one where its assumption fails.
Separate gross source space retired from net reusable capacity after allocating
destinations. Account for object count, metadata rewrites, temporary disk use,
repair or replication work, and interrupted work that must repeat. A byte-efficient
move of many small objects can be expensive for metadata.

Prefer a justified policy over a fixed strategy count. Complementary policies
may cover dense, moderately sparse, and extreme-tail work, but the workload and
engine decide the split. Specify gaps, overlap, authority at job claim, and
how old or expensive work eventually progresses. A ranking that always selects
cheap recent work needs an explicit treatment of old debt.

Bound candidate enumeration, planner time/memory, source count, output size,
batch duration, queued plans, and downstream work independently. Approximate
planning is acceptable when its feasibility and resource bounds are checked;
packing quality alone cannot justify an unbounded search. Keep rate and
concurrency limits at the resources they protect, with shared accounting for
overlapping strategies and other maintenance. Evaluate locality against the
actual placement and failure-domain requirements.

## Feedback contract

Write the eligibility predicate mathematically or with a concrete example.
Increasing a threshold can admit more work or less work depending on its
definition. Verify both feedback directions against the actual signal and
actuator; an article's threshold wording is not a portable controller.

Choose an observation interval that accounts for metric delay and job duration.
Use bounded adjustment steps, actuator limits, and a deadband, hysteresis, or
equivalent mechanism where noisy measurements would cause oscillation. Define
behavior during missing or stale observations and prevent accumulated error
from causing a surge after a long pause. Coordinate controllers spending the
same resource; independent per-policy limits can exceed a shared budget.

State the response when foreground objectives deteriorate, when debt approaches
its horizon, and when both cannot be met with available capacity. Throttle or
pause according to measured contention, retain durable progress, and expose
age, last progress, and the blocked resource. Verify controlled recovery after
serving headroom returns rather than releasing every queued plan at once.

These stability and starvation requirements are original design checks. They
are not guarantees supplied by either source in [the ledger](sources.md).

## Apache Cassandra branch

When UCS is actually deployed, consult documentation for its installed version
and effective settings. Its read/write amplification tradeoff differs from
blob-volume packing; tune against the table's read/write mix and observed
resource constraints. Smaller operations can improve scheduling while more
SSTables add per-file memory and management costs.

Check the effective limits: the reviewed 5.0 documentation says
`max_sstables_to_compact` is ignored when fanout exceeds it, and
`concurrent_compactors` excludes repair validation compactions. Higher compactor
concurrency may increase read and write latency. Measure total competing work
before treating either knob as a hard budget. Source example configurations and
Dropbox strategy names do not establish settings for the adopted workload.
