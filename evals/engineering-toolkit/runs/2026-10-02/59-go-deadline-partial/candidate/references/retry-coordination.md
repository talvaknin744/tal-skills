# Coordinate retries across a call path

Use when several layers can retry one logical operation, or ownership metadata
changes which caller may retry. Keep ordinary single-layer policy in
[failure-handling.md](failure-handling.md).

## Establish the amplification bound

Map retries in application code, SDKs, RPC libraries, proxies, and upstream
callers. Record each layer's total attempts, quota scope, backoff, and elapsed
budget. A local quota limits its own scope; independently limited layers can
still multiply work. In a derived 1:1 chain where every failed attempt invokes
the next layer, three layers allowing two total attempts can invoke the leaf
`2 × 2 × 2 = 8` times per root request. Count fan-out branches separately. A
10% allowance at each of three layers gives `1.1³ = 1.331` under an analogous
aggregate model; it is not a 10% end-to-end bound.

Measure dispatched attempts and logical operations separately. An SDK token
quota, a proxy's concurrent retry limit, and a request-ratio budget have different
denominators and recovery behavior. Check the deployed versions and effective
configuration: gRPC can perform transparent retries without a configured retry
policy; current AWS documentation describes an opt-in change; Envoy's mutable
documentation includes per-cluster/priority concurrency controls.

## Attribute the failure before suppressing ancestors

For the affected endpoint and request, identify a mandatory dependency whose
failure actually caused the caller's failure, an optional dependency whose
failure the caller tolerates, or an unknown relationship. Link inbound outcome
to final outbound outcome after local attempts finish. Validate the application
branch or controlled failure evidence; concurrent errors and historical
correlation alone do not establish causation. An optional enrichment failure
coinciding with a local database fault must preserve ownership of the local
fault. Reassess classifications after behavior changes; successful samples alone
say little about failure propagation.

Where shared infrastructure supports coordination, the closest caller with an
eligible configured retry policy may handle the causal failure. It then signals
that farther ancestors should suppress redundant retries. Record whether that
opportunity was attempted, denied by its retry quota, or already suppressed by
downstream ownership. Quota denial remains a stop, rather than moving exhausted
capacity upstream. If the closest caller has no eligible retry policy, preserve
an existing eligible ancestor opportunity; suppression must not erase every
configured retry. This coordinates existing policies and creates no new retry.

Define provenance, parsing, and propagation for the internal ownership signal.
Uber's header is an implementation example, not a standard HTTP contract or
built-in SDK feature. Accept metadata only from trusted participants; discard
foreign values at the trust boundary. For missing metadata or broken request
context, declare a finite fallback: allow the first participating caller's
existing eligible policy, then suppress farther-up repetition once its
opportunity ends. Broken context can move apparent ownership upstream and leave
multiple retrying layers; include that residual multiplication in the bound.

## Keep eligibility and resource controls separate

Ownership permission never overrides operation repeatability, retryable failure
classification, remaining deadline, admission limits, or server pushback. Use one
remaining time budget for queueing, connection, attempts, and backoff; distinguish
a per-attempt timeout from the logical-operation deadline. Cancellation stops
waiting and may request cleanup; it does not establish rollback or prove that a
remote write had no effect. Preserve logical effect identity and reconciliation
when the result is unknown. Correlated overload failures invalidate availability
estimates that square an independent per-attempt error probability.

## Verify the claimed boundary

Retain controls for a deep mandatory failure, optional failure plus local fault,
disabled closest retries, exhausted quota, missing metadata, context drop, and
deadline expiry. Assert dispatched counts, suppression reasons, preserved
eligible opportunities, completion time, duplicate-sensitive effects, and
resource release. During recovery, verify useful traffic resumes within the
declared bound without a retry surge. A local policy model verifies decisions;
wire propagation, middleware order, and SDK/proxy interaction need integration
evidence. Mark unexecuted checks explicitly. The
[source ledger](sources.md#retry-coordination-contracts) supplies primary reading
scope; vendor incident statistics are not application results.
