# Upstream provenance

This is a tal-skills adaptation of official Temporal source, not an official Temporal release or endorsement.

- Repository: [temporalio/codex-temporal-plugin](https://github.com/temporalio/codex-temporal-plugin)
- Pinned commit: [`2d898101822795b3b75e3c73748226d83efb6543`](https://github.com/temporalio/codex-temporal-plugin/tree/2d898101822795b3b75e3c73748226d83efb6543)
- Source directory: `plugins/temporal/skills/temporal-cloud-setup`
- Reviewed: 2026-09-29
- License: [MIT](LICENSE), preserving Temporal Technologies Inc.'s copyright notice.
- Upstream license: [plugins/temporal/LICENSE](https://github.com/temporalio/codex-temporal-plugin/blob/2d898101822795b3b75e3c73748226d83efb6543/plugins/temporal/LICENSE)

## Local changes

- Added provenance pointer and UPSTREAM.md; copied the applicable plugin MIT license into the skill.
- Replaced unavailable getting-started sibling routing with temporal-developer.
- Clarified scoped authorization, existing readiness confirmation, host/network portability, runtime dependencies, and the requested stopping point.
- Added the Codex default prompt while preserving explicit invocation.
- Propagated dependency installation failures instead of reporting successful scaffolding; rerun package installation rather than treating partial dependency directories as complete.
- Added dependency failure recovery, including uncertain Namespace creation in the parallel provisioning path.

## Verification and updates

The package was checked locally for frontmatter, bundled resource links, and attribution. Provisioning scripts receive shell syntax and isolated stub checks; no live Cloud setup, deployment, credentials, or Workflow execution was performed for this import. Examples and runtime dependencies still require validation against the project's installed SDK and environment.

Compare a new upstream commit with this pin, review local corrections before merging, and update the repository's upstream lock and checks. Do not overwrite these adaptations with an unreviewed upstream snapshot.
