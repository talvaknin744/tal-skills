# Upstream provenance

This is a tal-skills adaptation of official Temporal source, not an official Temporal release or endorsement.

- Repository: [temporalio/skill-temporal-serverless](https://github.com/temporalio/skill-temporal-serverless)
- Pinned commit: [`ee24e3d17ede76eb6ca05988c432e910fe08f78e`](https://github.com/temporalio/skill-temporal-serverless/tree/ee24e3d17ede76eb6ca05988c432e910fe08f78e)
- Source directory: `.`
- Reviewed: 2026-09-29
- License: [MIT](LICENSE), preserving Temporal Technologies Inc.'s copyright notice.
- Upstream license: [LICENSE](https://github.com/temporalio/skill-temporal-serverless/blob/ee24e3d17ede76eb6ca05988c432e910fe08f78e/LICENSE)

## Local changes

- Added provenance pointer and UPSTREAM.md.
- Replaced unavailable temporal-cli routing with developer/ops skills and installed CLI help.
- Clarified reuse of session authorization and absence of guaranteed host permission prompts.
- Added Codex UI metadata preserving explicit invocation.

### Engineering toolkit maintenance — 2026-09-29

Separated Lambda package scope from current platform provider availability; treated Task Queue binding as historical evidence; clarified explicit working directories and host permissions; qualified IAM simulation and failed-read evidence, preserved qualified/unqualified ARN distinctions, and required resource inspection before rollback-stack cleanup; normalized optional sibling names.

Primary checks: [Serverless platform guide](https://docs.temporal.io/serverless-workers) and [IAM simulator limits](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_testing-policies.html).

The original source pin and MIT license are unchanged. This is a targeted local correction of audited entrypoints and selected risk-bearing references, not a line-by-line revalidation of the entire vendored library.

## Verification and updates

The package was checked locally for frontmatter, bundled resource links, and attribution. Provisioning scripts receive shell syntax and isolated stub checks; no live Cloud setup, deployment, credentials, or Workflow execution was performed for this import. Examples and runtime dependencies still require validation against the project's installed SDK and environment.

Compare a new upstream commit with this pin, review local corrections before merging, and update the repository's upstream lock and checks. Do not overwrite these adaptations with an unreviewed upstream snapshot.
