# Narrow adoption — 2026-10-01

After the archive and article research was frozen, root authorized these changes:

- `skills/engineering/distributed-system-patterns/references/ownership.md`: asynchronous finalization/transfer branch enumerates guarded durable-write paths, resolves pending or unknown commits before handoff, separates authoritative death evidence from missed-heartbeat suspicion, and proposes observing delayed writes and competing claims at the protected resource.
- `skills/protocols/a2a-engineering/references/lifecycle-and-effects.md`: a 150-word-or-smaller application recovery branch separates task/event history, executor checkpoints, sandbox files, output artifacts and effect receipts, including owner/retention/restoration/cleanup contracts and proposed executor-loss/artifact-expiry checks.
- `skills/protocols/a2a-engineering/references/sources.md`: precise full-read attribution and current Managed Agents/Agent SDK retention qualifications, with vendor-specific expiry facts in source notes and no repository-research links inside the standalone package.

The storage lane owns the distributed-system-patterns source-ledger addition and serving/partition changes. This lane did not edit that ledger, serving references, either SKILL.md, or Temporal files. Temporal AI references already cover independent resource lifetimes and artifact expiry; overlapping normative edits were unnecessary. The MCP outcomes reference remains scoped to request/effect interruption.

Validation: all 15,841 publisher records have unique URLs within their publisher; manifest counts reconcile; five index records and five six-dimension cards have complete-main-body reading status; every research JSON parses; local relative links in the three touched standalone-package files resolve; `git diff --check` passed. Three historical NVIDIA API post links advertise HTTP/outside-blog canonical URLs and are preserved as publisher metadata, not silently rewritten.

The proposed handoff, executor-loss and artifact-expiry experiments were not executed. No vendor runtime or model run occurred, no new skill was created, and no commit was made.
