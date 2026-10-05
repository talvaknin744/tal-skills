# Distributed design: two complete first-party readings

Research date: 2026-10-01. The [structured ledger](deepchecks.json) records the same two cards, source metadata, current documentation checks and access limits. These are new article URLs: a pre-write fixed-string search of **all** `docs/research` found neither canonical URL nor article slug. No article bodies were saved and no vendor examples were executed.

## Snowflake execution anchors

[Strengthening Snowflake’s Distributed Query Lifecycle with Execution Anchors](https://www.snowflake.com/en/blog/engineering/snowflake-distributed-query-execution-anchors/) — Snowflake Engineering, Yu Zhang and Kirutthika Raja, **2026-05-05**. Complete main body read: introduction, problem, anchor contract, all three execution/transfer scenarios, correctness, rollout, conclusion and looking ahead; author biographies/navigation excluded. First-party ownership is established by the Snowflake domain, engineering branding and named company engineers.

| Dimension | Design card |
|---|---|
| Trigger | Retries, crash recovery and background finalization share one operation's durable writes. |
| Failure / constraint | Multiple owners could finalize the same query; conventions become harder to audit as paths multiply. |
| Mechanism | Record the owner in FDB, guard every transaction, finish pending writes before voluntary transfer, and require durable death proof before recovery claims. Acquisition piggybacks on existing transactions. |
| Limits | All durable effects must cross the guarded store. The article omits the implementation resolving ambiguous pending commits; its reported normal-path overhead is workload-specific. |
| Counterexample | **Analyst inference:** an unguarded external effect or a timed-out commit that later succeeds defeats a handoff justified solely by local ownership state. |
| Verification | **Reported:** three dry-run/enforcement phases, separate rollback flags and ownership dashboards. **Proposed:** pause an old worker and flusher around handoff; assert their delayed writes cannot commit, and recovery never overlaps an authorized owner. |

Article evidence: **The core idea**, **Voluntary transfer**, **Involuntary transfer**, **Rolling out seamlessly**, linked above. This is a positive structural-invariant design, not an incident account. Generalizing its in-memory guard requires preserving its surrounding transfer and transaction protocol.

Current contract crosscheck: the [FoundationDB Developer Guide](https://apple.github.io/foundationdb/developer-guide.html), version **7.4.8**, last updated **2026-09-24**, distinguishes unknown commit results from timeout/cancellation. A sent commit can succeed after cancellation or timeout; a retry after `commit_unknown_result` can repeat committed effects. Therefore a deadline alone does not prove abort, and retry logic needs idempotency. Read scope: **Transactions with unknown results**, **The commit_unknown_result Error**, and **Non-Retryable Errors**. This identifies an evidence gap in the blog's protocol detail; it does not demonstrate a Snowflake defect.

## Pinterest datastore selection and operational isolation

[TiDB Adoption at Pinterest](https://medium.com/pinterest-engineering/tidb-adoption-at-pinterest-1130ab787a10) — Pinterest Engineering, Alberto Ordonez Pereira and Lianghong Xu, **2024-07-19**. Complete main body read: motivation through acknowledgements, including selection, deployment, compute, access layer, snapshots, CDC, disaster recovery and learnings; newsletter/comments/recommendations excluded. Ownership was rechecked through the [official careers footer](https://www.pinterestcareers.com/), whose Engineering Blog link resolves to [this publication](https://medium.com/pinterest-engineering), which links back to Pinterest Careers.

| Dimension | Design card |
|---|---|
| Trigger | Replace a datastore serving indexed, high-throughput online workloads alongside exports and recovery. |
| Failure / constraint | Synthetic results miss sustained-load behavior; snapshots, backups and maintenance can hurt serving latency. |
| Mechanism | Filter by requirements, benchmark finalists, mirror identical production workloads, then inject operational failures. Offload snapshots to learner replicas and throttle backup traffic. |
| Limits | The selection evaluates Pinterest's 2022 workloads. Replica offload retains shared-network pressure; historical competitor and CDC-throughput observations are not current product limits. |
| Counterexample | **Analyst inference:** a passing synthetic benchmark with unacceptable snapshot-time p99 latency fails the actual service requirement; snapshot-isolated transactions can still permit write skew. |
| Verification | **Reported:** node/AZ loss, scale-out, termination, online DML and redeployment tests. **Proposed:** measure serving p99, CDC lag and restore RTO/RPO under maintenance, snapshot load, duplicate CDC delivery and replica fallback. |

Article evidence: **Methodology**, **The TiDB Adoption Journey**, **Offline Analytics**, **Disaster Recovery**, **Learnings**, linked above. Carry forward the workload and operations evaluation method, rather than its comparative vendor verdicts or performance multipliers.

Current contract checks, all retrieved 2026-10-01 from undated living **TiDB Self-Managed v8.5** documentation:

- [Transaction Isolation Levels](https://docs.pingcap.com/tidb/stable/transaction-isolation-levels/): snapshot isolation allows write skew. Pinterest's consistency claim does not establish serializability. Scope: supported isolation levels, snapshot isolation and write-skew discussion.
- [TiCDC Overview](https://docs.pingcap.com/tidb/stable/ticdc-overview/#replication-order): DDL/DML delivery is at least once; [replication consistency](https://docs.pingcap.com/tidb/stable/ticdc-overview/#replication-consistency) preserves single-row update order for the MySQL sink, without guaranteeing upstream transaction execution order. Scope: replication order, consistency and new/classic architecture; the latter prevents reusing the article's old throughput cap as current fact.
- [Follower Read](https://docs.pingcap.com/tidb/stable/follower-read/): learner preference can fall back to leaders/followers; coordination and retry paths still involve leaders. Scope: learner selection, ReadIndex and retry behavior. Offload is a capacity measure whose fallback behavior needs testing.

## Access boundary

[Automated Query Retries: Improving Snowflake’s fault tolerance](https://www.snowflake.com/en/blog/engineering/automated-query-retries-improving-snowflakes-fault-tolerance/) was a relevant third candidate, new in the same duplicate search. Its search metadata and link from the anchor article were available; subsequent full-body requests timed out twice. It is **not** counted as read or extracted. Archive crawling belongs to the parent assignment; this note makes no claim to have drained any publisher archive.
