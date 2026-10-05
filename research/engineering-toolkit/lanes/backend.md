# Backend research lane

Reviewed on 2026-09-29. This lane surveyed exactly ten publishers and read four selected articles through their complete main prose. The [machine-readable record](backend.json) separates deep reads, discovery candidates, and runtime cross-checks. Company outcomes are contextual evidence, not measured improvements for this repository.

## Publisher survey

| Publisher | Canonical engineering index | Relevant next reading |
| --- | --- | --- |
| Netflix | [TechBlog](https://netflixtechblog.com/) | Priority-aware overload handling |
| Uber | [Engineering](https://www.uber.com/us/en/blog/engineering/) | Retry ownership |
| Stripe | [Engineering](https://stripe.dev/blog/topic/engineering) | API idempotency; migration tooling |
| Shopify | [Engineering](https://shopify.engineering/) | Modularity retrospective |
| GitHub | [Engineering](https://github.blog/engineering/) | Migration orchestration |
| Slack | [Engineering](https://slack.engineering/) | EC2 lifecycle; agentic testing |
| Airbnb | [Tech Blog](https://medium.com/airbnb-engineering) | Distributed payment recovery |
| Spotify | [Engineering](https://engineering.atspotify.com/) | Ingestion incident; coding-agent I/O |
| DoorDash | [Engineering Blog](https://careersatdoordash.com/engineering-blog/) | Monolith extraction tradeoffs |
| Dropbox | [Tech Blog](https://dropbox.tech/) | Durable task execution; MCP integration |

Netflix and Airbnb indexes yielded sparse listings in text extraction, while individual articles remained accessible. Netflix's [official newsroom](https://about.netflix.com/en/newsroom) directly links its TechBlog. The Stripe engineering URL redirects to its developer blog. These are verified publisher identities, not a popularity ranking.

## Four lessons to adopt

1. **Preserve operation identity across uncertainty.** Response loss can follow a successful effect. The language agents should route this case to the existing idempotency skill and demonstrate a lost-response retry. Adding a header without checking the provider contract is insufficient. [Stripe](https://stripe.com/blog/idempotency)
2. **Evaluate boundaries through change locality and dependencies.** Uniform interfaces can leave cycles intact. Ask the boundaries agent to trace an actual change before recommending new abstractions, and choose an incremental state that solves the team's current problem. [Shopify](https://shopify.engineering/shopify-monolith)
3. **Treat a migration as a tracked process.** Schema intent, review, execution, cut-over, and cleanup need observable transitions and ownership. Keep database authority separate from an ordinary repository analysis job. [GitHub](https://github.blog/enterprise-software/automation/automating-mysql-schema-migrations-with-github-actions-and-more/)
4. **Count retries across the whole call path.** Per-service limits can still amplify load. A reliability review should identify the layer allowed to retry and test missing context before relying on propagated error ownership. [Uber](https://www.uber.com/us/en/blog/protecting-against-retry-storms/)

These are original workflow recommendations drawn from the articles, not instructions to copy the companies' architectures. The JSON gives a trigger, failure, mechanism, conditions, counterexample, and verification for every adopted lesson.

## Current-contract checks

Stripe's current API retains the first executed result, including a 500 response. Pre-execution validation or concurrency conflicts have different treatment, and pruning a key permits a subsequent request to execute anew. The existing idempotency reference already covers most of this; new backend skills should reuse it. [Current Stripe contract](https://docs.stripe.com/api/idempotent_requests)

The historical migration article's broad availability wording should not become a literal no-lock guarantee: gh-ost's cut-over documentation describes brief blocking and failed attempts that leave the original table available. The infrastructure skill should inspect the deployed engine/tool version and test that transition. [gh-ost cut-over](https://github.com/github/gh-ost/blob/master/doc/cut-over.md)

gRPC can perform transparent retries even without an explicit retry policy. Its response-header commitment rule concerns transport retries, not proof of a business transaction outcome. Retry inventories therefore include application, SDK, proxy, and transport layers. [gRPC retry guide](https://grpc.io/docs/guides/retry/)

## Prioritized repository changes

| Priority | Change | Evidence that it works |
| --- | --- | --- |
| P0 | Give the backend delivery workflow one implementation owner and conditional correctness reviewers. Route effect retries to `idempotency`; boundary changes to `microservice-boundaries`. | One response-loss case yields one effect; each reviewer reports evidence without changing overlapping files. |
| P0 | Add the migration-state and cut-over branch to `infrastructure-change-safety`. | A stopped or failed migration has a known state, preserves compatible clients, and can resume or recover by its documented procedure. |
| P1 | Extend `microservice-operations` with a retry-layer inventory and amplification scenario. | A forced downstream outage yields the intended per-hop attempt counts within the overall deadline. |
| P1 | Make cleanup proposals justify removed indirection against a representative use case and dependency graph. | Behavior remains stable; the proposed cleanup demonstrably reduces an unnecessary dependency or duplicated decision. |
| P2 | Keep platform-specific mechanisms in conditional references. | A Python, TypeScript, or Go task does not automatically acquire Rails tools or a company-specific service mesh. |

These priorities are repository-specific synthesis. The existing boundary skill already asks about co-changing components and alternatives to service extraction; sharpen its evidence or references rather than create a duplicate broad architecture persona. The current idempotency skill already includes authorization, retention, atomic ownership, and uncertainty, so it should remain the common correctness source.

## Evaluation cases and limits

Candidate tests: effect succeeds but response is lost; transport and application retries compound; error context disappears at an intermediate service; interface wrappers preserve a dependency cycle; a long migration pauses before cut-over; cleanup removes a wrapper that encodes a real policy and therefore must be rejected.

These scenarios are proposals, not executed application tests. The articles were read as engineering accounts; the survey did not audit source code, reproduce company performance numbers, or prove their complete implementations. Diagrams were considered through captions and surrounding prose. Runtime references are current at the check date and must be rechecked against the actual installed version when implementation depends on them. No article text, proprietary implementation, or book content was copied into the repository.
