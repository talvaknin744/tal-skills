# Upstream provenance

This is a tal-skills adaptation of official Temporal source, not an official Temporal release or endorsement.

- Repository: [temporalio/skill-temporal-cloud](https://github.com/temporalio/skill-temporal-cloud)
- Pinned commit: [`2d867d1f96ae388ed27f1c48aec817f210b6cd3d`](https://github.com/temporalio/skill-temporal-cloud/tree/2d867d1f96ae388ed27f1c48aec817f210b6cd3d)
- Source directory: `.`
- Reviewed: 2026-09-29
- License: [MIT](LICENSE), preserving Temporal Technologies Inc.'s copyright notice.
- Upstream license: [LICENSE](https://github.com/temporalio/skill-temporal-cloud/blob/2d867d1f96ae388ed27f1c48aec817f210b6cd3d/LICENSE)

## Local changes

- Added provenance pointer and UPSTREAM.md.

### Engineering toolkit maintenance — 2026-09-29

Clarified current Namespace/Regional endpoint guidance and mixed-auth exceptions; made certificate-to-API-key migration verify auth mode and least-privilege Namespace access before cutover.

Primary checks: [Namespace access/authentication](https://docs.temporal.io/cloud/namespaces) and [API keys](https://docs.temporal.io/cloud/api-keys).

The original source pin and MIT license are unchanged. This is a targeted local correction of audited entrypoints and selected risk-bearing references, not a line-by-line revalidation of the entire vendored library.

### Independent review correction — 2026-09-29

Independent review corrected a local endpoint inference: the documented API Regional endpoint remains `<region>.<cloud_provider>.api.temporal.io:7233`; `<provider>-<region>.region.tmprl.cloud` is the HA/private DNS intermediary. Updated both entrypoint and troubleshooting reference, including the mixed-auth exception. Source: [Namespace access documentation](https://docs.temporal.io/cloud/namespaces#access-namespaces). These corrections supersede the initial local implementation claim; the upstream pin remains unchanged.

## Verification and updates

The package was checked locally for frontmatter, bundled resource links, and attribution. Provisioning scripts receive shell syntax and isolated stub checks; no live Cloud setup, deployment, credentials, or Workflow execution was performed for this import. Examples and runtime dependencies still require validation against the project's installed SDK and environment.

Compare a new upstream commit with this pin, review local corrections before merging, and update the repository's upstream lock and checks. Do not overwrite these adaptations with an unreviewed upstream snapshot.

## Invocation policy

The retained upstream package is model-invoked: its SKILL.md and OpenAI host metadata preserve that choice.
