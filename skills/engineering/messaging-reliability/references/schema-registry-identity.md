# Schema registry identity through replay and recovery

Use when replay, migration or restore depends on a registry resolving retained
schema identifiers. A restored data topic and an available registry API can still
decode a record with the wrong schema or fail to resolve its references.

## Resolve the client's authority

Read the registry product and deployment identity, server and client versions,
serializer format, registry endpoint and actual lookup path. Determine where the
record carries its identifier and how the client selects its scope, including
context or qualified subject when the product uses them. Preserve required
headers and reference metadata through the replay route. A numeric ID, subject
name or schema filename alone does not identify that authority.

Confluent schema IDs and subject names are unique within a context. The same ID
in two contexts can resolve to different schemas. Verify the installed client's
explicit context path or subject aware lookup, including a lookup without its
surviving cache. Client language alone does not establish equivalent lookup
behavior. Current Confluent formats can use a payload ID or a header GUID, so
inspect the actual stored format rather than assuming every record carries the
same identifier. [Contexts](https://docs.confluent.io/platform/current/schema-registry/schema-contexts-cp.html),
[client lookup](https://docs.confluent.io/platform/current/schema-registry/faqs-cp.html),
[wire formats](https://docs.confluent.io/platform/current/schema-registry/fundamentals/serdes-develop/index.html).

## Preserve the retained mapping

Identify the mappings required by the supported replay history: original
identifiers, schema definitions, subject versions and recursively referenced
schemas, plus rules or metadata used by the chosen format. Compare them against
independent source registry or backup evidence. Recreating an equal definition
under a new numeric ID does not repair records that retain the original ID.

Use the selected product's restore, import or linking contract to preserve those
mappings, or prove a supported translation through the actual record and client
path. Resolve occupied IDs and missing references before declaring coverage.
Confluent's registry metadata log includes subject and version information,
ID metadata and compatibility settings. Its documented whole registry migration
uses an empty destination, while subject import has different subject and ID
preconditions. Check the selected mode's scope and installed version before
changing it. Retain the original metadata and failed attempts while reconciling
an incomplete import. These contracts do not prescribe one registry topology.
[Metadata restore](https://docs.confluent.io/platform/current/schema-registry/installation/deployment.html),
[migration contracts](https://docs.confluent.io/platform/current/schema-registry/installation/migrate.html),
[references and modes](https://docs.confluent.io/platform/current/schema-registry/develop/api.html).

## Gate affected admission on usable decoding

Keep affected replay and ordinary schema registration gated while the required
metadata is absent, conflicting or only partially restored. Name who maintains
that gate, which clients can register automatically, and which diagnostic or
restore operations are permitted. Process readiness and a successful import exit
do not establish mapping completeness.

Exercise representative retained wire records from every supported schema era
through the destination's actual client lookup and decoding path. Check expected
business values and effects as well as deserialization success. Include the same
numeric ID in a different context, an absent referenced version and an interrupted
restore followed by attempted new registration. A local mapping model establishes
only its supplied rules, not SDK or registry behavior.

Return the lookup authority, required and verified mapping coverage, decode and
business invariant results, and the current registration/replay gate with its
owner. Label supplied facts, executed checks, proposed checks and unresolved
metadata separately. Missing acceptance evidence leaves affected resumption
unresolved with a concrete next check.

Hand off to the `recovery-validation` skill for the broader restore contract and
usable history acceptance. If `recovery-validation` is not installed, continue
with this reference's local decoder and metadata checks, leave broader restore
conclusions unresolved, and do not guarantee them.
