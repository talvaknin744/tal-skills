# Skill adoption index

Reviewed 2026-10-15. Four improvements are implemented and have independently
scored native review evidence. The next useful work is mostly conditional detail
inside existing skills. This index reconciles the [original opportunities](../../skill-opportunities.md),
[r01 findings](../r01/skill-findings.md), [registry extension](../r06/schema-registry-identity.md)
and [FieldMask reading](../r09/netflix-fieldmask-reading.md) with current canonical
packages. Earlier notes retain their original proposal status and evidence.
No instructions, cases, scores or adapters changed for this index.

## Implemented and evaluated

| Current owner | Implemented distinction and primary basis | Exact native review scope |
| --- | --- | --- |
| [agent-evaluation](../../../../../skills/engineering/agent-evaluation/SKILL.md) | Authoritative effects versus completion words, calibrated criterion graders, clean repeated trials and honest reliability or cost denominators. [Anthropic agent evaluations](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | [Final source03 review](../../../../../evals/company-blog-refresh/runs/2026-10-14/independent-review.md#repaired-agent-candidate-and-final-source-association): seven repaired candidate attempts, three per positive and one nontrigger. Every criterion passes; each positive loads the body three times, the nontrigger zero times |
| [performance-diagnosis](../../../../../skills/performance/performance-diagnosis/references/distributed-paths.md) | Required causal paths, incomplete spans and selected trace cohorts cannot automatically establish endpoint population latency. [Uber CRISP](https://www.uber.com/us/en/blog/crisp-critical-path-analysis-for-microservice-architectures/), [OpenTelemetry sampling](https://opentelemetry.io/docs/concepts/sampling/) | Same source03 review: six selected cases, three original and three trace extension cases, one governing attempt each. All rubric criteria pass. The container regression uses a separately retained retry with native web disabled |
| [database-performance](../../../../../skills/performance/database-performance/references/pgbouncer-compatibility.md) | Transaction pooling changes backend ownership; protocol preparation differs from SQL preparation and session state. [PgBouncer feature contract](https://www.pgbouncer.org/features.html) | Same source03 review: six selected cases, three original and three pooler extension cases, one governing attempt each. All rubric criteria pass. Lock and cardinality regressions use separately retained retries with native web disabled |
| [messaging-reliability](../../../../../skills/engineering/messaging-reliability/references/schema-registry-identity.md) | Registry, context, writer identifiers and recursive references must preserve retained decoding and business meaning before affected admission. [Confluent contexts](https://docs.confluent.io/platform/current/schema-registry/schema-contexts-cp.html), [migration contracts](https://docs.confluent.io/platform/current/schema-registry/installation/migrate.html) | [Final source06 review](../../../../../evals/company-blog-refresh/runs/2026-10-15/independent-review-source06-v1.md): ten selected attempts, three original regressions and seven new attempts. All 50 criteria pass, including 34 critical criteria. Each new positive loads the body three times; both nontriggers load it zero times |

The source03 matrix has 19 governing passes, 56 critical passes and full major
scores. Source06 has ten governing messaging passes. Their current package hashes
still match the reviewed bytes. The [source06 identity](../../../../../evals/company-blog-refresh/runs/2026-10-15/identities/source-final-06.json)
binds canonical source digest
`4fe67a4809f439958f30ba02fc281064643f4e289ef184ad80f95cdd94545eff`.
The source03 observations cover unchanged packages carried into that snapshot;
the source06 campaign covers messaging, not a fresh full catalog campaign.

These are selected Codex rubric results. Most runs identify Codex CLI 0.160.1
and inherited `gpt-6.1-sol` with `xhigh`; the first correlated trace run lacks
model, host and verified catalog metadata. Every retained `case_compliant` value
is false because filesystem, inherited guidance and MCP or shell network isolation
are unenforced. Earlier partials and actual web deviations remain in the linked
reviews. Current Claude execution, marketplace installation, live pooler or
registry behavior and production guarantees remain unestablished. The reviews
use one independent grader and no blinded randomized causal comparison.

## Next additions to current owners

These priorities are proposed scope, not implemented or behaviorally evaluated.

| Priority and owner | Distinct failure mechanism and source status | Focused next evidence |
| --- | --- | --- |
| 1. `microservice-integration`, compatibility reference | FieldMask symbolic paths can break after a field rename; an old partial update can erase a newly stored field. Two [Netflix articles](https://netflixtechblog.com/practical-api-design-at-netflix-part-2-protobuf-fieldmask-for-mutation-operations-2e75e1d230e4) were deliberately read, with [Protobuf](https://protobuf.dev/reference/protobuf/google.protobuf/#field-mask), [AIP 134](https://google.aip.dev/134) and [AIP 161](https://google.aip.dev/161) contract checks. This remains research only | Preserve an unknown stored field, distinguish explicit reset from unchanged state, test old renamed paths and the actual provider's omitted mask convention. AIP 134 differs from the Netflix example, so a universal mandatory mask rule would be wrong |
| 2. `microservice-integration`, compatibility reference | Shared cached bytes can use another consumer's negotiated capabilities despite correct data and query identity. [Cloudflare Hyperdrive MySQL](https://blog.cloudflare.com/hyperdrive-mysql/) main body was read; its runtime was not reproduced | Warm under producer A and read with consumer B, then reverse them; test old retained bytes during rollout. Decide format partitioning or normalization from the actual codec contract |
| 3. `performance-diagnosis`, runtime reference | Low application CPU can hide external security scanning on the startup path. [JetBrains investigation](https://blog.jetbrains.com/dotnet/2026/09/09/why-rider-and-resharper-were-slow-to-start-and-how-microsoft-helped-fix-the-problem/) and tool guidance were read, with [Microsoft analyzer](https://learn.microsoft.com/en-us/defender-endpoint/performance-analyzer-reference) checks | Separate overlapping scan wall time, external process CPU and application elapsed time. Compare consistent cold state and policy revisions; test a label only nontrigger. Diagnosis does not authorize a security exclusion |
| 4. `distributed-system-patterns`, serving reference; `overload-control` for admission | A retry outside a tenant's worker subset defeats blast radius containment. [AWS shuffle sharding](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding) prose was read; deployment behavior and diagram pixels were not verified | Poison a subset, combine harmful tenants and force retry escape. Check real failure domains and survivor capacity before treating virtual subsets as isolation |
| 5. `agent-evaluation`, detector validity cases first | A name in one log event and a command in another can falsely establish invocation. [Pinterest testing article](https://medium.com/pinterest-engineering/an-engineers-guide-to-better-ai-skills-implementing-a-testing-process-to-optimize-agent-a000c9c9abcd) text was read; its results image and harness were not verified | Correlate the argument and result within the actual structured event, reject quoted markers, and leave truncated capture unknown. Add instructions only if this exposes a gap in existing grader validation |

## Held source and behavior gaps

The broader opportunity map has useful leads that need narrower evidence before
adoption. [Docker Sandbox Kit](https://github.com/docker/sandbox-kit-spec) normative
capability pages and conformance behavior were not read or tested; executable
authority ownership remains unresolved. `mcp-engineering` is the nearest current
owner, with no new sandbox package established.

`stream-processing-design` can own CDC transaction completeness, but the retained
[RisingWave account](https://risingwave.com/blog/atomic-cdc-transactions-in-risingwave/)
has unresolved barrier prose contradictions. Verify the implementation and current
sink contract before adopting its atomicity claim. `messaging-reliability` can
own share consumer dispositions, but the [Confluent article](https://www.confluent.io/blog/kafka-queue-semantics-share-consumer-ga/)
conflicts with [current acknowledgement guidance](https://docs.confluent.io/cloud/current/client-apps/share-consumers.html).
Installed client evidence and bounded broker tests are still missing.

## Adoption gate

Every instruction addition needs the owner's preserved old regressions plus a
positive case, changed boundary rejection and ordinary nontrigger, with raw inputs
separate from private criteria. For FieldMask and cached representations, preserve
`mixed-version-response`, `event-meaning-drift` and
`local-json-pretty-print-nontrigger`. The other selected existing cases and proposed
boundaries are in the linked opportunity and r01 maps. Freeze the revised package,
run the selected cases, score independently and retain unsuccessful attempts
before making capability claims, following the [change contract](../../../../../CONTRIBUTING.md#changing-skills-agents-or-workflows).
Source capture, deliberate reading, corpus checks and native behavior remain
different evidence. This index adds no new source retrieval or native trial.
