# Architecture and programming skill landscape

Reviewed 2026-09-29. This is a shortlist selected for the repository's distributed-job and concurrency problems, not an exhaustive ranking or a popularity contest. Recommendations below are our assessment of inspected source files. No third-party skill was installed, executed, or copied into this repository during this review.

## Recommendation

The largest gap is **failure-specific reasoning**, not another general architecture catalog. Build focused workflows for durable job draining and cross-service consistency. Borrow research methods from the strongest sources below; retain vendor-specific guidance as conditional references. Existing architecture, microservice, idempotency, and Temporal skills already cover much of the broad design territory.

| Source | Decision for this repository | Best contribution | Main limitation |
|---|---|---|---|
| Matt Pocock | Reference existing guidance; selectively adapt | Observable completion criteria, reproducing feedback loops, interface contracts | General diagnosis does not define distributed consistency or handoff protocols |
| Superpowers | Selectively adapt debugging methods | Boundary evidence, falsifiable hypotheses, regression reproduction | Needs incident mitigation and distributed fault-model branches |
| Trail of Bits | Reference; consider separately licensed adaptation later | Invariant testing and searching for variants of a known bug | Security-oriented scope; CC BY-SA licensing; limited efficacy evidence |
| Redis official skills | Selective reference after technical review | Client, key, replica, and cluster-specific choices | An inspected cluster rule and its eval oversimplify pipelines |
| Supabase official skills | Reference existing vendor skill | Atomic SQL claims, deadlock prevention, short transactions | A queue claim example is not a complete recoverable job protocol |
| Cloudflare official skills | Defer until a Cloudflare project needs it | Retrieval-first guidance for per-entity durable coordination | Platform-specific storage and execution guarantees |
| wshobson/agents | Skip wholesale import; reference individual examples | Modular architecture and Go concurrency examples | Examples need correctness review; substantial catalog overlap |
| Jeffallan/claude-skills | Skip these architecture imports | NFRs, trade-offs, reference routing, review checkpoints | Overlap plus unsafe simplifications in distributed examples |

## How candidates were assessed

Discovery used web search followed by first-party GitHub repositories. The review fetched each repository's current commit and tree, then read the named `SKILL.md` files, relevant references, license, and available evaluation artifacts. It considered:

1. A trigger describing a recognizable task, with a boundary against adjacent skills.
2. Actions and observable completion criteria, rather than an expert persona or checklist alone.
3. Conditional references that the agent can discover at the right point.
4. Explicit assumptions and failure behavior, especially retries, ambiguous completion, lost ownership, stale reads, and asynchronous interleaving.
5. Evaluation evidence separated into structural checks, behavioral scenarios, and independently reproduced results.
6. Added value over the local catalog and the work required to maintain a portable adaptation.

These criteria use Matt Pocock's [Writing for Agents](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/productivity/writing-for-agents/SKILL.md). Upstream benchmarks were inspected, not rerun; none establishes effectiveness on the user's two incidents.

## Findings by source

### Matt Pocock: useful methods already available locally

[`diagnosing-bugs`](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/diagnosing-bugs/SKILL.md) requires a reproducing command, symptom-specific assertions, minimized input, ranked falsifiable hypotheses, and verification against the original scenario. Redaction is explicit. These are good ingredients for concurrency diagnosis. Adapt the strict fast-reproduction gate: some production failures initially have only partial histories, so the workflow should distinguish provisional causal analysis from a demonstrated reproduction, and permit authorized containment while evidence is gathered.

[`codebase-design`](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/codebase-design/SKILL.md) treats invariants, ordering, errors, configuration, and performance as part of an interface. That is useful when specifying job ownership and consistency contracts. Its module vocabulary is deliberately opinionated; applying its ban on words such as “service” everywhere would obscure the distributed topology this user needs to discuss.

[`improve-codebase-architecture`](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/improve-codebase-architecture/SKILL.md) surveys change hotspots, presents candidates, then runs an interactive design discussion. It depends on sibling skills and a particular presentation workflow. Reference it for module-refactoring work; it adds little to the immediate lifecycle and consistency gaps. The inspected repository tree did not contain a dedicated behavioral evaluation suite for these three skills. This is an observation about this snapshot, not proof that the author has never evaluated them.

### Superpowers: diagnosis structure worth adapting

[`systematic-debugging`](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/systematic-debugging/SKILL.md) emphasizes evidence across component boundaries and changing one experimental variable. It can improve a distributed diagnosis skill, but needs separate handling for urgent mitigation, redacted instrumentation, message reordering, replica lag, and ownership changes. Its categorical interpretation of three failed fixes as an architecture problem should become a prompt to reassess evidence, not a conclusion.

[`test-driven-development`](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/test-driven-development/SKILL.md) and its [test-writing reference](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/test-driven-development/writing-good-tests.md) provide behavior-focused regression methods. Preserve those without importing unconditional deletion or test mandates into every task.

Evaluation evidence is more concrete than a badge: the separate [root-cause fixture checker](https://github.com/prime-radiant-inc/superpowers-evals/blob/e64684cd1fa270c464ac797747e45bbe8d127e8b/scenarios/systematic-debugging-fixes-root-cause/checks.sh) tests a pricing example, while the [conversation debugging oracle](https://github.com/prime-radiant-inc/superpowers-evals/blob/e64684cd1fa270c464ac797747e45bbe8d127e8b/scenarios/conversation-debugging/oracle.py) checks text chunking. These are useful runnable artifacts, not distributed-incident benchmarks.

### Trail of Bits: invariants and bug-family searches

[`property-based-testing`](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/plugins/property-based-testing/skills/property-based-testing/SKILL.md) is a good reference for choosing nontrivial properties, shrinking failures, and distinguishing a broken property from a broken implementation. For this repository, apply the method to a state-transition model and generated event schedules. Data generation alone does not exercise distributed interleavings.

[`variant-analysis`](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/plugins/variant-analysis/skills/variant-analysis/SKILL.md) starts with a known seed, calibrates a search, broadens one dimension at a time, and triages counterarguments. It fits the step after diagnosing one race: look for the same claim/commit or cache-fill pattern elsewhere. A matching pattern is a candidate weakness, not proof that it caused the observed incident.

The evaluation documentation is unusually candid. The [PBT README](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/plugins/property-based-testing/README.md) limits what its two ablations establish. The [variant eval report](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/plugins/variant-analysis/evals/README.md) records saturated unaided cases and missing skill invocations. A later [planted seed/variant/decoy experiment](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/plugins/variant-analysis/tests/README.md) is useful but narrow. The repository is CC BY-SA 4.0, so copying an adaptation into an MIT pack requires explicit license handling; linking and independently authoring from technical sources avoids an unnecessary vendored derivative.

### Redis: relevant official sources still require review

[`redis-core`](https://github.com/redis/agent-skills/blob/a84871d065f398fed55e1633f66b66f731eb4e2b/skills/redis-core/SKILL.md) has clear branches for data structures and keys, but does not by itself solve DB/cache coherence. [`redis-connections`](https://github.com/redis/agent-skills/blob/a84871d065f398fed55e1633f66b66f731eb4e2b/skills/redis-connections/SKILL.md) covers pools, pipelining, client caching, and timeouts. Its [timeout example](https://github.com/redis/agent-skills/blob/a84871d065f398fed55e1633f66b66f731eb4e2b/skills/redis-connections/references/timeouts.md) enables automatic retries without separating read operations from ambiguous non-idempotent mutations. Add that distinction before adaptation.

[`redis-clustering`](https://github.com/redis/agent-skills/blob/a84871d065f398fed55e1633f66b66f731eb4e2b/skills/redis-clustering/SKILL.md) correctly flags stale replica reads and hash-tag hotspots. However, it groups ordinary pipelines with operations requiring one hash slot. That is too broad for the shown Python context: official [redis-py documentation](https://redis.readthedocs.io/en/stable/advanced_features.html#pipelines-in-clusters) describes nontransactional cluster pipelines grouping commands by node, whereas transactional cluster pipelines require one slot. An adaptation must distinguish client, deployment, atomicity, and command type.

The repository publishes [clustering prompt expectations](https://github.com/redis/agent-skills/blob/a84871d065f398fed55e1633f66b66f731eb4e2b/evals/redis-clustering/clustering/evals.json) and a [with/without-skill aggregate snapshot](https://github.com/redis/agent-skills/blob/a84871d065f398fed55e1633f66b66f731eb4e2b/evals/redis-clustering/clustering/baselines/aggregate-benchmark.md). The pipeline case repeats the questionable premise. This demonstrates why behavioral scores need a technically sound oracle; a good score alone cannot validate a rule.

### Supabase: good SQL references, bounded claims

[`supabase-postgres-best-practices`](https://github.com/supabase/agent-skills/blob/544bfc56c89afe2b87b20017a59b2c6e9502a1fb/skills/supabase-postgres-best-practices/SKILL.md) routes to small SQL examples across locking, schema, security, and performance. It is already available in the user's environment. Keep it as a conditional companion for Postgres rather than another duplicate copy.

Its [`SKIP LOCKED` reference](https://github.com/supabase/agent-skills/blob/544bfc56c89afe2b87b20017a59b2c6e9502a1fb/skills/supabase-postgres-best-practices/references/lock-skip-locked.md) shows an atomic claim/update. The example labeled a complete queue pattern does not include reclaiming an abandoned job, fencing an old worker, checkpointing, or retry accounting. Those omissions matter for a 24-hour worker even though the claim statement is useful. Treat its throughput multiplier as illustrative rather than a measured guarantee for this system.

The inspected [`test/sanity.test.ts`](https://github.com/supabase/agent-skills/blob/544bfc56c89afe2b87b20017a59b2c6e9502a1fb/test/sanity.test.ts) checks skill discovery and installation. It does not verify database correctness under concurrency.

### Cloudflare: keep the platform boundary

[`durable-objects`](https://github.com/cloudflare/skills/blob/626547c06881a20b3322bdc2ed6e6451b33a4fb6/skills/durable-objects/SKILL.md) has a precise platform trigger, per-entity coordination guidance, durable-state rules, and an instruction to retrieve current API documentation. Its [rules reference](https://github.com/cloudflare/skills/blob/626547c06881a20b3322bdc2ed6e6451b33a4fb6/skills/durable-objects/references/rules.md) explicitly routes storage gates, external-I/O races, transactions, restarts, and lifecycle questions to relevant official pages. That reference routing is a good writing pattern.

Adopt only when the target system uses Durable Objects. Its single-object guarantees are not a recipe for synchronizing arbitrary Kubernetes services. The [testing reference](https://github.com/cloudflare/skills/blob/626547c06881a20b3322bdc2ed6e6451b33a4fb6/skills/durable-objects/references/testing.md) guides application tests; it is not evidence that skill behavior has been benchmarked.

### wshobson: examples are a starting point, not the correctness argument

[`architecture-patterns`](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/plugins/backend-development/skills/architecture-patterns/SKILL.md) names clear dependency and testing boundaries. Its [worked user-creation example](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/plugins/backend-development/skills/architecture-patterns/references/details.md) checks email, then inserts using a separate database acquisition; the shown conflict target is ID. Two callers can both pass the email check. A database uniqueness constraint and explicit conflict handling are necessary to make the invariant authoritative. Sequential fake-repository tests do not establish that behavior.

[`go-concurrency-patterns`](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/plugins/systems-programming/skills/go-concurrency-patterns/SKILL.md) offers useful language primitives and points to a [shutdown example](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/plugins/systems-programming/skills/go-concurrency-patterns/references/details.md). That example cancels worker context and waits briefly; it contains no durable admission, ownership, checkpoint, or retry-budget protocol. Its `Shutdown` closes a channel the workers do not read, relying on cancellation in `main`. It therefore should not be imported as the answer to the user's job-draining problem.

The [evaluation README](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/evals/README.md) distinguishes static scores from experimental judges and says the latter have not been validated against human labels. Favor that explicit limit over inferred efficacy from catalog size.

### Jeffallan: broad architecture overlap and repairable examples

[`architecture-designer`](https://github.com/Jeffallan/claude-skills/blob/882ef55e377dbf9a4dbe496bb41ac6ccd0e555cf/skills/architecture-designer/SKILL.md) includes requirements, NFRs, alternatives, ADRs, and conditional references. Its broad remit overlaps the repository's architecture skill. The expert persona adds little compared with evidence and completion criteria.

[`microservices-architect`](https://github.com/Jeffallan/claude-skills/blob/882ef55e377dbf9a4dbe496bb41ac6ccd0e555cf/skills/microservices-architect/SKILL.md) adds checkpoints but also hard-codes a sub-100-ms rule for synchronous communication without an application-specific justification. Its saga example records a step only after success, holds progress in memory, and suppresses compensation errors. A committed effect followed by a lost response can therefore escape the shown compensation list. For durable systems, record recoverable intent, handle uncertain effects, and retain failed compensation as unfinished work. Skip importing this broad pack; the repository's existing narrower microservice and Temporal skills provide a better base. The inspected repository tree showed validators and a Makefile test; no behavioral evaluation for these two skills was identified.

## Local overlap and next additions

The inspected checkout contains `architecture`, `idempotency`, `distributed-system-patterns`, six `microservice-*` skills, and the Temporal family. Some additions belong to concurrent work in the shared checkout; their presence here is not a claim that every file is published.

- **Draining and durable job recovery:** a distinct missing invocation. Cover admission closure, finish/checkpoint/handoff choice, authoritative ownership, bounded shutdown, recovery after forced death, old/new compatibility, and separate business failure versus infrastructure interruption accounting.
- **Cross-service consistency:** a distinct missing invocation. Start with the invariant and permitted staleness, reconstruct a concrete interleaving, choose the authority/atomicity boundary, and verify read and write paths together. Generic microservice data ownership does not exhaust cache-fill races, stale replicas, or lost updates.
- **Deterministic failure testing:** initially a shared reference or verification branch. Promote it to a separate skill only if users need to invoke it independently across multiple workflows. Candidate techniques include controlled barriers, dropped acknowledgments, delayed old-owner writes, replayed invalidations, and executable state models.

These are proposed skill boundaries derived from the inspected catalog and the user's incidents, not recommendations to change the user's infrastructure without further system evidence.

## Pinned provenance and license review

| Repository | Inspected commit | License file |
|---|---|---|
| mattpocock/skills | `c55ee46073ed923f86ce59a5eb3b6d895095d1b7` | [MIT](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/LICENSE) |
| obra/superpowers | `8ca22dba9a94f28898bbce59f2537ff4d87c747d` | [MIT](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/LICENSE) |
| trailofbits/skills | `82fe8226252622fa807643bdca1710901198553a` | [CC BY-SA 4.0](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/LICENSE) |
| redis/agent-skills | `a84871d065f398fed55e1633f66b66f731eb4e2b` | [MIT](https://github.com/redis/agent-skills/blob/a84871d065f398fed55e1633f66b66f731eb4e2b/LICENSE) |
| supabase/agent-skills | `544bfc56c89afe2b87b20017a59b2c6e9502a1fb` | [MIT](https://github.com/supabase/agent-skills/blob/544bfc56c89afe2b87b20017a59b2c6e9502a1fb/LICENSE) |
| cloudflare/skills | `626547c06881a20b3322bdc2ed6e6451b33a4fb6` | [Apache-2.0](https://github.com/cloudflare/skills/blob/626547c06881a20b3322bdc2ed6e6451b33a4fb6/LICENSE) |
| wshobson/agents | `156b7a5e7a8b93642628a339ee4039c925b34c7f` | [MIT](https://github.com/wshobson/agents/blob/156b7a5e7a8b93642628a339ee4039c925b34c7f/LICENSE) |
| Jeffallan/claude-skills | `882ef55e377dbf9a4dbe496bb41ac6ccd0e555cf` | [MIT](https://github.com/Jeffallan/claude-skills/blob/882ef55e377dbf9a4dbe496bb41ac6ccd0e555cf/LICENSE) |

The auxiliary `prime-radiant-inc/superpowers-evals` sources were inspected at `e64684cd1fa270c464ac797747e45bbe8d127e8b` as evaluation evidence, not selected for redistribution. License labels above reflect the inspected root files; a later import must retain applicable notices and check the specific copied files. Pinned findings can age: recheck current code and primary product documentation before implementing an API-specific change.
