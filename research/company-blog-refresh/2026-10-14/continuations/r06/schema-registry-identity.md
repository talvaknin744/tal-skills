# Schema registry identity extension

Research and implementation date: 2026-10-15, Asia/Jerusalem.

The existing `messaging-reliability` package now has a conditional schema registry
identity reference for replay, migration and restore. It qualifies decoder
authority by the selected product, registry and context, follows the actual
client lookup path, preserves retained identifiers and schema references, and
gates affected registration or replay on metadata and representative decoded
business outcomes. No new package, invocation policy or public name was added.

This is a source candidate awaiting native behavioral trials and independent
scores. Packaging and source checks below do not establish agent behavior or
production recovery. Existing reports, evaluation cases, fixtures, rubrics,
historical scores and candidate pointers were not edited by this workstream.

## Identity and canonical change

The preserved before package is
`5931eb7e18945dc21b4bffcb5ea16f3310a78b356be6a40ea3769c3f86e81561`.
It matched the working package before editing. The three original cases and
their fixtures matched the retained baseline, and were checked again after the
canonical edit.

The source candidate is `messaging-registry-identity-source-r06-01`, package tree
SHA256 `e1c1a5f1300cbae8be83ea7f6e398c465d289cdae86837137f1277e1b5a82d2b`.
The digest follows the repository evaluation serialization: sorted relative
path, file SHA256 and mode records, serialized with JavaScript JSON.stringify.
The external snapshot retains all six package files. Subsequent relevant edits
need a new identity and checks, this record remains historical.

| Changed path | Exact behavior change |
| --- | --- |
| `skills/engineering/messaging-reliability/SKILL.md` | One conditional branch pointer for registry identifier dependent replay, migration or restore, frontmatter unchanged |
| `skills/engineering/messaging-reliability/references/ordering-and-replay.md` | One conditional pointer after historical schema compatibility, separates reader compatibility from correct identifier resolution |
| `skills/engineering/messaging-reliability/references/schema-registry-identity.md` | New local reference: actual decoder authority, retained ID/reference mapping, product import scope, representative decoding and gated admission |
| `skills/engineering/messaging-reliability/references/sources.md` | Additive dated official source scope, historical article attribution and unexecuted runtime limits |
| `docs/engineering/messaging-reliability.md` | One acceptance bullet describing registry dependent replay evidence |
| `.changeset/schema-registry-replay-identity.md` | Patch entry for the consumer visible conditional guidance |

The existing delivery and recovery reference and `agents/openai.yaml` remained
byte identical. Generated adapters, suite staging, current candidate pointer and
evaluation material remain owned by the integration and independent evaluation
workstreams. The new optional `recovery-validation` handoff uses its named skill
and a standalone local fallback, detailed broader recovery procedure stays with
that sibling.

## Source contracts reverified

[Confluent contexts](https://docs.confluent.io/platform/current/schema-registry/schema-contexts-cp.html)
qualify numeric ID and subject scope, the same ID can resolve differently in
two contexts. The [client FAQ](https://docs.confluent.io/platform/current/schema-registry/faqs-cp.html)
distinguishes explicit context paths and subject aware lookups, its language
statements are dated documentation rather than proof of each installed client.
The candidate therefore asks for the actual configured lookup and cache independent
verification, instead of assuming identical client support.

[Registry deployment guidance](https://docs.confluent.io/platform/current/schema-registry/installation/deployment.html)
identifies the schema metadata log and raw byte backup boundary.
[Migration guidance](https://docs.confluent.io/platform/current/schema-registry/installation/migrate.html)
distinguishes full registry migration into an empty destination from subject
import, with ID and subject preconditions. The [API reference](https://docs.confluent.io/platform/current/schema-registry/develop/api.html)
exposes mode scope and schema references. The candidate preserves these distinctions
without adopting a forced import, universal topology or exact command sequence.

[Serialization documentation](https://docs.confluent.io/platform/current/schema-registry/fundamentals/serdes-develop/index.html)
includes payload IDs and newer header GUIDs, with version dependent preservation
limits. The candidate asks which format the retained records actually use and
whether the route preserves required identifier metadata. It does not upgrade a
serializer or make a language wide SDK support claim.

The earlier [registry pitfalls](https://www.confluent.io/blog/17-ways-to-mess-up-self-managed-schema-registry/)
and [data sharing](https://www.confluent.io/blog/data-sharing-patterns-with-confluent-schema-registry/)
articles remain historical reading evidence from continuation r01. Their
2019 topology advice and 2021 preview labels were not promoted to current product
guarantees. Those original bodies and failed acquisition records were preserved,
not fetched again for this extension.

Six official document responses were fetched once through ordinary public HTTP,
all returned 200. No fresh document request failed. UTC receipt timestamps are
retained, their client local review date is 2026-10-15. Exact raw responses and
reading scopes remain outside the source tree. Current documentation is mutable,
no target registry deployment or installed SDK was exercised.

| Document | Response SHA256 | Actual reading scope |
| --- | --- | --- |
| [Context guide](https://docs.confluent.io/platform/current/schema-registry/schema-contexts-cp.html) | `0ca2e99e00d1d9886e63597628ef76e2b86bfec11f71046746ecc349a978adc6` | Complete substantive short guide, ID/subject scope, qualified subjects and explicit lookup path |
| [Client FAQ](https://docs.confluent.io/platform/current/schema-registry/faqs-cp.html) | `89c0ab8833970fd785c90820738d4105371cc4238fc80d0d8540b3b9cc774392` | Context consumption and schema linking ID preservation sections, full FAQ not read |
| [API reference](https://docs.confluent.io/platform/current/schema-registry/develop/api.html) | `0c8d376e7f365b82af1c0b44bd9be7d01bf89bf181e31592adf35f37149833c5` | ID lookups, context and subject mode scope, force qualification and reference fields, full manual not read |
| [Deployment](https://docs.confluent.io/platform/current/schema-registry/installation/deployment.html) | `b58143e0eeae4762af8a22a88ec4b47f320981547ac14ec2f09f7e473c02b0de` | Metadata source, durability and backup/restore sections |
| [Migration](https://docs.confluent.io/platform/current/schema-registry/installation/migrate.html) | `09da37a4922626de433a68efff6d19eeeb9ff3801ada49b50c219d9ad0740223` | Full registry versus subject preconditions, ID/version preservation and collision rejection, tutorial not executed |
| [Serialization](https://docs.confluent.io/platform/current/schema-registry/fundamentals/serdes-develop/index.html) | `a8d3fe50d83f9a5428092a91e30bf623e9d852c99de6f3c6904685685a8447a2` | Payload ID, header GUID, transition and header preservation limits, SDK examples not executed |

## Preservation and behavior map

The unchanged original corpus digest is
`86c1a8ca1e78b82f8814e37573110ca3057c453730c3f9ba9c304bf0ab6c018b`.
Original fixture tree equality was verified for `commit-before-ack`,
`reordered-account-events` and `local-observer-callback` against the frozen
baseline. Root will rerun these preserved cases against the revised candidate.
A retained corpus is not a passed regression run.

The new boundary is registry authority during retained record resolution.
Original acknowledgement atomicity, ordering, replay retention, schema meaning,
compatibility transitivity, business effect identity and local callback nontrigger
remain the established behavior. The new reference is reached only when registry
identifier dependent replay, migration or restore applies.

Independent case authoring is assigned separately. Planned new coverage includes
contextual ID collision, registry restore identity gaps and a local JSON format
nontrigger. Case identity, prompts, rubrics, native outcomes and independent scores
must come from that retained evaluation evidence, not this implementation note.
No authored or executed new case, baseline trial or revised trial is claimed here.

## Checks actually run and remaining limits

| Check | Actual result | Limit |
| --- | --- | --- |
| `node scripts/check-skills.mjs` | Passed | Metadata, packaging and local reference structure |
| `node scripts/check-docs.mjs` | Passed, 1198 local links across 306 Markdown files | Documentation link structure, run before this additive note |
| `git diff --check` on owned tracked canonical/doc paths | Passed | Whitespace only |
| Bundled skill creator quick validator with system `python3` | Blocked before validation, missing PyYAML | `ModuleNotFoundError: No module named 'yaml'`, failed attempt retained, no dependency installed and no pass claimed |
| Package and original corpus/fixture digest comparison | Passed | Exact before identity and byte preservation, not behavior |
| Six retained document object digests and byte counts | Passed | Source integrity, not product execution |

The local Python validator dependency gap remains explicit. Node structural
checks cover repository packaging, they do not substitute for native instruction
evaluation. Adapter regeneration, `npm run check:generated`, complete
`npm run validate`, revised candidate staging and native trials remain with root.
No Confluent runtime, SDK decode, import, restore, live registration or production
recovery was run. No independent behavioral score was produced by this workstream,
supported host coverage remains governed by the forthcoming trial record.

External evidence namespace:
`tal-skills-schema-registry-source-check-2026-10-15-r01`.
`source-scopes.json` is bound by SHA256
`dcfdb614d295a0e31f5e9cde95062e3cdae03c51c4bfa092a8c643856bab20f2`.
`checks.json` is bound by SHA256
`ba0a9ca30aeaa8b4ab9b937fdf08f3eb6bb77b4e293cbaf0374396e6791d17c2`.
The same external root retains `requests.json`, all response objects,
`before-check.json`, `after-candidate.json`, `canonical-diff.patch` and the
`candidate-source-r06-01` package snapshot. Raw content, errors and snapshots
remain outside the repository.

The canonical package diff is bound by SHA256
`4e3de01c262809f2b628366cc88801d58877c6b58ec4a852de66563870d2560a`.
It records the three modified canonical files and the new reference against the
preserved before snapshot. The documentation link check was repeated after the
additive note and again passed with the same reported link/file counts.
