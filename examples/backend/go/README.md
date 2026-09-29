# Go reservation example

`Store.Reserve(ctx, trustedTenant, requestKey, rawJSON, hook)` reserves inventory
and retains an immutable receipt in one PostgreSQL transaction.
`Store.Lookup(ctx, trustedTenant, requestKey)` returns that receipt or `nil`
(`NotObserved`, which does not prove an earlier attempt aborted).

The caller supplies trusted tenant context. Tenant, key, and SKU use 1–128 visible
ASCII characters. The JSON command contains exactly `sku` and `quantity`; finite
integral numeric values from 1 through 1,000,000 are accepted. Numeric `1`, `1.0`,
and `1e0` normalize to the same intent. An operation retains its
`(tenant, reserve-v1, key)` identity for the lifetime of its database record.

The module pins pgx 5.11.0 and declares Go 1.25 as its minimum. The recorded run
used Go 1.27.1; it does not establish compatibility with every earlier toolchain.
The application owns the pool and closes it after its requests finish. Each
transaction holds one connection. A context without a deadline receives one
10-second request budget; a supplied deadline remains the end-to-end budget.

`Failure` preserves `errors.Is(err, context.Canceled)` and deadline identity,
transaction phase, operation identity, and any secondary cleanup error. COMMIT
transport failure is `ErrUnknownOutcome`; reconcile with the original identity
and intent. A fresh three-second rollback allowance starts during deferred
cleanup. A retired connection additionally has a bounded wait for pgx network
cleanup. Cleanup can therefore outlive the request deadline. If the driver cleanup join
expires, the error records incomplete cleanup and the pool still owns any
remaining driver work. That network failure is not exercised here. `Outcome()` refers
to the current attempt and cannot erase an earlier uncertain attempt.

The hook is an awaited verifier seam, not an external-effect callback. The code
performs no automatic retries, key expiry, or external effects.

## Run

From the repository root, with Go and Docker available:

```sh
(cd examples/backend/go && go test -race ./... && go vet ./...)
python3 examples/backend/run.py --report /tmp/go-backend-report.json -- sh -c 'cd examples/backend/go && go run -race ./cmd/verify'
```

The first command runs local boundary/error tests and static checks. The explicit
verifier runs all 14 common database scenarios with unique synthetic tenants and
size-one application pools. The launcher owns the disposable PostgreSQL 18.6
container and the TCP proxy that suppresses a real COMMIT acknowledgement.
Lock-contention schedules use explicit gates and a separate database observer.
Every application goroutine is joined, and fresh requests verify capacity after
cancellation. The acquisition scenario uses a native context deadline and checks
the pool's canceled-acquire count.

The launcher supplies `TAL_EXAMPLE_DATABASE_URL`, `TAL_EXAMPLE_FIXTURE`, and
`TAL_EXAMPLE_PROXY_URL`. `TAL_EXAMPLE_REPORT` optionally writes the JSON report.
Without the proxy, `unknown-commit` is reported as skipped. The verifier requires
the disposable-fixture marker and a loopback URL; never point it at a persistent
database. It deliberately creates synthetic data and relies on fixture disposal.

[Verification report](verification.json) contains the observed scenario results.
[Verification history](verification-history.json) records failed attempts,
corrections, source hashes, and commands. Local transaction success does not
establish authentication, power-loss durability, failover, or remote exactly-once
effects. Race detection covers only the executed schedules.
