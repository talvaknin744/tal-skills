# Upstream provenance

This is a tal-skills adaptation of official Temporal source, not an official Temporal release or endorsement.

- Repository: [temporalio/skill-temporal-developer](https://github.com/temporalio/skill-temporal-developer)
- Pinned commit: [`b6a2c3fdbb8898db8f5bfa08eb008d393fa59af8`](https://github.com/temporalio/skill-temporal-developer/tree/b6a2c3fdbb8898db8f5bfa08eb008d393fa59af8)
- Source directory: `.`
- Reviewed: 2026-09-29
- License: [MIT](LICENSE), preserving Temporal Technologies Inc.'s copyright notice.
- Upstream license: [LICENSE](https://github.com/temporalio/skill-temporal-developer/blob/b6a2c3fdbb8898db8f5bfa08eb008d393fa59af8/LICENSE)

## Local changes

- Added provenance pointer and UPSTREAM.md.
- Clarified replay versus Activity retries, stable scoped idempotency keys, atomic effect protection, uncertain outcomes, and compensation registration before uncertain effects.
- Added an installed SDK/server capability check before applying version-specific references.

- Added explicit illustrative contracts to all six language Saga examples: absence-safe compensation, late forward-attempt coordination, shipping reconciliation, cancellation, and failed-compensation recovery.

- Normalized trailing whitespace in imported reference files.

### Engineering toolkit maintenance — 2026-09-29

Clarified Standalone Activity execution deduplication versus external effect idempotency, running/closed ID policies and retention, operation identity, current CLI/server minimums, and Rust support with legacy fallback.

Primary checks: [Standalone Activities](https://docs.temporal.io/standalone-activity) and [Rust guide](https://docs.temporal.io/develop/rust/activities/standalone-activities).

The original source pin and MIT license are unchanged. This is a targeted local correction of audited entrypoints and selected risk-bearing references, not a line-by-line revalidation of the entire vendored library.

## Verification and updates

The package was checked locally for frontmatter, bundled resource links, and attribution. Provisioning scripts receive shell syntax and isolated stub checks; no live Cloud setup, deployment, credentials, or Workflow execution was performed for this import. Examples and runtime dependencies still require validation against the project's installed SDK and environment.

Compare a new upstream commit with this pin, review local corrections before merging, and update the repository's upstream lock and checks. Do not overwrite these adaptations with an unreviewed upstream snapshot.

## Invocation policy

The retained upstream package is model-invoked: its SKILL.md and OpenAI host metadata preserve that choice.
