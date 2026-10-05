# Independent review of the retry coordination example

Reviewed 1 October 2026 by the source researcher, independently of the example
author. Scope: [probe.py](../../../examples/retry-coordination/probe.py),
[verify.py](../../../examples/retry-coordination/verify.py), the README, and the
author's recorded run. No example files were edited.

**Verdict:** no material defect found within the declared finite contract. An
independent rerun on Python 3.14.3 passed all eight cases:

```sh
python3 -B examples/retry-coordination/verify.py --report /tmp/tal-retry-independent.json
```

Manual oracle review confirmed the independent chain's `[1, 2, 4, 8]` calls and
coordinated `[1, 1, 1, 2]`; disabled closest retries preserve `[1, 1, 2, 2]` rather
than removing the ancestor's configured opportunity. Missing metadata and broken
internal context retain residual `[1, 1, 2, 4]` multiplication. Incoming client
claims are ignored. Ownership leaves duplicate effects possible: the unsafe
history commits twice, while the single-operation in-memory receipt commits
once. Optional-cause and admission expectations are fixed outside their helpers
and expressly modeled rather than presented as transport observations.

An additional instrumented rerun passed the same eight cases. It captured all
32 owned HTTP server instances, observed 32 closed socket descriptors, checked
that all 32 former listening ports refused connections, and found no additional
live threads after return. Cleanup therefore has observed evidence in these
histories, beyond the returned server count. Instrumentation was temporary and
did not alter repository sources.

The author report and both independent runs matched the following source hashes:

| File | SHA-256 |
| --- | --- |
| `probe.py` | `7a4864b6e42609461ba2e235e84016185855f2107e0c7a5beed9832642147796` |
| `verify.py` | `f207735b4b0dab7a82ccc671bc921971c3d601aa5868a2cf34fb5e23c4ae35f4` |
| `README.md` | `e37d5c3e9c86b362f7adce9c214a33f7dae8f8877769b3de69f8c40524047f4d` |

These runs establish the finite custom HTTP histories and two small decision
models. They establish neither Uber middleware conformance nor SDK, Envoy or
gRPC behavior. Quota-denied ownership propagation, competing causal failures,
real deadline/cancellation cleanup, durable idempotency, overloaded recovery,
authentication and transparent retries remain outside the example's tested
boundary. The virtual admission case tests a total attempt budget independently;
it does not validate quota denial across retrying ancestors. The README and run
record disclose those boundaries, so no correction is required for the stated
claim. The source research's broader proposed scenarios remain specifications;
this example does not mark all of them executed.
