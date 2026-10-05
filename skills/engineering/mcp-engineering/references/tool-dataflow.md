# Tool dataflow and access paths

Use the relevant branch when an integration combines untrusted content, protected
reads and publication, or when deployment policy requires a gateway.

## Authorize the source-to-destination flow

Valid credentials for a private read and a public write do not establish intent
to transfer that data. Map the trusted caller/task scope, protected sources, and
permitted destinations. Treat retrieved content, tool metadata and model-selected
arguments as inputs to that policy; they cannot grant additional authority.

Enforce the transfer policy before publication using application-maintained
provenance and the actual destination/visibility. Derive source context from
trusted state and observed reads, including transformations; model-supplied labels
are not evidence of safe origin. Resolve missing provenance according to an
explicit policy instead of assuming the content is public. A prompt instruction
alone cannot enforce this boundary.

Permit cross-repository transfers when the task's policy authorizes the source,
destination and operation. Repository equality is neither a universal requirement
nor sufficient protection when one repository mixes public and protected data.

**Verify:** replay a disallowed tool sequence with a synthetic private marker and
a captured publication sink. Assert denial before disclosure, then verify allowed
triage and an explicitly authorized transfer. This tests the policy, not every
model's resistance to prompt injection. The motivating
[Invariant demonstration](https://invariantlabs.ai/blog/mcp-github-vulnerability)
is historical evidence of composed tool access, not a current-client benchmark.

## Enforce a required gateway path

When policy requires gateway mediation, verify that direct upstream access is
rejected. Establish gateway provenance through the deployment's
trusted connection/identity context; caller-supplied routing headers cannot prove
that policy ran. Check the same resource/effect boundary on every accepted path.
An upstream endpoint is distinct from the HTTP `Origin` header checked by the
transport. Local or direct integrations need no gateway solely because they use
MCP.

**Verify:** compare permitted gateway and prohibited direct calls, including
forged routing hints; assert the expected effect count. State which hosts and
transports telemetry covers. Network inspection cannot observe local stdio or
traffic outside its path; URL and protocol-header detection is not authorization.
[Cloudflare's engineering account](https://blog.cloudflare.com/mcp-security-updates/)
documents detection limits and bypass paths. Local policy fixtures do not verify
deployed gateway rules or comprehensive traffic visibility.
