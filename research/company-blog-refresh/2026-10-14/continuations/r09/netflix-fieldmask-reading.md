# Netflix FieldMask reading and current contract comparison

This additive note records two deliberately read Netflix articles and a separate current Google contract check. It proposes a narrow extension to `microservice-integration`, with no canonical instruction, case, model trial or adapter changes. The live Netflix collector and its counters remain unchanged.

## Authored Netflix mechanisms

Netflix's mutation example distinguishes an unselected field from a selected field whose value is omitted. The former is unchanged; the latter is cleared under that authored service convention. An empty or absent mask applies to all payload fields. An older client that lacks a newly added budget field can therefore erase its stored value. The article suggests mandatory explicit masks or a version policy as possible protections for this contract. This is a historical Netflix design example, with embedded external code samples unexamined. [Netflix mutation article](https://netflixtechblog.com/practical-api-design-at-netflix-part-2-protobuf-fieldmask-for-mutation-operations-2e75e1d230e4).

The projection article explains that field masks carry names as symbolic paths even when ordinary Protobuf message encoding uses field numbers. A field rename that preserves its number can therefore break existing mask paths. It discusses retaining old names or deprecating a field and adding another, and using requested fields to avoid unnecessary downstream calls. These are authored mechanisms, not a verified current Netflix runtime. [Netflix projection article](https://netflixtechblog.com/practical-api-design-at-netflix-part-1-using-protobuf-fieldmask-35cfdc606518).

## Current primary contract check

The Protobuf reference requires unselected update fields to remain untouched and describes clearing a selected field by supplying its default value. Its absent update mask convention applies to all fields, with an explicit warning about resetting fields unknown to an older client. It permits a service to require a mask. This supports the failure mechanism without proving that every implementation treats omitted values as deletion. [Protobuf FieldMask reference](https://protobuf.dev/reference/protobuf/google.protobuf/#field-mask).

Google's current resource API convention differs: the optional omitted mask implies the populated fields, while `*` requests full replacement. That full replacement can erase new fields unknown to a client. A universal recommendation to reject omitted masks would conflict with this dialect. Inspect the actual provider convention and generated client before selecting a remedy. [Google AIP 134](https://google.aip.dev/134).

Google AIP 161 permits wildcard traversal only where supported and rejects repeated field indexes. It also marks a single request `read_mask` as deprecated for Google APIs. The Netflix read mask example therefore supports understanding an existing design, not an unconditional recommendation for new Google API designs. [Google AIP 161](https://google.aip.dev/161).

## Existing coverage and proposed extension

`skills/engineering/microservice-integration/references/compatibility.md` already covers field presence, defaults, meaning, actual serializers, old consumers and rollback combinations. Its current three cases cover a response rename, event meaning drift and a local formatting nontrigger. A search of the canonical package and evaluation tree found no explicit FieldMask mechanism. This is a snapshot observation, not a claim that generic guidance could never diagnose the issue.

The proposed addition is to inspect the provider's mask dialect, clear versus unchanged behavior, and the symbolic paths exposed to supported clients. Candidate future evaluation scenarios would preserve a new stored field during an old client's partial update, distinguish explicit reset from an omitted update, assess old and new mask paths through a rename, and recognize an AIP 134 service whose omitted mask selects populated fields. Existing generic compatibility and nontrigger cases would still need regression scoring if instructions change. These scenarios are proposed only; no evaluation pass is claimed.

## Reading evidence and limits

The separate external leaf is `/tmp/tal-skills-blog-crawl-netflix-v2-reading-2026-10-15-r01`. Four articles were deliberately read as full retained extracted RSS text: the two FieldMask articles, one SpiceDB design article and one async observability article. Only the two FieldMask sources support this recommendation. The other readings have separate facts and recommendations in the external leaf.

Each reading binds copied decoded HTML, extracted text, the article receipt and the originating RSS response by exact bytes and SHA256. The three Google pages retain web tool provider representations, with their own hashes; they do not establish raw origin HTTP response bindings. No rendered media, externally embedded code, current application runtime or equivalence to blocked article pages was checked. This reading leaf made zero Medium or article HTTP requests. Its four deliberate reads do not rewrite the live collector's zero deliberate read counter or earlier frozen reports.
