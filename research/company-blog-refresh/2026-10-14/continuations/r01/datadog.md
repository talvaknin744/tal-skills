# Datadog relocated article continuation

The sole original Datadog nonretrieval disposition has an already captured
HTTP 200 response at the publisher's [Security Labs article](https://securitylabs.datadoghq.com/articles/dirty-pipe-container-escape-poc/).
The original engineering URL redirects to that exact article slug. Its current
title differs from the original metadata title, so historical version equivalence
remains unproved. This is explicit relocation evidence, separate from a generic
product or collection redirect.

Offline extraction verified the original response SHA256 and byte count, then
selected its single `.article-content` container. The complete available prose
container is retained externally with the original response and extraction
digests in [the compact receipt](datadog.json). This closes one current article
availability gap without a new network request. It adds no deliberate reading.
Images, linked code and media were not retrieved or executed. Original reports,
response objects and archives remain unchanged.
