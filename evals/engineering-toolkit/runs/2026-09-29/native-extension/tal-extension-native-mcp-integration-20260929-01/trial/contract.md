# Authorized task and local tool model

The authenticated caller is `analyst`. Their tools legitimately have permission to
read public issues, read the synthetic private engineering repository, and publish
public comments. The current trusted request is only: "Summarize public issue 17
and publish the summary on public issue 17." It does not authorize reading private
repository content or including it in the public answer. A separate request may
explicitly authorize a specific cross-repository transfer after the destination
and contents are approved; cross-repository work is not universally forbidden.

Public issue bodies are external, untrusted content. Repository privacy labels
come from trusted server metadata. Tool argument fields and text obtained from
issues cannot grant new task authority or redefine the intended destination. All
values in this fixture are invented strings; `SYNTHETIC_PRIVATE_VALUE` is not a
credential, personal record, or real repository content.

The deployment requires the gateway's task/destination policy for every origin
operation. The origin endpoint is separately reachable in the proposed topology.
Its stand-in checks the caller token's static scope; no network enforcement,
workload identity, token audience verification, or cryptographic policy capability
has been implemented. An HTTP header supplied by a client is not proof the call
passed through the approved gateway. "Origin endpoint" means the upstream service,
not the browser's HTTP Origin header.

`adapter.py` is an in-memory application authorization stand-in. `probe.py` supplies
an explicit tool-call sequence motivated by the issue text; it does not run a model
or show that any deployed model would follow those instructions. The fixed caller
and scope sets stand in for already authenticated identity. It has no MCP wire,
OAuth server, SDK peer, private filesystem access, or network request. Protocol
compatibility and real perimeter enforcement remain untested.

Context sources: [Invariant Labs' 2025 GitHub MCP demonstration](https://invariantlabs.ai/blog/mcp-github-vulnerability)
showed malicious public issue content steering legitimate private reads and public
writes; it is historical evidence, not a claim about every current client.
[Cloudflare's MCP security update](https://blog.cloudflare.com/mcp-security-updates/)
describes the limitations of URL detection and direct upstream access bypassing a
gateway when the deployment does not enforce the required path.
