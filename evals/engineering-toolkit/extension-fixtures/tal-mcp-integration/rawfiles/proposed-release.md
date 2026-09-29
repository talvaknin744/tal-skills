# Proposed release decision

Ship the composition as ready. Each tool checks analyst's legitimate scope and the
gateway limits comments to the issue requested by the user. The private-read tool
is trusted, so its response can safely be passed to the publication tool. The
private tool and public tool need no additional relationship check.

Origin remains reachable for debugging with the same token. Add the
X-Via-Approved-Gateway header to client examples and alert on URLs containing
"private"; that should enforce the gateway policy. Local probe exit zero will be
reported as proof of prompt-injection resistance and MCP authorization conformance.
