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
workflow names, protocol pins and model inheritance remain stable. Detailed
advice is conditional reference material; the recovery entrypoint adds a short
route for artifact provenance and cold recovery capacity.

Four focused references carry the larger additions:

- [Projection rebuilds](../../../../skills/engineering/concurrency-correctness/references/projection-rebuild.md)
- [Owned Node streams](../../../../skills/languages/typescript-backend/references/node-streams.md)
- [Tool data flow](../../../../skills/protocols/mcp-engineering/references/tool-dataflow.md)
- [Recovery inputs](../../../../skills/reliability/recovery-validation/references/recovery-inputs.md)

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

The [five additional native cases](../../../../evals/engineering-toolkit/extension-fixtures/README.md)
cover owned streams, snapshot/delete ordering, protected worker retirement,
regional offset translation, and composed tool authority. They use separate
fixtures and preserve the original eight workflows' evaluation archive. Author
calibration establishes useful broken and repaired controls; independent scores
of actual native candidates are reported separately when completed.

The [ownership examples](../../../../examples/ownership-boundaries/README.md)
exercise public Python, Go and Node runtime contracts with finite local probes.
Their evidence does not claim cloud, broker, network or crash-durability testing.
The [independent review](review-ownership-probes.md) reproduced and closed two
harness defects before the final run: optimized Python could remove assertions,
and a terminated process leader could leave a descendant alive. The final
independent run observed three passing contracts and four expected unsafe
controls, with zero failures. Unavailable group-disappearance evidence is reported
as unconfirmed cleanup instead of being converted to a success claim.

The [both-host installation record](installation.json) covers the complete
15-agent, eight-workflow selection: 319 managed files plus the manifest, with all
320 operations unchanged on repeated installation. This is a filesystem check;
it does not substitute for native execution.

The original [release verification](../verification.md) remains evidence for its
recorded source checkpoint. Its skill scores do not automatically validate these
later reference changes. Claude native behavior remains unavailable until the
existing authentication problem is resolved; no successful Claude run is inferred
from adapter generation or loader discovery.
