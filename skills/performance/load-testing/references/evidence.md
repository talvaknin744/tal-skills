# Reconcile work and measurement

Record iterations, HTTP/RPC attempts and logical operations with their actual
mapping. Reconcile scheduled starts with started and generator-dropped starts;
reconcile started work with terminal and outstanding/interrupted work over the
chosen boundary. Classify server rejection separately from work never dispatched.
Include retries, setup work and asynchronous completion where they change the
denominator. Explain accounting residuals rather than forcing unlike counters to
agree.

Monitor generator CPU, memory, network, available execution slots and connection
limits alongside the target. An arrival-rate executor dropping starts may have
insufficient provisioned users, slower iterations or a client bottleneck; drops
alone do not locate the cause. Increasing generator capacity needs a new measured
run before the intended load becomes a supported claim.

Define each latency population and clock boundary. For example, k6 HTTP duration
omits initial connection establishment while other counters measure it. Keep
client elapsed time, pool wait and server execution distinct. Report failures,
rejections and unfinished work alongside success latency; quick failures can
improve an aggregate percentile while useful capacity falls.

Aggregate compatible histogram observations before computing a fleet quantile.
Averaging pod p99 values loses distribution information. Preserve sample count,
window, outcome/operation population, bucket resolution and censoring. Compare
threshold counts directly when they match the objective. Record run-to-run
variation and avoid treating instrumentation precision as experimental certainty.

**Result:** delivered load, correct on-time throughput, latency distributions,
failure/disposition counts, resource saturation, recovery and reproducibility
details support a specific claim. Generator-limited or incomplete accounting
results retain their narrower scope.
