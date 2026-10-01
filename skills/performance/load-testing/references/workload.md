# Choose the workload and failure phases

Independent client arrivals continue when the server slows; an open model can
represent that demand. A closed population starts its next action after the
previous action completes and is appropriate when that dependency is real. Under
externally imposed demand, a closed test can reduce offered traffic precisely
when queueing should increase. State which behavior the experiment needs.

Define operation mix, payload/data sizes, working set, read/write ratio and
tenant/key skew. Establish required identities, versions and stateful results.
Account for retries and fan-out separately from logical operations. A shared
cached key and tiny table support a narrow cache-path claim. Warm/cold caches,
connection reuse, TLS and client think time belong to explicit conditions.

Choose phases by the claim: warmup and stable baseline; demand ramp through the
latency objective; burst; sustained overload; dependency slowdown or ready
capacity loss; recovery after demand falls. Include a soak when memory growth,
maintenance, retention or resource leakage could invalidate a short result.
State the maximum target and generator resource budget and the stop signal.

Seed data without mixing setup throughput into the measured window. Use a
correctness oracle for mutations and asynchronous work: HTTP acceptance and
eventual business completion are separate observations. Preserve deadlines and
unfinished operations through final accounting. Rejection may be intended in an
overload phase while a correct on-time completion target still applies to the
protected class.

**Verify:** explain which production property each phase represents and which
question its counters can answer. Confirm the generator's actual behavior as the
target slows; screenshots of configured users/rates cannot establish arrivals.
