# Runtime flag retirement research

Checked 2026-10-15. This continuation records a conditional improvement opportunity in `code-and-docs-cleanup`. It records no skill change or behavioral result. Package identity remains `820ba24697a587032cdd502084dfee48824e53242d9bdfb051c8a821c75c5c27`.

The current skill already requires tracing configured entrypoints, wrappers and distant consumers, preserving owned responsibilities, and separating authorized behavior changes from preservation. The possible addition is specific evidence for a runtime flag replacement value and its valid scope. The unchanged baseline may already apply its general rules correctly.

## Primary facts

| Official source, selected textual reading | Fact relevant to retirement |
| --- | --- |
| [OpenFeature evaluation](https://openfeature.dev/specification/sections/flag-evaluation/), provider mapping, sections 1.3 and 1.4 | Evaluation is typed. Abnormal execution returns the supplied default. Provider and domain binding matter. |
| [OpenFeature context](https://openfeature.dev/specification/sections/evaluation-context/), overview and sections 3.1 and 3.2 | Subject and ambient context affect targeting. Context sources can override one another. |
| [LaunchDarkly rollouts](https://launchdarkly.com/docs/home/releases/percentage-rollouts), substantive rollout sections | Allocation depends on context kind and attribute. |
| [LaunchDarkly lifecycle settings](https://launchdarkly.com/docs/home/flags/flag-lifecycle-settings), substantive criteria sections | Readiness criteria are configurable and exclude noncritical environments. |
| [LaunchDarkly archive](https://launchdarkly.com/docs/home/flags/archive), textual guidance and checks | Archive affects every project environment. Remaining evaluations receive code fallback. |
| [LaunchDarkly technical debt](https://launchdarkly.com/docs/guides/flags/technical-debt), selected lifecycle sections | A temporary rollout and an intentionally retained operational control have different retirement decisions. |

These are current documentation contracts, with the actual selected reading scopes retained. They do not prove an installed SDK implementation or live configuration. Figures and product operations were not inspected or executed.

## Authored inference and validation proposal

If baseline behavior shows an omission, add one conditional paragraph to the existing preservation reference for runtime flag retirement. Establish the exact typed target from authoritative configuration or an already authorized desired change. Bind it to applicable provider or domain, environment, resolved context and rollout scope. Distinguish normal values, fallbacks and errors. State authorized changes to those distinctions or operational controls. Keep local code removal and remote archive scope separate, with surviving consumers, prerequisites and the coverage of observed usage visible.

This inference does not require another package, universal provider behavior, live account access, additional approval for an authorized change, or flag ceremony for ordinary cleanup. A sample or readiness badge cannot establish broader preservation. Missing evidence leaves that claim unresolved within the affected scope.

The research author ran no behavioral cases. Proposed coverage is: unchanged regressions for configured consumers and responsibility preservation, a positive authorized typed target through an injected wrapper, a partial rollout boundary, a lifecycle boundary with a surviving consumer or permanent control, and an ordinary local helper or documentation nontrigger. These are scenario families, not claims that cases passed. An independent owner should evaluate the unchanged baseline first. If it already handles the boundaries, retain the evidence without redundant instructions.

## Evidence binding and limits

The external source root is `/tmp/tal-skills-code-cleanup-runtime-flags-research-2026-10-15-r01`. Its [seal](/tmp/tal-skills-code-cleanup-runtime-flags-research-2026-10-15-r01/evidence-seal.json), SHA256 `a6aeab4ab436accb83f550594cf6e1f04e929ca3f6e77bb9e64181d7881c5730`, binds 23 members. [Reading scopes](/tmp/tal-skills-code-cleanup-runtime-flags-research-2026-10-15-r01/official-source-scopes.json), SHA256 `e87aff3d8fa916a0246b4a09a993114e6c084edf657695ae7cdd53fa2b2fd597`, bind four returned web text records. These are serialized tool responses, not original HTTP transport bodies. The JSON companion retains every response hash and the six package file identities.

The [DoorDash article](https://careersatdoordash.com/blog/automating-feature-flag-cleanup-at-scale-with-a-multi-agent-llm-system/) has a retained 284404 byte HTTP 403 challenge, SHA256 `ed05ef5ffd82cf1481e487b09d735e37954cdc70701647b28a9e44160343e34b`, recorded 2026-10-14 at 18:35:25 UTC. Its prior full reading assertion has no bound full body or web response snapshot. DoorDash specific mechanisms therefore remain unverified here. The generic recommendation comes from the official documentation above. No further HTTP requests, private evaluation materials, native trials, provider operations or canonical edits were used for this draft.
