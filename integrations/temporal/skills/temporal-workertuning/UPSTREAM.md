# Upstream provenance

This is a tal-skills adaptation of official Temporal source, not an official Temporal release or endorsement.

- Repository: [temporalio/skill-temporal-workertuning](https://github.com/temporalio/skill-temporal-workertuning)
- Pinned commit: [`bd16e2f7049402bb7238b6215d8bdfe726eddf93`](https://github.com/temporalio/skill-temporal-workertuning/tree/bd16e2f7049402bb7238b6215d8bdfe726eddf93)
- Source directory: `.`
- Reviewed: 2026-09-29
- License: [MIT](LICENSE), preserving Temporal Technologies Inc.'s copyright notice.
- Upstream license: [LICENSE](https://github.com/temporalio/skill-temporal-workertuning/blob/bd16e2f7049402bb7238b6215d8bdfe726eddf93/LICENSE)

## Local changes

- Added provenance pointer and UPSTREAM.md.
- Replaced unavailable temporal-cli routing with developer/ops skills and installed CLI help.

- Normalized trailing whitespace in imported reference files.

### Engineering toolkit maintenance — 2026-09-29

Separated Namespace APS capacity from SDK-specific defaults, removed mandatory startup feedback solicitation, and normalized optional public sibling routing.

Primary checks: [Cloud capacity modes](https://docs.temporal.io/cloud/capacity-modes). The table correction is an applicability clarification; Namespace capacity must be inspected in the target environment.

The original source pin and MIT license are unchanged. This is a targeted local correction of audited entrypoints and selected risk-bearing references, not a line-by-line revalidation of the entire vendored library.

## Verification and updates

The package was checked locally for frontmatter, bundled resource links, and attribution. Provisioning scripts receive shell syntax and isolated stub checks; no live Cloud setup, deployment, credentials, or Workflow execution was performed for this import. Examples and runtime dependencies still require validation against the project's installed SDK and environment.

Compare a new upstream commit with this pin, review local corrections before merging, and update the repository's upstream lock and checks. Do not overwrite these adaptations with an unreviewed upstream snapshot.

## Invocation policy

The retained upstream package is model-invoked: its SKILL.md and OpenAI host metadata preserve that choice.
