# Retry ownership across a call chain

Run explicitly from the repository root with Python 3.11 or newer:

```sh
python3 -B examples/retry-coordination/verify.py --report /tmp/tal-retry-report.json
```

The verifier starts four owned loopback HTTP services per network history and
closes their servers, sockets, and threads before returning. It creates no external
connection and requires no installed package. Golden call counts are specified
separately from the middleware model. Run without `-O`; the verifier rejects
optimized execution.

Eight cases cover nested amplification, a nearest caller without retry policy,
lost context, missing metadata, an ignored incoming claim, effect-before-error
with and without a stable receipt, optional-versus-required causes, and admission
under a virtual deadline/budget. Delayed attempts can spread work while preserving
its total volume. Expected unsafe controls remain labeled inside their case.

The custom `X-Example-Retry-Claim` response header exists only between configured
local peers. Caller-supplied claims are ignored. It is neither a standard header
nor an implementation of Uber's service-dependency analysis. An enabled eligible
policy is modeled; SDK-transparent retries, status-specific classification,
concurrent retry budgets, and real RPC deadline semantics need their own adapter
checks. Retry ownership controls load; the receipt demonstrates a separate
in-memory duplicate-effect boundary, without crash durability.

The example is motivated by [Uber's retry ownership account](https://www.uber.com/us/en/blog/protecting-against-retry-storms/).
Production availability estimates and Uber's measured traffic reductions are not
results of this example. Reports bind observations to the three source hashes;
virtual-time and causal classification checks remain distinct from actual HTTP
histories. A green run establishes these finite histories, not general overload,
failover, cancellation, authentication, or production throughput guarantees.
