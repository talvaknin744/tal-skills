# Source basis

This is an original operational workflow informed by Sam Newman's *Building Microservices: Designing Fine-Grained Systems*, first and second editions. The numbered procedure, completion criteria, execution boundaries, and verification requirements are original synthesis, not quoted book instructions.

User-supplied sources:

- [First edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20-%20Designing%20Fine-Grained%20Systems.pdf)
- [Second edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20Designing%20Fine-Grained%20Systems%202nd%20By%20Sam%20Newman.pdf)

PDF page numbers are one-based positions from the start of each supplied file. The second edition is a 754-page reflowed PDF, so these are not its print page numbers.

| Workflow concept | Verified first-edition locator | Verified second-edition locator |
| --- | --- | --- |
| Artifact promotion and configuration | Ch. 6, “Build Pipelines and Continuous Delivery,” PDF 127 (print 107); “Service Configuration,” PDF 135 (print 115) | Ch. 8, “Environments,” PDF 288; “Zero-Downtime Deployment,” PDF 296; “Separating Deployment from Release,” PDF 342; “Canary Release,” PDF 344 |
| User outcomes and cross-service diagnosis | Ch. 8, “Service Metrics,” “Synthetic Monitoring,” “Implementing Semantic Monitoring,” “Correlation IDs,” PDF 180–183 (print 160–163) | Ch. 10, “Distributed Tracing,” PDF 407–409; “Are We Doing OK?”, PDF 410–412; “Toward better alerting,” “Semantic Monitoring,” PDF 416–417 |
| Failure containment | Ch. 11, “Degrading Functionality,” PDF 227 (print 207); “Timeouts,” “Circuit Breakers,” “Bulkheads,” “Isolation,” “Idempotency,” PDF 231–235 (print 211–215) | Ch. 12, “Time-Outs,” “Retries,” “Bulkheads,” “Circuit Breakers,” PDF 493–500; “Isolation,” “Middleware,” “Idempotency,” “Spreading Your Risk,” PDF 501–505 |
| Trust and data handling | Ch. 9, “Fine-Grained Authorization,” PDF 192 (print 172); “The Deputy Problem,” PDF 198–199 (print 178–179); “It's All About the Keys,” “Encrypt Backups,” PDF 201 (print 181); “Be Frugal,” PDF 206 (print 186) | Ch. 11, “Principle of Least Privilege,” PDF 433; “Rotation,” “Revocation,” PDF 444–445; “Implicit Trust Versus Zero Trust,” PDF 455–456 |
| Capacity and cache trade-offs | Ch. 11, “Worker-Based Systems,” PDF 240 (print 220); “Caching,” PDF 245 (print 225); “Caching for Writes,” “Caching for Resilience,” “Hiding the Origin,” PDF 248 (print 228) | Ch. 13, “The Four Axes of Scaling,” PDF 520–521; “Horizontal Duplication,” PDF 524; “Data Partitioning,” PDF 528–533; “For Scale,” “For Robustness,” PDF 541; “Invalidation,” PDF 548; “Write-behind,” “The Golden Rule of Caching,” PDF 552–553; “Autoscaling,” PDF 556 |

The books provide the architectural trade-offs. This skill adds an actionable evidence workflow and combines related concerns around a scoped change. Product choices, example timeout values, historical security recipes, and vendor capabilities are deliberately not carried forward; use current primary documentation for implementation-specific claims.

## Operational evidence

Reviewed 2026-09-29. Discord's [message-storage account](https://discord.com/blog/how-discord-stores-trillions-of-messages)
(2023-03-06) supports investigating hot partitions and request coalescing before
assuming a database replacement resolves demand concentration. Its language,
node counts and performance results are workload-specific.

The [Go singleflight API](https://pkg.go.dev/golang.org/x/sync@v0.23.0/singleflight)
and [v0.23.0 implementation](https://github.com/golang/sync/blob/v0.23.0/singleflight/singleflight.go)
illustrate local Group/key duplicate suppression. They supply no application
authorization, freshness or cancellation policy; `Forget` can admit another
call while the earlier call remains active. [Tokio 1.53.1 Semaphore](https://docs.rs/tokio/1.53.1/tokio/sync/struct.Semaphore.html)
illustrates bounded permit holders and fair-queue head-of-line blocking, not a
bound on every waiting caller. These are reading pins, not required dependencies.

[ScyllaDB's partition diagnostics](https://docs.scylladb.com/manual/stable/troubleshooting/large-partition-table.html)
(manual 2026.3) are node-local and per-SSTable; metadata coverage also depends on
version and upgrade state. An empty diagnostic table is not evidence of evenly
distributed request load. The capacity guidance combines these limits into
original checks; no live database or load-test result is claimed here.

The conditional [cache-load reference](cache-load-protection.md) uses Redis's
[KEYS](https://redis.io/docs/latest/commands/keys/),
[SCAN](https://redis.io/docs/latest/commands/scan/),
[Bloom filter](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/),
[BF.EXISTS](https://redis.io/docs/latest/commands/bf.exists/), and
[keyspace-notification](https://redis.io/docs/latest/develop/pubsub/keyspace-notifications/)
contracts. Redis's [thundering-herd article](https://redis.io/blog/how-to-tame-the-thundering-herd-problem/)
(2026-05-13) supports jitter/coalescing; Amazon's [caching strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)
support soft/hard expiry and negative entries. Source reading does not establish
the application's membership completeness, invalidation ordering or refresh
capacity; those remain explicit conditions and checks.

## Cache design contracts

The [cache-design reference](cache-design.md) adds conditional choices checked
against Redis primary documentation on 2026-09-29. These mutable `/latest/` pages
are reading sources, not dependency pins; verify the deployed server, client,
topology, and managed-service support. Application identity, admission, and
coherence requirements are original deductions from the documented boundaries.

| Branch | Primary sources and actual scope |
| --- | --- |
| Buffered-write acceptance | [Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/), [replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/): persistence/failover windows and history-qualified progress. [WAIT](https://redis.io/docs/latest/commands/wait/) (since 3.0) and [WAITAOF](https://redis.io/docs/latest/commands/waitaof/) (since 7.2): same-connection receipt/fsync counts, timeout behavior and strong-consistency limits. |
| Delivery and retention | [LMOVE](https://redis.io/docs/latest/commands/lmove/) (since 6.2), [XREADGROUP](https://redis.io/docs/latest/commands/xreadgroup/), [XCLAIM](https://redis.io/docs/latest/commands/xclaim/): recoverable delivery, pending ownership and repeat processing. [XTRIM](https://redis.io/docs/latest/commands/xtrim/): pending-payload removal; KEEPREF/DELREF/ACKED options require 8.2. |
| Read routing and L1 | [XLEN](https://redis.io/docs/latest/commands/xlen/), [XINFO GROUPS](https://redis.io/docs/latest/commands/xinfo-groups/), [INFO](https://redis.io/docs/latest/commands/info/): cardinality, consumer progress and replication fields differ; group lag fields require 7.0. [Tracking reference](https://redis.io/docs/latest/develop/reference/client-side-caching/) and [CLIENT TRACKING](https://redis.io/docs/latest/commands/client-tracking/): per-key versus prefix fanout, connection lifetime and redirection. |
| Distribution and loss | [Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/): slots, hash tags and multi-key limits. [Eviction](https://redis.io/docs/latest/develop/reference/eviction/): eligibility, pressure/rejection, approximate policies and role separation. Mutable-copy safety is an application requirement. |
| Resource budgets | [Pipelining](https://redis.io/docs/latest/develop/using-commands/pipelining/): round trips and queued replies. [Latency diagnosis](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/), [Redis 8 I/O-thread account](https://redis.io/blog/redis-8-ga/), [UNLINK](https://redis.io/docs/latest/commands/unlink/) (since 4.0), and [INFO](https://redis.io/docs/latest/commands/info/): blocking work, deferred reclamation and allocator/RSS distinctions. No benchmark gain or universal collection-size cutoff is adopted. |

These sources establish command contracts, not tested application throughput,
recovery, or freshness. The reference's failure checks require project-specific
execution; no new runtime result is claimed by this source ledger.
