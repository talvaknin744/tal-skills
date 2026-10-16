# Slack publisher refresh, October 14, 2026

## Coverage and evidence

Current public published WordPress post inventory. Private, deleted and unlisted historical content is outside the observable boundary.

Observed 194 distinct post links across pages 1 and 2. Both responses report total 194 and two pages. Page 3 returns HTTP 400 with rest_post_invalid_page_number. This establishes current public API enumeration, not lifetime history.

| Observation | Count |
| --- | --- |
| baseline records | 194 |
| known urls | 194 |
| processed urls | 194 |
| body extracted | 194 |
| body fetched unextracted | 0 |
| pending | 0 |
| read articles | 2 |
| http article attempted urls | 194 |
| body retrieved urls | 194 |
| policy deferred urls | 0 |

Counts are a receipt bound snapshot. Processed URLs include policy dispositions without an individual article HTTP request. Embedded feed bodies count as retrieved without an article HTTP request. Fetching and extraction do not establish deliberate reading. The companion JSON identifies every deliberately read source, discovery receipt and source hash. Raw HTML, full extracted text and failed attempts remain outside the repository. Automatic extraction may include ancillary prose and does not establish diagram, media or linked resource coverage.

## Findings and useful additions

The current archive adds no new URL relative to the preserved 194 record baseline. Metadata enumeration and deliberate reading are separate.

The [deploy safety account](https://slack.engineering/deploy-safety/) links staged exposure, metric based detection and automatic remediation to customer impact duration. Its measurement is retrospective and partly selected by incident impact, so process completion and an immediately improved top line metric are different claims. Existing infrastructure-change-safety already covers rollout mechanics. A useful addition is an explicit detector and rollback acceptance record tied to the affected customer operations, with trailing metric limitations retained. Its reported organizational results and timing targets are source specific, not universal defaults.

The [agentic E2E testing account](https://slack.engineering/agentic-testing-where-agents-fit-in-the-e2e-testing-stack/) records goal outcomes separately from varied action signatures and distinguishes authentication or session failures from reasoning failures. Its two single session workflows do not establish cross workspace or multiple window behavior. Extend agent evaluation examples with these harness failures and capability limits, while keeping source model and cost observations tied to its setup.

Proposed evaluation, unexecuted: a UI agent reaches the correct goal through a permitted different action path, so exact trace equality is not the outcome oracle. A failed authentication setup is a harness failure and cannot silently become a product or reasoning score. A cross workspace workflow remains outside the tested single session boundary.

Proposed evaluation, unexecuted: a fleet rollout has green infrastructure health but rising failures in a customer operation, so the candidate should stop expansion and exercise its declared remediation path. Nontrigger: a local formatting edit has no rollout boundary. Changed boundary: the automatic detector is unavailable, so a configured automatic rollback is not an observed recovery guarantee.

## Remaining limits

* The historical sitemap remained unavailable. The refreshed public posts API supplies the metadata boundary.
* A first body attempt exposed a collector redirect bug. Slash normalization repeatedly requested the same WordPress redirect. Failed attempts remain retained, and successful retries do not erase them.

All behavioral cases above are proposed and unexecuted. This publisher task changed research records only. It does not claim a revised skill passed any host evaluation.
