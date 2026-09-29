# Additional protocol operations research

Research date: 2026-09-29. Two new primary articles were read; neither appears in
the existing engineering-toolkit ledgers. This extension proposes narrow tests
and reference improvements. It changes no skill, example, model, or protocol pin:
MCP remains **2026-07-28**, and A2A remains **1.0.1**.

## Evidence selected

- [GitHub MCP Exploited: Accessing private repositories via MCP](https://invariantlabs.ai/blog/mcp-github-vulnerability),
  Invariant Labs, 2025-05-26. Controlled demonstration: an untrusted issue led to
  private reads and public publication. This is historical evidence, not a claim
  about every current client. Full article text read; linked trace and image
  contents were not independently examined.
- [How Cloudflare detects MCP traffic and helps secure it](https://blog.cloudflare.com/mcp-security-updates/),
  Cloudflare, 2026-08-14. Engineering account mixed with a product announcement:
  URL heuristics missed traffic and produced false positives; direct upstream
  access could bypass a portal. Full article body read; no product deployment
  was tested.

Metadata, applicability, counterexamples, and source boundaries are in
[the structured record](protocol-operations.json). Neither article is a protocol
specification or a conformance report. No live exploit, scanner, model call, or
production network change was performed.

## Ranked repository changes

1. **Add a composed-tool boundary case to MCP review.** Existing MCP guidance
   correctly separates trusted identity from arguments and annotations. It does
   not explicitly test whether a sequence of individually authorized operations
   violates the task's permitted data destinations. Add a conditional reference
   and workflow case for integrations combining untrusted content, private reads,
   and publication. Keep the application policy executable; an agent instruction
   to ignore malicious text does not itself supply an enforcement boundary.
2. **Reuse service-security guidance for mandatory MCP access paths.** The
   existing microservice-operations reference already discusses bypassing an edge
   gateway. The MCP-specific addition is a deployment acceptance case plus a
   statement of telemetry coverage. Do not introduce a new general gateway skill.
   Here, upstream server access is distinct from the HTTP `Origin` header checks
   already present in the MCP reference.
3. **Leave A2A lifecycle guidance unchanged.** The existing implementation already
   distinguishes task persistence, execution ownership, caller scope, duplicates,
   cancellation, and uncertain effects. The selected articles provide no new
   A2A-specific evidence for changing those rules or SDK pins.

## Proposed acceptance evidence

These are authored scenarios, **not executed results**:

| Case | Fixture and observation | Evidence limit |
|---|---|---|
| MCP-COMPOSITION-01 | Use a local issue reader, synthetic private marker, and captured publication sink. Replay a disallowed call sequence and verify denial before the marker reaches the sink. An allowed triage sequence must still work. | Tests the application's chosen boundary, not model resistance to all prompt injections. |
| MCP-PATH-01 | Where a gateway is mandatory, invoke the same operation through it and directly at the upstream server. Verify the required direct-path denial and a successful permitted path, with effect counts. | A local fixture cannot certify a deployed network policy. Trust in gateway provenance must come from the deployment, not a caller-supplied header. |
| MCP-VISIBILITY-01 | Document which paths are observable, then include an alternate HTTP path and local stdio case in the inventory review. | A detector's missing event is not proof that an operation never occurred. |

Prefer adding these cases when their entry conditions exist. A read-only local
adapter does not need a mandatory network gateway, and legitimate cross-repository
work needs an explicit destination policy rather than a universal one-repository
restriction. No new rule should block an authorized workflow solely to satisfy a
generic security checklist.

The JSON records hashes of the local guidance examined. Recheck the gap mapping
if those files change before an implementation adopts these proposals.
