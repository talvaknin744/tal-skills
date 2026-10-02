# Sources and transfer limits

Reviewed 2026-10-01. This package is an original workflow for maintenance decisions
and verification. Public primary sources below support the tradeoffs; no article
body, source pseudocode, production threshold, or measured improvement is bundled.

## Dropbox: workload-dependent reclamation

[Improving storage efficiency in Magic Pocket, our immutable blob store](https://dropbox.tech/infrastructure/improving-storage-efficiency-in-magic-pocket-our-immutable-blob-store),
published 2026-04-02. Complete main prose, seven sections, pseudocode, and textual
captions read; diagrams were not independently decoded. Evidence is the company's
account of its proprietary immutable blob store.

| Dimension | Transfer |
| --- | --- |
| Trigger | Maintenance falls behind after the work distribution changes. |
| Problem | A steady-state policy handles a sparse tail inefficiently. |
| Mechanism | Complementary selection policies, bounded planning, downstream rate limits, and locality. |
| Limits | Copying cost includes metadata, I/O, compute, and network; strategy names and reported gains are implementation-specific. |
| Counterexample | Efficient byte reclamation can still overload metadata when many object locations change. |
| Verification | This package proposes distribution replay with resource and foreground measurements; it has not reproduced Dropbox's results. |

The eligibility-threshold discussion depends on its predicate. This package
requires checking feedback direction rather than importing the article's
threshold movement as a controller rule.

## Apache Cassandra: independent engine crosscheck

[Unified Compaction Strategy documentation](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/ucs.html),
checked 2026-10-01; the page's version selector showed 5.0. Read the workload and
read/write amplification discussion, sharding and SSTable sizing, compaction
selection, configuration limits, unsafe expiration warning, and concurrency
section. `/latest/` is a mutable reading location; verify deployed versions.

| Dimension | Transfer |
| --- | --- |
| Trigger | Selecting or tuning compaction for a specific workload. |
| Problem | Read/write amplification and operation size trade against serving and memory cost. |
| Mechanism | Engine-specific scaling, sizing, and concurrency controls. |
| Limits | Fanout can override the source-count limit; concurrent compactors exclude repair validation work. |
| Counterexample | Increasing concurrency may worsen foreground latency; unsafe expiration can resurrect deletions. |
| Verification | Independently test effective bounds, foreground outcomes, and deletion semantics in the adopted engine; documentation reading is not an executed test. |

This corroborates maintenance cost and correctness boundaries independently of
Dropbox. It does not imply Dropbox uses UCS or map its strategies to Cassandra
configuration.

## Independent verification requirements

Controller stability, starvation treatment, durable publication, safe source
retirement, stale-owner protection, and pause/restart semantic checks are original
application requirements in this package. Neither source establishes those
guarantees generally. Backfill, rebalance, and index branches transfer the decision questions;
their mechanisms require the target engine's primary contract and project
evidence. No runtime, load, fault-injection, or behavioral model result is claimed
by this source ledger.
