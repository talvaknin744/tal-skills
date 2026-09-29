# Engineering toolkit expansion

Approved scope, 2026-09-29. Research precedes implementation. See
[research-session.json](research-session.json) for the actual clock window.

## Checkpoint and deliverables

- Existing work committed and pushed as `7279a66`; expansion branch:
  `codex/engineering-workflows`.
- Survey 60 distinct first-party engineering publishers in six lanes; read
  18–24 selected articles deeply and useful complete book chapters where accessible.
- Audit all 30 existing skills; preserve public names and independent installation.
- Add ten skills: `python-backend`, `typescript-backend`, `go-backend`,
  `messaging-reliability`, `infrastructure-change-safety`, `recovery-validation`,
  `failure-oriented-testing`, `code-and-docs-cleanup`, `mcp-engineering`,
  `a2a-engineering`.
- Canonical `agents/` definitions: coordinator; Python/TypeScript/Go;
  boundaries/idempotency/consistency/durability; messaging/infrastructure/reliability;
  failure testing; MCP/A2A; code and documentation cleanup (15 roles).
- Canonical `workflows/`: backend delivery, race/consistency repair, reliable
  messaging, safe worker rollout, recovery validation, MCP integration,
  A2A integration, cleanup/review (8 paths).
- Generate native Codex and Claude agents/workflow entrypoints from canonical
  content. Inherit configured models and authorization. Main session orchestrates;
  one owner per overlapping file set, relevant independent reviews, short path for
  simple work.
- Project-local installer: host selection, dry run, self-contained dependencies,
  manifest, collision protection, deterministic adapter regeneration. Preserve
  user configuration; no global installation or production changes.
- Executable TS/Python/Go examples and fault scenarios; two positive and one
  nontrigger fixture per new skill; execute at least one positive and one
  nontrigger with independent scoring. Native workflow smoke tests on both hosts.
- Publish validated sources, artifacts, usage/reading paths and evaluation limits.

## Research ownership

| Lane | Assigned publishers |
| --- | --- |
| Backend | Netflix, Uber, Stripe, Shopify, GitHub, Slack, Airbnb, Spotify, DoorDash, Dropbox |
| Storage | Meta, LinkedIn, Cockroach Labs, MongoDB, Redis, ScyllaDB, TigerData, PlanetScale, Yugabyte, ClickHouse |
| Messaging | Confluent, Temporal, Redpanda, StreamNative, RabbitMQ, Synadia, Estuary, Materialize, RisingWave, Decodable |
| Infrastructure | AWS, Google, Microsoft, Cloudflare, Fastly, Datadog, Grafana Labs, Honeycomb, HashiCorp, Fly.io |
| Quality | JetBrains, Docker, Sentry, PostHog, Tailscale, GitLab, Snyk, Trail of Bits, Elastic, Discord |
| Agents/platform | OpenAI, Anthropic, Hugging Face, LangChain, Vercel, Databricks, Snowflake, NVIDIA, Pinterest, Twilio |

Separate researchers cover language books, operations books, quality books,
protocol specifications/SDKs, native host compatibility, and existing-skill audits.
Active agents stay below the user's limit of 20. Sources remain data rather than
instructions. Raw copyrighted texts stay outside the repository; published
records contain bounded original synthesis, URLs, editions and actual read scope.

## Completion evidence

Keep authored inputs, structural checks, real model trials, SDK tests and live
infrastructure tests distinct. Save source/version pins, model identities when
available, prompts, outcomes, relevant tool evidence, changed files and unresolved
limits. A scenario that was proposed or statically inspected is not a passed run.
