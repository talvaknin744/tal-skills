# Equivalent backend contracts

Three small libraries reserve inventory in one PostgreSQL transaction. They use
the same [schema](schema.sql), [scenario inventory](scenarios.json), and
[behavior contract](../../docs/research/engineering-toolkit/backend-contract-review.md).
Each language retains its native cancellation and resource-ownership mechanisms:

- [Python](python/README.md): Psycopg async connections and task cancellation.
- [TypeScript](typescript/README.md): node-postgres, abort signals and owned leases.
- [Go](go/README.md): pgx, contexts and transaction finalization.

The request identity is `(trusted tenant, reserve-v1, request key)`. Successful
reservations retain immutable receipts. A conflicting command is rejected;
separate keys represent separate purchases. Stock cannot become negative.
Input validation happens at the runtime boundary. There is no HTTP framework,
external payment, automatic transaction retry, expiry, or production deployment.

## Run against a disposable database

Install the selected language's pinned dependencies using its README, then run
its verifier through the launcher:

```sh
python3 examples/backend/run.py --report /tmp/backend-result.json -- <verifier-command>
```

The launcher requires Python 3 and a working Docker daemon. It starts a new
PostgreSQL 18.6 container from a pinned image digest, binds to loopback, creates
the common schema, runs the command with a five-minute default limit, and removes
the owned container and volume afterward. `--timeout` changes that command limit.
It does not accept an existing database target. Verifiers use unique synthetic
tenants rather than clearing shared tables.

The child receives `TAL_EXAMPLE_DATABASE_URL`, `TAL_EXAMPLE_PROXY_URL`,
`TAL_EXAMPLE_PROXY_CONTROL_URL`, and optionally `TAL_EXAMPLE_REPORT`. URLs contain
temporary credentials and must stay out of published reports. Invoke commands
as separate arguments after `--`; the launcher does not evaluate shell text.

The proxy forwards the actual database protocol until it sees a successful
`COMMIT` response, then withholds that response and closes the connection. Every
commit through the proxy is affected. Use the direct URL for setup and recovery,
and the proxy URL only for the uncertain attempt. Its loopback status endpoint
reports connections, dropped commit replies and parser errors; it accepts no
state-changing requests.

## Interpret the evidence

A passing uncertainty case must observe the transport failure, preserve the
original operation identity, find the committed receipt from a fresh connection,
and count exactly one stock effect. A rejected or canceled attempt must finalize
its transaction or retire its connection; subsequent work must still complete.
The common scenario inventory is a contract, while each verifier supplies its
own controlled schedules and assertions.

These experiments exercise real PostgreSQL and pinned drivers. The container
stores data on temporary memory-backed storage: the examples establish local
transaction and recovery behavior, not crash persistence, replica failover,
production RPO/RTO, or external-provider guarantees. A new process or connection
is useful evidence of independence from client memory, not a durability claim.
