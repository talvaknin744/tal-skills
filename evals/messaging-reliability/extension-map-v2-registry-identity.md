# Registry identity extension evaluation map, version 2

The original [corpus](cases.json), prompts, fixtures, rubrics, verifiers and results
remain unchanged. The additive [registry identity corpus](cases-v2-registry-identity.json)
contains separate synthetic review projects. Give responders only the selected
prompt, its raw project, installed frozen candidate and declared capabilities.
Keep this map, the rubric and other cases outside responder context.

| Capability or boundary | Existing required regression | Additive case |
| --- | --- | --- |
| Historical replay preserves state contract and scoped identity | `reordered-account-events` | `v2-contextual-id-collision` |
| Acknowledgement, durable effect and external guarantees retain their boundary | `commit-before-ack` | `v2-registry-restore-identity-gap` |
| Correct registry context, writer ID, reference graph and domain meaning | `reordered-account-events`, `commit-before-ack` | Both substantive additive cases |
| Ordinary local requests stay within their stated scope | `local-observer-callback` | `v2-local-json-format` |

Run all three established cases against the revised frozen candidate alongside
all three additive cases. Report old behavior and new capability scores separately.
The normal skill description and invocation policy remain unchanged. The new
nontrigger receives normal discovery, with no explicit activation. Corpus checks
establish fixture integrity and isolation, not behavioral results.

Before editing, the package was frozen externally with tree SHA256
`5931eb7e18945dc21b4bffcb5ea16f3310a78b356be6a40ea3769c3f86e81561`.
Record the revised package identity, corpus and fixture hashes, host, model and
settings, actual capabilities and deviations, observable body reads, answers,
workspace diffs and independently evidenced criterion scores. Preserve failures,
partials, blocked attempts and unknown outcomes. A mutable current documentation
page does not establish the installed target's version or client lookup behavior.

The contextual case contrasts observed explicit Java base-context lookups with
an unspecified reporting client. The restore case deliberately leaves target
version, mode mutability and complete metadata reconstruction unknown. Current
official context, client and migration contracts inform those synthetic inputs;
the supplied versions, traces and state are authored scenarios, not vendor runtime
tests. No broker, registry, decoder, import or restore was executed while authoring.
Live product guarantees and unavailable host coverage remain separate evidence.
