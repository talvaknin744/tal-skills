# Architecture and programming skills: research and additions

Research date: 2026-09-29. The priority is preventing concrete engineering failures, especially interrupted 12–24 hour jobs and races between services reading or updating shared state. This is a curated assessment of relevant sources, not a claim to rank every skill on the internet.

## Decisions

| Priority | Capability | Repository decision |
| --- | --- | --- |
| Add now | Preserve long-running work through shutdown and rolling deployment | [graceful-draining](../skills/engineering/graceful-draining/SKILL.md): admission, durable progress, ownership transfer, compatible worker generations, and interruption accounting |
| Add now | Explain and prevent a concrete concurrent or stale-read history | [concurrency-correctness](../skills/engineering/concurrency-correctness/SKILL.md): freshness contracts, transaction boundaries, cache races, replicas, and reproducible schedules |
| Next candidate | Test state machines under generated event sequences and failures | Evaluate a focused property/state-machine testing skill; distinguish model checking, deterministic implementation tests, and real datastore integration |
| Next candidate | Prove recovery after corruption, deletion, or failed restoration | A focused `recovery-validation` skill would check loss/time bounds, independent restore, business invariants, and controlled return to service |
| Extend when needed | Backpressure, deadline propagation, and retry amplification | Extend the existing operational guidance around a measured failure; create a separate skill only if focused invocation adds value |
| Already covered | General architecture, microservice boundaries, sagas, idempotency, topology, Temporal | Reuse the existing skills; another broad architecture persona would mostly duplicate their instructions |

The comparison includes both published skills and the separately authored book skills already present in the local workspace. The latter's catalog and evaluation records belong to their own work; this research does not claim to have authored or revalidated their book readings.

## Strongest sources to use

| Source | Best use here | Decision |
| --- | --- | --- |
| [DDIA](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781098119058/) | Replication, transaction isolation, partial failure, and processing contracts | First reading priority for concurrency; distinguish the final edition from the supplied early-release draft |
| [Google SRE](https://sre.google/sre-book/table-of-contents/) and [SRE Workbook](https://sre.google/workbook/index/) | Draining, recovery evidence, retry containment, and long-work canaries | Strongest directly accessible book foundation for the job example |
| [Release It!, second edition](https://pragprog.com/titles/mnee2/release-it-second-edition/) | Failure containment and operational stability | Selective further reading; broad operations coverage already exists locally |
| [Matt Pocock's skills](https://github.com/mattpocock/skills/tree/c55ee46073ed923f86ce59a5eb3b6d895095d1b7) and [Superpowers](https://github.com/obra/superpowers/tree/8ca22dba9a94f28898bbce59f2537ff4d87c747d) | Reproduction, evidence gathering, and precise agent workflows | Adapt useful methods; preserve the requested task and incident constraints |
| [Trail of Bits skills](https://github.com/trailofbits/skills/tree/82fe8226252622fa807643bdca1710901198553a) | Property testing and finding variants of a known bug | Best follow-on research candidate for failure testing; keep its licensing distinct |
| Official Redis, Supabase, and Cloudflare skills | Concrete product APIs and constraints | Conditional references after inspecting the actual example and deployed version |

The [eight-repository audit](architecture-skill-landscape.md) records pinned files, licenses, good features, defects, and evaluation limits. It found useful guidance alongside incomplete saga recovery, overly broad pipeline rules, and queue examples lacking job recovery. No third-party pack was imported wholesale. The [eight-book shortlist](architecture-book-sources.md) records editions, access limits, and overlap.

## Reading the supplied DDIA and SRE sources

The [DDIA mirror](https://github.com/YZXBiz/ddia/tree/157c2b303db17188dc4509c809552fd378e78b25/raw) explicitly labels its files early-release drafts for the second edition. The review read the main prose of chapters 6, 8, 9, and 10 and selected processing sections in 11–13. It does not claim a full reading of the final published edition. SRE findings use the official complete HTML text; the supplied PDF is an alternate source.

- [Replication and transactions](ddia-replication-transactions.md): snapshot timing, monotonic reads, unknown commits, and topology limits.
- [Faults and consistency](ddia-faults-consistency.md): clock domains, fencing, real-time recency, and ordered identifiers.
- [Processing and recovery](ddia-processing-recovery.md): reproducible inputs, checkpoints, derived data, and replay semantics.
- [Deeper SRE reading](sre-reliability-reading.md): restore validation, publication authority, scheduled work, and recovery exercises.

These readings produced small, concrete refinements to the two skills: preserve input identity as well as the cursor; validate a restored checkpoint; separate monotonic drain timers from durable deadlines; distinguish unknown commit from confirmed abort; and account for snapshots established before a lock. They also reinforced keeping deduplication evidence for the actual replay horizon. Draft examples are reviewed critically against current primary documentation.

## Your rolling-deployment example

The likely design error is coupling a **logical job**, a **worker's ownership interval**, and a **business-failure attempt**. The actual runtime must confirm that diagnosis: a queue delivery, Kubernetes Job retry, and Temporal Activity attempt are different counters.

For checkpointable work, the target sequence is:

1. Bring up compatible replacement capacity and prevent the retiring generation from claiming new or resumed work.
2. Stop admission and polling, including prefetched work; preserve the dependencies needed to save progress.
3. Commit a resumable checkpoint and transfer ownership safely, retaining the logical job identity.
4. Resume on eligible workers; reject stale-owner writes and reconcile ambiguous external effects.
5. Record the deployment interruption separately from a business failure, while retaining a finite job deadline and stalled-progress escalation.

If the work cannot resume safely, retaining old workers until completion is a different deployment strategy with a real capacity and lifetime cost. Neither strategy promises survival of arbitrary infrastructure failure without durable state. These are design recommendations derived from the primary-source constraints, not built-in behavior supplied by Kubernetes.

Kubernetes gives shutdown a finite grace period shared with `preStop`; a Deployment's rollout is not constrained by its PodDisruptionBudget. Those controls alone do not preserve application progress. [Lifecycle hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/), [disruptions](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/).

See [the draining research](draining-primary-sources.md) for queue/framework limits, recovery, and distinctions between application and broker retry budgets.

## Your stale-data and race example

Two services can legitimately observe different versions. First decide what the operation requires: an approximate display, read-your-writes, a bounded age, or an invariant such as “only one reservation succeeds.” A fresh read and a safe mutation are separate requirements.

For example, both services can read the last available item from the primary and still both reserve it. Enforce the invariant at the authoritative mutation, using a suitable conditional update, constraint, lock scope, or transaction. PostgreSQL's isolation levels differ, and its Repeatable Read can still admit serialization anomalies. [Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

A cache also has writers on its read path: an old database response can fill the cache after a newer invalidation. A revision check must be atomic at the cache transition, and losing the revision marker through eviction can reopen the race. Meta documents both failure modes. [Cache made consistent](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/).

The skill therefore asks for an actor-by-actor history and a check that forces the harmful ordering. It treats TTLs, local mutexes, and “read from primary” as mechanisms with limited contracts, rather than universal repairs. See [the consistency research](consistency-primary-sources.md).

## How sources were assessed

For existing skills, inspect the actual entrypoint and relevant references, revision, license, scope, technical examples, and available evaluation material. Repository popularity is a discovery aid, not evidence of correct concurrency semantics. Published prompts and harnesses are distinguished from independently executed evaluations.

For books, verify edition and accessible material through authors or publishers. A table of contents establishes relevance, not that the full book was read. Use current primary platform documentation for implementation details; a historical book example does not establish today's API behavior.

Original skill instructions use Matt Pocock's [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents): narrow triggers, a short common workflow, references reached by explicit conditions, and observable completion criteria. Books and articles are linked and discussed; their full text and examples are not bundled or relicensed.

## Search for complete book context

A follow-up search checked publisher, author, and institutional sources for the books initially assessed through previews. It found a complete institutional copy of *Release It!*, second edition; full stability, deployment, and versioning chapters were read after checking internal edition details. Those chapters corroborated the existing drain protocol without requiring another skill change. The [operations/database access ledger](full-text-access-operations.md) and [design-book access ledger](full-text-access-design.md) record which complete copies or excerpts were found and exactly what was read. The author-hosted Java concurrency chapter and software-design extract were read in full as excerpts; they are not complete books. References without sufficient chapter context remain further-reading candidates rather than sources for new implementation rules.

The final DDIA publisher pages exposed previews and an access route; the supplied early-release mirror remains separately labeled. Microsoft provides a [complete first edition of Designing Distributed Systems](https://info.microsoft.com/rs/157-GQE-382/images/EN-CNTNT-eBook-DesigningDistributedSystems.pdf), already covered by the local topology skill. The [second-edition publisher page](https://www.oreilly.com/library/view/designing-distributed-systems/9781098156343/) establishes the newer edition, not a complete reading of it.

## Evaluation evidence

The [eleven-case corpus](../evals/distributed-correctness/README.md) includes the two original incidents and book-derived failure cases. [Seven recorded trials](../evals/distributed-correctness/smoke-observations.md) sampled six distinct cases; one executable cache repair passed all five supplied checks after starting with three failures. The records distinguish structural checks, reviewed responses, and actual execution. No live cluster, real database isolation test, or 24-hour workload was run, and the trial restrictions were prompt-only.
