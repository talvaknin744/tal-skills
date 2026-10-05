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

### Engineering toolkit maintenance — 2026-09-29

Replaced value-printing environment probes with names-only disclosure; added exact CLI capability checks, separate core/extension versions, compatible-install no-op, supported tap, truthful preview branches, and post-install failure checks. Extracted gate/output/phase references while preserving public metadata, subcommands, result markers, async flow, and fallback. Distinguished historical preview observations from current behavior and corrected the offline-login inference.

Primary checks: [Cloud CLI v0.1.1 source](https://github.com/temporalio/cloud-cli/tree/9575d18f0a4588b51382886655a30742c094baac) and [current CLI documentation](https://docs.temporal.io/cli/cloud).

The original source pin and MIT license are unchanged. This is a targeted local correction of audited entrypoints and selected risk-bearing references, not a line-by-line revalidation of the entire vendored library.

### Independent review correction — 2026-09-29

Independent review found that core CLI v1.9.1 config list enumerates profile names without validating --profile. verify-config now uses selected-profile config get --prop address and discards both streams; capability checks and disclosure match it. Tests cover exact/missing/other/prefix profiles, malformed config, and unexpected secret-bearing output. Bounded connection retries now lead to evidence-based diagnosis rather than a blanket readiness/provider-fault claim. Source: [core CLI v1.9.1 config implementation](https://github.com/temporalio/cli/blob/v1.9.1/internal/temporalcli/commands.config.go). These corrections supersede the initial local implementation claim; the upstream pin remains unchanged.

## Verification and updates

The package was checked locally for frontmatter, bundled resource links, and attribution. Provisioning scripts receive shell syntax and isolated stub checks; no live Cloud setup, deployment, credentials, or Workflow execution was performed for this import. Examples and runtime dependencies still require validation against the project's installed SDK and environment.

Compare a new upstream commit with this pin, review local corrections before merging, and update the repository's upstream lock and checks. Do not overwrite these adaptations with an unreviewed upstream snapshot.

## Invocation policy

The retained upstream package is explicit-only: its SKILL.md and OpenAI host metadata preserve that choice.
