# Additional article research

The user requested more article research after the first toolkit release. This
pass began at 11:57:35 UTC on 29 September 2026, within the original eight-hour
limit. It adds **17 complete article-text reads across six concerns** to the
original 24. The 60-publisher survey and 14 book-access records are unchanged.
Reading scope, source ownership, current-documentation checks and applicability
limits are recorded per source; linked images, videos and entire documentation
sites are not implicitly counted as read.

| Concern | New articles | Useful addition | Source records |
| --- | ---: | --- | --- |
| Worker rollouts | 3 | Confirm protection before accepting work; distinguish deployment completion from retirement of protected old tasks | [Findings](worker-rollouts.md), [ledger](worker-rollouts.json) |
| Cache consistency | 3 | State the write acknowledgement contract; preserve deletes across snapshot/live-stream handoff and restart | [Findings](cache-consistency.md), [ledger](cache-consistency.json) |
| Messaging and recovery | 3 | Qualify offsets by their log; validate translation and ownership before regional replay; account for stranded execution reservations | [Findings](messaging-recovery.md), [ledger](messaging-recovery.json) |
| Cancellation and ownership | 3 | Test admission grant/cancellation boundaries, Go send-operand evaluation, and owned Node stream teardown | [Findings](cancellation-ownership.md), [ledger](cancellation-ownership.json) |
| Failure evidence | 3 | Separate random faults from a declared healed phase with a measurable progress deadline; verify recovery inputs and failure notifications | [Findings](failure-evidence.md), [ledger](failure-evidence.json) |
| Protocol operations | 2 | Enforce authority across a composed tool read/publication path and prevent bypass of a mandatory gateway | [Findings](protocol-operations.md), [ledger](protocol-operations.json) |

## Adoption

The additions update nine existing packages: `graceful-draining`,
`concurrency-correctness`, `messaging-reliability`, `python-backend`,
`typescript-backend`, `go-backend`, `failure-oriented-testing`,
`recovery-validation`, and `mcp-engineering`. Public skill names, native roles,
workflow names, protocol pins and model inheritance remain stable. The worker
rollout workflow also makes post-deployment retirement responsibility explicit.
Detailed
advice is conditional reference material; the recovery entrypoint adds a short
route for artifact provenance and cold recovery capacity.

Four focused references carry the larger additions:

- [Projection rebuilds](../../../skills/engineering/concurrency-correctness/references/projection-rebuild.md)
- [Owned Node streams](../../../skills/languages/typescript-backend/references/node-streams.md)
- [Tool data flow](../../../skills/engineering/mcp-engineering/references/tool-dataflow.md)
- [Recovery inputs](../../../skills/engineering/recovery-validation/references/recovery-inputs.md)

Company accounts supply failure mechanisms and examples, not universal defaults.
For example, an ECS successful deployment can retain old protected tasks under
the specified success criteria; it does not prove their jobs finished. An active
target Kafka consumer group changes offset-sync behavior, while custom aggregate
logs require their own verified translation. A Node stream observer's abort does
not imply ownership of the underlying stream. These distinctions are retained
instead of flattening them into generic shutdown, retry or cancellation rules.

## Review and evaluation

Three reviewers independently checked the research and adopted instructions:
[worker/cache](review-worker-cache.md),
[messaging/failure/recovery](review-messaging-failure.md), and
[language/protocol](review-language-protocol.md). Their records identify the
reviewed files and hashes. A research proposal is not an executed experiment.

The [five additional native cases](../../../evals/engineering-toolkit/extension-fixtures/README.md)
cover owned streams, snapshot/delete ordering, protected worker retirement,
regional offset translation, and composed tool authority. They use separate
fixtures and preserve the original eight workflows' evaluation archive. Author
calibration establishes useful broken and repaired controls. The
[executed archive](../../../evals/engineering-toolkit/runs/2026-09-29/native-extension/README.md)
contains six attempts across the five cases: latest task/native outcomes pass,
with strict isolation still partial. The initial worker result omitted the
operational drain owner; its [correction and rerun](workflow-review-correction.md)
remain separate from that original score.

The [ownership examples](../../../examples/ownership-boundaries/README.md)
exercise public Python, Go and Node runtime contracts with finite local probes.
Their evidence does not claim cloud, broker, network or crash-durability testing.
The [independent review](review-ownership-probes.md) reproduced and closed two
harness defects before the final run: optimized Python could remove assertions,
and a terminated process leader could leave a descendant alive. The final
independent run observed three passing contracts and four expected unsafe
controls, with zero failures. Unavailable group-disappearance evidence is reported
as unconfirmed cleanup instead of being converted to a success claim.

The [both-host installation record after workflow review](installation-after-workflow-review.json)
covers the complete
15-agent, eight-workflow selection: 319 managed files plus the manifest, with all
320 operations unchanged on repeated installation. This is a filesystem check;
it does not substitute for native execution.

The original [release verification](../verification.md) remains evidence for its
recorded source checkpoint. Its skill scores do not automatically validate these
later reference changes. Claude native behavior remains unavailable until the
existing authentication problem is resolved; no successful Claude run is inferred
from adapter generation or loader discovery.

## Subsequent user-requested additions

The completed 17-article pass above remains a historical checkpoint. The user then
selected technical deprecation, supplied two SQLAlchemy articles and Discord's
message-storage account, and requested overlooked cache-design pitfalls. The
pasted Redis recipes were treated as claims to check, not source authority. The
user explicitly declined a separate Redis skill or agent.

| Addition | Adopted guidance and evidence |
| --- | --- |
| Technical deprecation | [Research](technical-deprecation.md), [independent source review](review-technical-deprecation.md), and [evaluation-driven correction](deprecation-evaluation-correction.md) |
| SQLAlchemy sessions and query tests | [Article and documentation review](sqlalchemy-gotchas.md), [PostgreSQL/ASGI examples](../../../examples/sqlalchemy-gotchas/README.md), [independent rerun](review-sqlalchemy-gotchas.md) |
| Discord storage experience | [Hot partitions, shared reads, and migration completeness](discord-message-storage.md); historical performance is not a portable guarantee |
| Cache miss overload | [Expiry, negatives, Bloom generations, enumeration, and lease boundaries](cache-load-protection.md), [source review](review-cache-and-storage.md), [bounded examples](../../../examples/cache-load-protection/README.md) |
| High-read/high-write cache design | [Corrected claims and source scopes](redis-high-throughput.md), covering acknowledgement, backlog, invalidation, replication, memory policy, and command work |

The two Medium articles and Discord article were read through their accessible
main text. Other records distinguish full article text, selected paper sections,
current documentation sections, and reused sources. The original publisher and
book inventories are not inflated by repeated sources. Runtime and model
observations remain separate from proposed verification schedules.

Follow-up evidence: [deprecation evaluations](../../../evals/engineering-toolkit/runs/2026-09-29/technical-deprecation/README.md), [cache-design source review](review-cache-design.md), [cache runtime review](review-cache-load-probes.md), and [both-host installation](installation-followup.json).
