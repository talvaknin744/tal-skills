# Upstream provenance

This is a tal-skills adaptation of official Temporal source, not an official Temporal release or endorsement.

- Repository: [temporalio/skill-temporal-ops](https://github.com/temporalio/skill-temporal-ops)
- Pinned commit: [`f5ff5b7e7d48ce475c3c730a6bbd41ad2fce4d59`](https://github.com/temporalio/skill-temporal-ops/tree/f5ff5b7e7d48ce475c3c730a6bbd41ad2fce4d59)
- Source directory: `.`
- Reviewed: 2026-09-29
- License: [MIT](LICENSE), preserving Temporal Technologies Inc.'s copyright notice.
- Upstream license: [LICENSE](https://github.com/temporalio/skill-temporal-ops/blob/f5ff5b7e7d48ce475c3c730a6bbd41ad2fce4d59/LICENSE)

## Local changes

- Added provenance pointer and UPSTREAM.md.
- Replaced a missing sibling CLI resource with bundled CLI conventions and namespace administration references.
- Clarified reuse of existing session authorization for its actual command/target/scope.
- Added Codex UI metadata preserving explicit invocation.

- Normalized trailing whitespace in imported reference files.

### Engineering toolkit maintenance — 2026-09-29

Replaced credential-value probes with presence-only checks; aligned current endpoint routing while preserving configured regional/private exceptions; corrected timeout requirements, heartbeat/physical-process inference, and cross-Namespace child defaults; normalized optional public skill names.

Primary checks: [Namespace endpoints](https://docs.temporal.io/cloud/namespaces), [ActivityOptions requirements](https://typescript.temporal.io/api/interfaces/common.ActivityOptions), and [API child-Namespace deprecation](https://github.com/temporalio/api/blob/master/temporal/api/command/v1/message.proto).

The original source pin and MIT license are unchanged. This is a targeted local correction of audited entrypoints and selected risk-bearing references, not a line-by-line revalidation of the entire vendored library.

### Independent review correction — 2026-09-29

Independent review corrected the local current-versus-legacy endpoint classification. Preserved API Regional endpoint and HA/private DNS intermediary as separate documented roles; aligned authentication, connectivity, and SDK snippet references. Source: [Namespace access documentation](https://docs.temporal.io/cloud/namespaces#access-namespaces). These corrections supersede the initial local implementation claim; the upstream pin remains unchanged.

## Verification and updates

The package was checked locally for frontmatter, bundled resource links, and attribution. Provisioning scripts receive shell syntax and isolated stub checks; no live Cloud setup, deployment, credentials, or Workflow execution was performed for this import. Examples and runtime dependencies still require validation against the project's installed SDK and environment.

Compare a new upstream commit with this pin, review local corrections before merging, and update the repository's upstream lock and checks. Do not overwrite these adaptations with an unreviewed upstream snapshot.
