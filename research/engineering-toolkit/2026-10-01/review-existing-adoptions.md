# Independent review of existing-reference adoptions

Reviewed 2026-10-01 against working-tree bytes with repository HEAD `6bb1183550a08ea156486b5731f441557d01fc6a`. **No material unsupported guarantee, contradictory workflow, or misplaced duplication found in the five scoped additions.** No skill edits were made during this review.

This review covers the new conditional entry points, five references, and their corresponding new attribution sections. It excludes this reviewer's ownership-transfer and A2A work, other new skill packages, and unrelated working-tree changes. The whole distributed-system source-ledger file is hashed below, but its ownership-transfer section is excluded from the verdict. Prior book/source sections were inspected as context; their books and previous runtime evidence were not independently revalidated here.

## Findings and overlap boundaries

| Addition | Source/claim assessment | Existing-reference boundary |
| --- | --- | --- |
| `microservice-data/references/result-publication.md:9` | Disjoint identities remove the specific shared-list mutation conflict; lines 15–18 preserve same-identity and shared-invariant decisions. Lines 22–35 correctly require actual visibility, generation, retention, and batch-membership contracts. Spotify's unnamed database is not inferred to be Bigtable. No change requested. | `projections.md` selects freshness, bootstrap and repair for derived views. The new branch adds concurrent publication and pointer/content readiness within that selected view. |
| `distributed-system-patterns/references/partitioning-and-movement.md:16` | Layout choices are qualified by workload and engine support. Lines 31–43 distinguish callback completion, catch-up, eligible serving, and mutation authority; candidate states are not a universal protocol. Historical vendor API/default claims are not carried into a platform-neutral promise. No change requested. | `serving.md` makes the replication/sharding/scatter-gather decision; the new branch develops durable layout and state movement. Exclusive mutation enforcement is routed to `ownership.md`; that target's new content is outside this review. |
| `infrastructure-change-safety/references/configuration-distribution.md:11` | The local-copy mechanism is conditional on size, change rate and freshness. Lines 28–41 expressly leave snapshot watermark, deletions and offset/state cooperation unresolved in the source account. Kafka transactions are not presented as external-store atomicity. No change requested. | `rollout.md` handles generations and rollback; `terraform-state.md` handles infrastructure identity and state. The addition specifies configuration bootstrap and replay during those transitions. |
| `microservice-extraction/references/boundary-rehearsal.md:12` | Enforcement is chosen at a project seam. Lines 17–31 limit passing simulations to exercised paths and require selected-store/transport checks before authority moves. Django patches are optional, and the framework crosscheck is version scoped. No change requested. | `data-transition.md` handles authority and copying; `cutover.md` handles traffic and compatibility. Rehearsal makes the proposed ownership boundary executable before those physical transitions. |
| `failure-oriented-testing/references/state-models.md:7` | The oracle must derive from the contract independently. Excluded illegal actions remain an untested rejection partition. Lines 22–31 distinguish finite sequential exploration and a proposed sensitivity check from executed concurrency/crash evidence. The historical article's reversed prose outcome is explicitly qualified in attribution. No change requested. | `generated-inputs.md` covers input spaces/oracles/replay; `fault-histories.md` covers interruption schedules and real boundaries. The addition develops an action-history model without replacing either workflow. |

Shared vocabulary for ownership, visibility, interruption and evidence is useful overlap. None of the reviewed entry points loads all branches unconditionally, changes the governing invariant, or requires a new framework merely to adopt the idea.

## Independent primary-source checks

These live reads crosschecked the adoption ledgers. Reading publisher accounts is not a reproduction of their outcomes. No copyrighted article body or diagrams were saved.

- **Result publication:** complete main prose of [Spotify's archive account](https://engineering.atspotify.com/2026/3/inside-the-archive-2025-wrapped), including lessons/credits; architecture image not decoded. Selected current [Bigtable routing sections](https://docs.cloud.google.com/bigtable/docs/routing) corroborate row-operation atomicity, absent cross-row transactions, eventual multi-cluster consistency and row-affinity failover limits. This is a concrete crosscheck, not identification of Spotify's store.
- **Partitioning/movement:** complete substantive prose of [Meta's Shard Manager account](https://engineering.fb.com/2020/08/24/production-engineering/scaling-services-with-shard-manager/); selected strategy, table/index and roadmap sections of [Yugabyte's historical article](https://www.yugabyte.com/blog/four-data-sharding-strategies-we-analyzed-in-building-a-distributed-sql-database/). Current [sharding](https://docs.yugabyte.com/stable/architecture/docdb-sharding/sharding/) and [tablet-splitting](https://docs.yugabyte.com/stable/architecture/docdb-sharding/tablet-splitting/) sections corroborate YSQL/YCQL differences, initial placement, automatic splitting, compaction cost and colocation limits. The [ZooKeeper Sessions section](https://zookeeper.apache.org/doc/current/zookeeperProgrammers.html) confirms delayed notification to an expired disconnected client. No current public Shard Manager API was established.
- **Configuration distribution:** independent delegated complete substantive read of [Datadog's account](https://www.datadoghq.com/blog/engineering/scaling-config-delivery-containers/), challenge through lessons/future work; diagrams interpreted through prose, pixels not inspected. Selected official [Kafka 4.3 delivery](https://kafka.apache.org/43/design/design/#message-delivery-semantics) and [compaction](https://kafka.apache.org/43/design/design/#what-guarantees-does-log-compaction-provide) sections support external-output/offset cooperation and deletion-retention catch-up limits. This does not validate an application's snapshot protocol or an installed Kafka version.
- **Boundary rehearsal:** independent delegated complete main-body read of [Sentry's simulation account](https://blog.sentry.io/removing-risk-from-our-multiregion-design-with-simulations/), including dual-mode tests, diagnostic/CI costs and branches missed until staging; diagrams not measured. Selected [Django 5.2 routing/cross-database sections](https://docs.djangoproject.com/en/5.2/topics/db/multi-db/#cross-database-relations) corroborate the selected framework's relationship restrictions, not every datastore's behavior.
- **State models:** complete substantive prose/model/counterexamples of [Trail of Bits' historical Echidna account](https://blog.trailofbits.com/2018/05/03/state-machine-testing-with-echidna/). Code and falsifying histories resolve its contradictory locked/unlocked sentence. Selected [Hypothesis stateful sections](https://hypothesis.readthedocs.io/en/latest/stateful.html), displaying 6.168.3, corroborate independent-model comparison, bundles, initialization, preconditions and after-step invariants. Historical tool commands were not executed.

## Checks and remaining evidence limits

- All 15 adoption-file snapshots remained unchanged between content review and final hash capture.
- All 30 relative Markdown links found across those files resolve within their standalone skill packages. External URLs were checked only where listed in the primary-source reads above.
- `git diff --check` passed for the tracked reviewed paths. Separate raw-file checks covered the untracked new references: no trailing whitespace, unresolved conflict markers, or missing final newline across all 15 files.
- Each of the five entry points has frontmatter with its matching package name and a nonempty description. This was a simple structural check, not a complete YAML/schema validation.
- No model requests, vendor runtime experiments, production load tests, fault injections, or acceptance scenarios were executed. The additions explicitly retain these as proposed project checks. This review assesses source fidelity, placement and reviewable instructions; it does not establish agent behavior or implementation safety.

## Exact reviewed files

Paths are relative to `$HOME/Documents/ChatGPT/skills`. SHA256 covers complete file bytes, including context not included in the scoped verdict.

| File | SHA256 |
| --- | --- |
| `skills/engineering/microservice-data/SKILL.md` | `f51141e719352ff20e3f695a1e7795e31ce6344400fcc305064528aca1611529` |
| `skills/engineering/microservice-data/references/result-publication.md` | `8ee7a83f665721bf3dacfa0efada1f4fcc85f112413adf9dd4b951367d801a5c` |
| `skills/engineering/microservice-data/references/sources.md` | `6714debedf861bb3b4c29ec64779ac19d67f3fe3aef6a7d8cb84e331a6d1180e` |
| `skills/engineering/distributed-system-patterns/SKILL.md` | `1dc3293083751858555a7a520097c21f5b414a0661f7caf0b6cbb86bcc6e99d9` |
| `skills/engineering/distributed-system-patterns/references/partitioning-and-movement.md` | `8e44c377f61210096a94b44e06ac57cbc21850f6a8a384bb3c90cdecae763836` |
| `skills/engineering/distributed-system-patterns/references/sources.md` | `78d05a6c53bf2cf01bd9d4e9f28a9f6125a1cdec36ceb6aab2f9a7445310e133` |
| `skills/infrastructure/infrastructure-change-safety/SKILL.md` | `c244348dae866a3fe54890a788eb738e35586002bccd994877d91286fde444d4` |
| `skills/infrastructure/infrastructure-change-safety/references/configuration-distribution.md` | `1253f28fe4f75613ba5f8d316f537cf83c17410b268cfbfb34df97b5a9e4ccff` |
| `skills/infrastructure/infrastructure-change-safety/references/sources.md` | `a451c2e28e37693cf6ad01003bf55dc2910716a909926b28dc668195d7823e4e` |
| `skills/engineering/microservice-extraction/SKILL.md` | `a0a4cd5c99f538c8c970d3e21dfac6af5355c7096bd34c56cae1d9e75c91c562` |
| `skills/engineering/microservice-extraction/references/boundary-rehearsal.md` | `2d2fff965ba1b5f31568b30bb8f36e50ed535625d20f3a9e3790baf0cb9d9fb7` |
| `skills/engineering/microservice-extraction/references/sources.md` | `e6a6fcb54be0a6b7de8beb6c660e8a5a52a77e518da178f6b2bfd10664780525` |
| `skills/testing/failure-oriented-testing/SKILL.md` | `c7683e8c2ba99b0e639ec3a2b9c326b4f9346cc751f06f56124d62123d88ba67` |
| `skills/testing/failure-oriented-testing/references/state-models.md` | `6cecac80a2017cdeffcc378af84f60586e68a081d8d1a0cfb33df88e26bdc1da` |
| `skills/testing/failure-oriented-testing/references/sources.md` | `11bb3eb8ff562bbecc44986164f722650619a6fe465f669ef4e4996b50e73166` |
| `skills/engineering/microservice-data/references/projections.md` | `e2bd2d610406cebd21fbd973d400cc846d227910218d7d7d2b8d768a3af2076a` |
| `skills/engineering/distributed-system-patterns/references/serving.md` | `d9190838824f05eaace2b884570c2e668d6d2fef57c77d9743bc2190be33c015` |
| `skills/testing/failure-oriented-testing/references/generated-inputs.md` | `b6b975947b0e0c401d63ac9ea5855ca8c17e4bc7c9684346f7cc3c9eba40d902` |
| `skills/testing/failure-oriented-testing/references/fault-histories.md` | `2acd49e69bca0dc3426ad805794d2cdf0c5770bdc1e974e444f0b2475bce0a4c` |
| `skills/infrastructure/infrastructure-change-safety/references/rollout.md` | `6bf253f6f1dd281fa4c17402f27cc5ca803f851084f585e21acab39a2accbafc` |
| `skills/infrastructure/infrastructure-change-safety/references/terraform-state.md` | `9736c10f6162ca50d6ff5a14123f613d3f1c0cac0fa5b033f4acb3ea328ca78c` |
| `skills/engineering/microservice-extraction/references/cutover.md` | `d8142a85874e680afa291afae2e8b055e29b72042742d479b0f5e20f43e786fd` |
| `skills/engineering/microservice-extraction/references/data-transition.md` | `b74e27ae1983e6a7dc03aa5fe12fc8f1d7c33b9af61bfe255d7b0dbc45dcca70` |
