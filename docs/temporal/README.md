# Temporal customer-story review

Reviewed the [Temporal customer index](https://temporal.io/in-use) on **29 September 2026**. The [source ledger](customer-stories.json) accounts for all **70 entries** across its five pages, including talks and webinars. Logos without a linked story and other resources outside this index are outside this snapshot.

| Evidence read | Entries |
|---|---:|
| Complete written case studies | 39 |
| External engineering blog | 1 |
| Published talk summaries | 26 |
| Published webinar summaries | 3 |
| Title and presenter only | 1 |

The video entries were reviewed through their published text. Full transcripts could not be retrieved; no video-viewing claim is made. JPMC's page has no technical abstract, so it contributes no implementation recommendation. Each ledger entry separates the observed customer pattern, an engineering inference, a possible bug, and the evidence limits. The captured index and source-text hashes identify the reviewed snapshot; full articles and transcripts are not redistributed.

## Skills extracted by concern

| Skill | Distinct task | Representative evidence |
|---|---|---|
| [temporal-reliability](../../skills/temporal/temporal-reliability/SKILL.md) | Make business effects, compensation, and human waits recoverable | ShareChat, Mews, Maersk, Snap, Dapper Labs |
| [temporal-safe-deployments](../../skills/temporal/temporal-safe-deployments/SKILL.md) | Change code and migrate work without abandoning active executions | Mews, Attentive, Nordstrom, Block, Box, Checkr |
| [temporal-production-readiness](../../skills/temporal/temporal-production-readiness/SKILL.md) | Prove capacity, isolation, data lifetime, and operational recovery | Nooks, Vinted, Vodafone, Cloudflare, Dubber, Messari |
| [temporal-ai-workflows](../../skills/temporal/temporal-ai-workflows/SKILL.md) | Bound durable agent loops, tool effects, context, and approvals | Jota, Strada, Maria Educação, Emergent, Replit, Gradient Labs |

The [official skill catalog](../../integrations/temporal/README.md) supplies broader SDK, design, Cloud, CLI, worker-tuning, observability, serverless, and setup guidance. Its bundled copies retain their licenses and pin their upstream revisions. Local changes are labeled; this repository is not an official Temporal distribution.

## Interpretation rules

- A customer's throughput, uptime, cost, and recovery result describes that deployment; it is not a platform guarantee or sizing default.
- Durable orchestration does not make arbitrary external effects exactly once, provide cross-store atomicity, or implement compensation automatically.
- Historical Cadence, Temporalite, preview features, and planned customer features are identified in the ledger. Implementation uses current primary documentation and the target project's SDK/server capabilities.
- A talk abstract supports the observations it actually contains. A proposed safeguard remains an inference unless implementation evidence establishes it.
- The ledger routes each entry to its primary skill. Multiple stories motivate the same invariant; they do not require one skill per customer or compulsory research during every skill invocation.

Instruction design uses Matt Pocock's [Writing for Agents](https://github.com/mattpocock/skills/tree/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/productivity/writing-for-agents): distinct triggers, conditional references, observable completion, and pruning repeated guidance. The authored skills remain independently installable.

## Validation

Run `npm run validate` for packaging, local references, provenance/coverage integrity, and evaluation-corpus checks. These are not Temporal execution tests. The [behavioral cases](../../evals/temporal/README.md) use isolated projects to exercise decisions and scoped edits; see that guide for run evidence and limits. No customer system, production namespace, or paid Cloud setup is needed for repository validation.
