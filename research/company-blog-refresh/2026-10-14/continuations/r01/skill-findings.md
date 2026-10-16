# Continuation r01 skill findings

Research date: 2026-10-14.

The recovered sources justify two narrow reference candidates: external host
activity in performance diagnosis, and schema registry identity in message replay
and recovery. Pinterest's skill invocation article chiefly corroborates the
already evaluated `agent-evaluation` package. Its detector heuristic supplies a
useful new validity case, without establishing a need for another skill.

This report is additive. The original `skill-opportunities.md`, its selected
instruction changes, existing cases and evaluation results remain intact. No
instruction, adapter, case, rubric or scored trial changed in this workstream.
Proposed cases below were not executed. Vendor measurements were not reproduced.

## Inspected current candidate

The gap comparison used current canonical bytes after the selected company blog
refresh improvements. Source reading is not evidence that the original candidate
still lacks those selected improvements.

| Current canonical file | SHA256 at inspection |
| --- | --- |
| `skills/engineering/agent-evaluation/SKILL.md` | `af55864cab4be8fbb9b69acef207f692df2ccc838f817429bd21afb24af036d5` |
| `skills/engineering/agent-evaluation/references/comparison-metrics.md` | `5ceee0d1c37fcf665957244c090278151118925686155fad0bb8cb6d8305f256` |
| `skills/performance/performance-diagnosis/SKILL.md` | `0313f7ba81f58079da5859d841b3b243d192cedbf7c91014fa6d1d6851c7f622` |
| `skills/performance/performance-diagnosis/references/runtime.md` | `080b75a9c29759e0d20cc7689c0d72c5c768fd70c8805b7885a53f018088a5ca` |
| `skills/engineering/messaging-reliability/references/ordering-and-replay.md` | `0c298ebc53279fe31757f580941f46bc740242afe76dfd5bafa2314126209270` |
| `skills/engineering/recovery-validation/SKILL.md` | `63fdb48d053f92c4419e451ebed715977545c56c71e8447dd1afa26531b20ca0` |

The unchanged original opportunity report digest at this inspection was
`6490ba3a6eee331964b1a7d21f452f508a93e10a3092b9e7e0989dc025c09381`.
These hashes describe inspected files, not a new evaluated instruction candidate.

## Mechanism and ownership decisions

| Finding | Already covered behavior | Distinct candidate and owner |
| --- | --- | --- |
| Startup delay owned outside the application process | `performance-diagnosis` already separates CPU execution, blocked time, effective resource limits, cache state and observer overhead | Conditional external host actor branch in `references/runtime.md`, align the application's startup boundary with an external actor's observations and retain CPU versus elapsed scan semantics |
| Skill invocation detector validity | `agent-evaluation` already separates observed invocation from task success, requires positive and nontrigger cases, validates graders and compares isolated matched trials | A focused case for structured event correlation and incomplete invocation evidence, possible conditional detector guidance if that case exposes an agent behavior gap |
| Restored or replicated schema identity | `messaging-reliability` already covers historical payload eras, compatibility transitivity and cross cluster offset identity. `recovery-validation` already restores dependencies and gates usable history | Conditional schema registry branch in replay guidance, qualify decoder lookup identity by registry and context and verify original wire ID mappings before client admission |

## External host activity during startup

[JetBrains' startup investigation](https://blog.jetbrains.com/dotnet/2026/09/09/why-rider-and-resharper-were-slow-to-start-and-how-microsoft-helped-fix-the-problem/)
describes an application architecture change exposing more startup work to
Microsoft Defender. The team correlated external scan events with its startup
measurements and reset its VM between cold start runs. Process placement,
installation permissions and Defender revision influenced the observed workload.
This is a useful failure mechanism, the article's measured improvements remain
vendor observations.

The [linked tool README](https://github.com/JetBrains/defender_performance_tool)
provides an important qualification. ETW scan durations measure elapsed scan
time. The separate CPU mode measures Defender process CPU consumption and cannot
identify the scanned process or file. The two can differ under competing work.
[Microsoft's analyzer reference](https://learn.microsoft.com/en-us/defender-endpoint/performance-analyzer-reference)
corroborates the scan recording and attributed report surfaces, specifies the
recording privilege requirement, and states that the analyzer does not itself
recommend exclusions.

The proposed branch would activate only when an actual latency investigation
implicates external host work, such as scanning, filesystem filters or a security
agent. Inventory the application's own work and external processes sharing its
startup path. Correlate intervals and affected assets instead of adding every
overlapping scan duration to startup latency. State what a CPU counter can and
cannot attribute. Keep application startup time, external elapsed work and external
CPU cost as separate observations.

Hold binary, data, installation permissions, effective host policy and relevant
security revisions fixed when comparing the intended variable. Declare cold versus
warm cache state and reset the relevant state consistently. A process move can
change the external policy workload even when application code is unchanged.
Measurement does not prove that an exclusion or security policy change is the
correct repair. This conditional diagnosis belongs to the existing performance
owner and does not justify a general desktop installation package.

| Proposed or preserved case | Observable distinction |
| --- | --- |
| New positive, `r01-host-owned-startup` | Low application CPU accompanies high startup wall time and matching external scan intervals. Localize the supported external contribution, distinguish attribution from correlation, and compare cold start states |
| New failure boundary, `r01-scan-wall-versus-cpu` | External scan wall intervals overlap and external CPU has no file attribution. Reject summing them as endpoint delay or attributing all process CPU to the application |
| New nontrigger, `r01-startup-label-only` | A request only changes a startup dashboard label, keep the wording edit bounded |
| Existing regressions | `performance-diagnosis/held-pool`, `performance-diagnosis/throttled-container`, `performance-diagnosis/format-only` |
| Selected extension preservation | `evals/performance-diagnosis/cases-v2-trace-evidence.json`, preserve its current sampling and causal path criteria unchanged |

## Pinterest invocation evaluation

[Pinterest's testing article](https://medium.com/pinterest-engineering/an-engineers-guide-to-better-ai-skills-implementing-a-testing-process-to-optimize-agent-a000c9c9abcd)
reports an internal skill invocation study using positive and negative prompts,
multiple suite runs, and streamed logs. It includes explicitly requested loading
and terse implicit domain prompts. Its tested model and harness combinations,
reported improvements and small prompt sets do not establish current behavior in
another host. The result table appears as an image in the recovered RSS field and
was not independently decoded.

The current `agent-evaluation` skill already owns almost every useful general
lesson: activation and nontrigger partitions, repeated comparable trials,
candidate and host identities, grader sensitivity, observed call capture, and
invocation separate from task correctness. Neither aggressive wording nor the
article's numerical pass rates justify replacing this repository's descriptions,
adding blanket mandatory invocation or transferring historical scores.

The concrete additional seam is the displayed detector. It can report invocation
when one log location contains a Skill name and another contains the target
command. That conjunction does not prove both belong to the same structured tool
event. A quoted prompt or diagnostic string can also contain the text without an
actual call. This is an authored counterexample to the displayed heuristic, it
was not run against the vendor harness.

A detector validity case should correlate the target skill argument with its
actual call event and available execution result. Distinguish availability,
invocation, successful loading and task outcome when the host exposes those
states. If output is truncated or the host event schema is unknown, lack of a
matching marker is incomplete evidence rather than a proven absence. An explicit
load case is a harness control, it does not establish automatic routing for an
implicit request. These distinctions can be tested without importing version
dependent CLI commands into the package.

| Proposed or preserved case | Observable distinction |
| --- | --- |
| New positive, `r01-correlated-skill-event` | A complete structured event invokes the target skill while the task outcome fails. Report invocation observed and outcome failed independently |
| New failure boundary, `r01-cross-event-marker` | Target name occurs only in input text or belongs to another event. The invocation oracle must reject the false positive and preserve the raw log |
| New failure boundary, `r01-incomplete-invocation-trace` | A truncated trace cannot establish target invocation or its absence. Report an explicit evidence gap and the required capture |
| New nontrigger, `r01-ordinary-helper-log` | Review an ordinary deterministic formatter assertion, no AI agent or invocation campaign applies |
| Existing regressions | `agent-evaluation/refund-success-without-effect`, `agent-evaluation/biased-repeated-trial-report`, `agent-evaluation/pure-helper-assertion` |

At present this is source corroboration plus a proposed detector validity case.
An instruction addition is warranted only if evaluation shows that the current
grader validation guidance fails this specific boundary.

## Schema registry identity during replay and recovery

The recovered [Schema Registry pitfalls article](https://www.confluent.io/blog/17-ways-to-mess-up-self-managed-schema-registry/)
explains how missing registry metadata or a premature restart can invalidate the
mapping that retained messages need. Its suggestion of one global registry is a
historical design recommendation. The later [data sharing article](https://www.confluent.io/blog/data-sharing-patterns-with-confluent-schema-registry/)
describes collision handling across independent registries and introduces schema
contexts, with historical preview and tool limitations. Neither article alone
supplies today's migration contract.

Current [Schema Linking context documentation](https://docs.confluent.io/platform/current/schema-registry/schema-linking-cp.html)
states that subject names and schema IDs are unique within a context and that
different contexts can reuse the same numeric ID for different schemas. Client
context selection controls the lookup. Current [deployment and restore guidance](https://docs.confluent.io/platform/current/schema-registry/installation/deployment.html)
identifies the metadata log as holding schemas, subject and version information,
ID metadata and compatibility settings, and specifies raw bytes for a backup
method. This corroborates a dependency beyond the restored business topic.

Existing historical schema guidance correctly tests old payloads and domain
meaning, but does not explicitly qualify decoder ID authority. Existing cross
cluster replay guidance qualifies log positions, that does not automatically
qualify the schema lookup a serializer or deserializer performs. A retained
record can reference the same number that now resolves to another schema, or no
schema, in the destination. A green data topic restore or a healthy registry API
does not establish that mapping.

The proposed conditional replay reference would inventory source and destination
registry identity, context selection, original schema IDs, referenced schemas,
subject versions and relevant compatibility settings. Preserve the required
mapping when using an import or linking protocol, or explicitly prove a supported
translation. Test representative retained wire records through the actual client
lookup path after restoration. Keep incompatible or absent mappings unresolved
before allowing registration or consumer resumption to alter the restored state.
Use the installed product's migration, ownership and mode contracts, rather than
copying historical defaults or recommending one registry topology universally.

The detailed decoder branch belongs to `messaging-reliability`. Recovery acceptance
remains owned by `recovery-validation`, whose existing dependency and usable
history gates are already the appropriate higher level contract. This avoids
another restore skill or a duplicated general disaster recovery procedure.

| Proposed or preserved case | Observable distinction |
| --- | --- |
| New positive, `r01-contextual-schema-replay` | Two contexts each contain ID 7 with different schemas. Retained records must resolve through their intended context and preserve business meaning |
| New failure boundary, `r01-registry-before-metadata-restore` | Business topic restores successfully but registry IDs or references are missing, or new registration changes the mapping before restore completes. Acceptance stays failed until the preserved mapping and client decode are verified |
| New nontrigger, `r01-local-json-format` | Pretty print a local JSON object that has no broker, external registry or recovery claim |
| Messaging regressions | `messaging-reliability/commit-before-ack`, `messaging-reliability/reordered-account-events`, `messaging-reliability/local-observer-callback` |
| Recovery boundary regressions | `recovery-validation/restored-order-ledger`, `recovery-validation/expired-input-history`, `recovery-validation/backup-label` |

## Primary reading receipts and scope

Four primary substantive article bodies were independently read for this report.
The JetBrains article was a repeated independent reading of the continuation
owner's deliberate reading. Pinterest invocation and the two recovered Confluent
texts have new local reading scopes. These are four reading observations, not
four newly retrieved articles or a claim to read every recovered body.

Raw reading scopes and new document responses remain in the external namespace
`tal-skills-blog-crawl-resume-2026-10-14-r01`, member
`skill-findings-readings/source-reading-scopes.json`, SHA256
`474fed92f3360b5232d7973f68a4e32b7015b21e25831128289168a5a8ba83fd`.
The record retains one incorrect guessed GitHub path lookup that returned 404,
followed by the correct repository URL obtained from the actual article links.
That failed path is not cited as source evidence.

| Primary article | Available body SHA256 | Bound source response SHA256 |
| --- | --- | --- |
| [JetBrains external startup investigation](https://blog.jetbrains.com/dotnet/2026/09/09/why-rider-and-resharper-were-slow-to-start-and-how-microsoft-helped-fix-the-problem/) | `94a5bf4fda891b6e407bf89c9692eecdcb4cb53b8da3464e4f6bebaf5e3b0585` | `77d64432f6bd8574efa0e552a16bb0c72fa3fabe8ebd54a0ed93dd229ba72512` |
| [Pinterest skill invocation testing](https://medium.com/pinterest-engineering/an-engineers-guide-to-better-ai-skills-implementing-a-testing-process-to-optimize-agent-a000c9c9abcd) | `3f85fad7bc92f3f25e782de784a0e93c5f1effac7b2a7ce664c967f74eb54234` | `fa50700d7197fb44ad40fdf1569631c320e6d715342469c3d03107b432cc387d` |
| [Confluent Schema Registry pitfalls](https://www.confluent.io/blog/17-ways-to-mess-up-self-managed-schema-registry/) | `537bf8834394ff14a98312e5ad2927e07c10bf6fc608674eb9259510772686a1` | `73a637e316d302312eb0558d9d02ccc18725fdee97b3d4fa4c1123aef3ca577f` |
| [Confluent data sharing patterns](https://www.confluent.io/blog/data-sharing-patterns-with-confluent-schema-registry/) | `5edf4d2781f7c685ef024ca94f66d16faabea13eeaa083380e9f519dae6f03a4` | `8dc84978d932b649ae65a6fb03afdc7451bef2c996c53434d1b7740db5692ae7` |

JetBrains and Pinterest bodies are publisher RSS HTML, the Confluent bodies are
available text extracted from exact original article page data. The continuation
receipts separately establish article identity. Current canonical HTML redirects
do not substitute for those original mappings. Complete available main prose and
shown code were read, image pixels, embedded videos and linked experiments were
not independently inspected or executed.

Four corroborating document or README responses were retrieved once through
ordinary public HTTP, all returned 200. Their body digests are preserved below,
with exact bytes and relative object paths in the external scope record.

| Corroborating source | Response SHA256 | Read scope |
| --- | --- | --- |
| [Microsoft analyzer reference](https://learn.microsoft.com/en-us/defender-endpoint/performance-analyzer-reference) | `9119a493766190fbbfba51bb513f403c433e1be88cdd9fc48cf0a64eead12426` | Recording and report description, privilege requirement, Raw output and exclusion caveat, parameter behavior not executed |
| [JetBrains tool README](https://github.com/JetBrains/defender_performance_tool) | `f5a773f53c544e805e897d696397de7e749b4c8f57bf64f806efe0e66fe67eec` | Complete README, ETW and CPU modes, attribution limits and cold start reset, mutable branch, tool not executed |
| [Confluent contexts](https://docs.confluent.io/platform/current/schema-registry/schema-linking-cp.html) | `44a6bf18f225d5d4e971f450c470140259cf080aae18ea6c5f12ff0866e22dd1` | Context ID scope, qualified subjects, base paths and client context selection, full exporter guide not read |
| [Confluent registry deployment](https://docs.confluent.io/platform/current/schema-registry/installation/deployment.html) | `b58143e0eeae4762af8a22a88ec4b47f320981547ac14ec2f09f7e473c02b0de` | Metadata source, compaction and backup or restore sections, no deployment or restore command executed |

Local checks verified the four selected body digests and retained document
responses. The four article source response digests were also verified, with
receipt `skill-findings-readings/source-validation.json`, SHA256
`75f77365d71901ff675d624b490953b229f3d0e12dc3625ecaf12cd2cf8de481`.
These are source integrity observations. No vendor performance test,
Windows host experiment, registry deployment, model trial, native host comparison
or independent behavior score was produced by this continuation research.

Before any instruction change, author a focused case and freeze a separate revised
candidate. Execute relevant preserved cases with the new positive, failure and
nontrigger cases, retain partial attempts and independently score criteria. Current
published evaluation results remain evidence for their exact existing candidates,
they do not transfer to these proposed additions.
