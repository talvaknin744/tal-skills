# Twilio publisher refresh

Research date: 2026-10-14.

Public English company blog article URLs under /en-us/blog/, including developer articles. Other language site maps are inspected only as metadata sources and do not expand the article scope.

## Discovery and retrieval

The English sitemap is a finite URL set and was retrieved. Generic declared source traversal ended. Every known article URL has a recorded attempt.

The recorded collector snapshot has 3749 known URLs, 3749 processed frontier URLs, 3749 unique HTTP article requests, 3728 extracted bodies, 1 successful responses without a credible extraction, and 0 pending URLs. Deliberate reading covers 2 selected articles. Retrieval, extraction and reading remain separate.

External evidence namespace: `tal-skills-blog-crawl-2026-10-14`. Summary reference: `publishers/twilio/summary.json`, SHA256 `bb84a7a8e957ca9b4bfdd1761172ad7519ec826a51b35c4b2ef8eb495642a8ff`. Attempts, discovery and body receipts stay outside the repository. The compact JSON report binds this snapshot and preserves article status counts.

## Reading and recommendations

### infrastructure-change-safety

Model a database pivot as prepare, restore, catch up, validate readiness, switch primary and verify convergence. Make shard and environment progress visible, so an interrupted automation resumes from durable observed state rather than repeating the whole sequence. Validate replication lag and availability zone placement before switching.

[Primary article](https://www.twilio.com/en-us/blog/developers/twilio-manages-mysql-clusters-scale). Complete main prose through MySQL Deployments Wins, including pivot sequence and request polling stages. Diagram pixels and internal runtime were not verified.

This 2018 architecture account describes Twilio internal tools. It does not establish current MySQL tooling or safe failover for an unspecified deployment.

Proposed discriminating evaluation cases:

- The catch-up step is incomplete when a pivot is requested.
- A pivot succeeds but its response is lost.
- One shard switches and another fails.
- A stateless service configuration edit does not require database pivot stages.

### messaging-reliability

Treat webhook event arrays as independently recoverable events with identity, schema version and sink progress. Distinguish transport receipt from durable downstream effects, and preserve uncertainty when acknowledgement is lost. Bound recovery by the actual retained delivery horizon, not the historical blog promise.

[Primary article](https://www.twilio.com/en-us/blog/twilio-event-streams-webhook-sink). Complete main prose through product roadmap and author paragraph. Linked CloudEvents specification and current product runtime were not verified.

The 2021 post described a private beta with a specific retry horizon. Its product limits must be reverified in current documentation.

Proposed discriminating evaluation cases:

- An array has one invalid event after another event commits.
- Acknowledgement is lost after a durable event effect.
- Redelivery arrives outside retained deduplication history.
- An in-process callback stays outside messaging-reliability.

Local QA preserves eleven archive, category, author, search and tag navigation URLs as excluded nonarticle dispositions. Nine historical article URLs currently return a 404, an outside scope redirect or a developer hub collection. Three genuine archived article redirects were recovered from their exact retained payloads after the focused archive year article classifier correction. That repair made zero network requests and preserved all prior classifications and state exports.

## Remaining coverage

- Sitemap discovery does not prove lifetime completeness for deleted, private or unlisted articles.
- Speculative developer feed and RSS URLs returned 404.
- Historic article product status and retry limits need current documentation before implementation.
- One successful Article schema page has no credible substantive extracted body. Its raw response remains retained.

Recommendations do not establish candidate behavior. Existing relevant evaluations plus focused activation, nontrigger and changed boundary cases must run before any instruction change is promoted.
