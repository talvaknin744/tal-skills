# Upstream provenance

This is a tal-skills adaptation of official Temporal source, not an official Temporal release or endorsement.

- Repository: [temporalio/skill-temporal-observability](https://github.com/temporalio/skill-temporal-observability)
- Pinned commit: [`b7c16a75a4773245a8ae5dfe54850b55580a45cc`](https://github.com/temporalio/skill-temporal-observability/tree/b7c16a75a4773245a8ae5dfe54850b55580a45cc)
- Source directory: `.`
- Reviewed: 2026-09-29
- License: [MIT](LICENSE), preserving Temporal Technologies Inc.'s copyright notice.
- Upstream license: [LICENSE](https://github.com/temporalio/skill-temporal-observability/blob/b7c16a75a4773245a8ae5dfe54850b55580a45cc/LICENSE)

## Local changes

- Added provenance pointer and UPSTREAM.md.
- Converted 12 documentation-root-relative links to absolute docs.temporal.io URLs.

### Engineering toolkit maintenance — 2026-09-29

Replaced universal failure-ratio health judgments with metric-semantic alignment, pending-age/retry-budget/business-outcome checks; enabled available read-only metric access before asking for data; removed uncalibrated confidence thresholds and normalized optional sibling routing.

Primary checks: [Service health](https://docs.temporal.io/cloud/service-health), [retry policies](https://docs.temporal.io/encyclopedia/retry-policies), and [intentional business failures](https://docs.temporal.io/develop/python/best-practices/error-handling). Ratio guidance is a local applicability clarification, not a claim that the source removed its heuristic.

The original source pin and MIT license are unchanged. This is a targeted local correction of audited entrypoints and selected risk-bearing references, not a line-by-line revalidation of the entire vendored library.

## Verification and updates

The package was checked locally for frontmatter, bundled resource links, and attribution. Provisioning scripts receive shell syntax and isolated stub checks; no live Cloud setup, deployment, credentials, or Workflow execution was performed for this import. Examples and runtime dependencies still require validation against the project's installed SDK and environment.

Compare a new upstream commit with this pin, review local corrections before merging, and update the repository's upstream lock and checks. Do not overwrite these adaptations with an unreviewed upstream snapshot.
