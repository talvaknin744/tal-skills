# DoorDash publisher refresh, October 14, 2026

## Coverage and evidence

Preserved 341 public Engineering category article URLs plus one new current visible Engineering landing page locators. Current complete metadata refresh is blocked in direct HTTP.

The preserved October 1 inventory had a terminal Engineering API boundary. The current API and sitemap probes return HTTP 403, and the web landing page has a See More control. No current archive terminal is claimed.

| Observation | Count |
| --- | --- |
| baseline records | 341 |
| known urls | 342 |
| processed urls | 342 |
| body extracted | 0 |
| body fetched unextracted | 0 |
| pending | 0 |
| read articles | 3 |
| http article attempted urls | 341 |
| body retrieved urls | 0 |
| policy deferred urls | 1 |

Counts are a receipt bound snapshot. Processed URLs include policy dispositions without an individual article HTTP request. Embedded feed bodies count as retrieved without an article HTTP request. Fetching and extraction do not establish deliberate reading. The companion JSON identifies every deliberately read source, discovery receipt and source hash. Raw HTML, full extracted text and failed attempts remain outside the repository. Automatic extraction may include ancillary prose and does not establish diagram, media or linked resource coverage.

## Findings and useful additions

The [runtime flag cleanup article](https://careersatdoordash.com/blog/automating-feature-flag-cleanup-at-scale-with-a-multi-agent-llm-system/) shows why flag age and local defaults cannot establish the correct surviving branch. It reads authoritative rollout values and follows constants, injected wrappers and distant call sites. Add a narrow branch to code-and-docs-cleanup: resolve deployed value and scope, retain partially rolled out or operational flags, simplify every reachable consumer and validate preserved behavior. The account uses a human checkpoint and reports one evaluated sample; do not turn these into universal approval or correctness guarantees. Existing user authorization can already provide a resolved target value.

Proposed evaluation, unexecuted: a flag is old but still deployed to only 60 percent of a tenant population, so cleanup cannot infer one global replacement from its code default. Nontrigger: a closed local unused helper follows ordinary cleanup. Changed boundary: a confirmed string target must propagate through an injected wrapper and all callers, and missing rollout evidence leaves retirement unresolved.

The [Cadence fallback account](https://careersatdoordash.com/blog/building-reliable-workflows-cadence-as-a-fallback-for-event-driven-processing/) uses a durable status record and completed step context during gradual workflow adoption. Keep its external effect limitation explicit: persisting completion after an effect cannot itself close the uncertain commit window. Add this as a focused idempotency or temporal reliability scenario rather than another orchestration skill. The article's timeout alignment discussion is not a general exactly once guarantee.

Proposed evaluation, unexecuted: the primary delivery action commits remotely, then acknowledgement or its local completion checkpoint is lost before fallback. The candidate must reuse sink identity or reconcile the effect, and keep uncertainty visible if neither is possible. Nontrigger: a purely local committed transaction can use its actual atomic boundary. Changed boundary: a saved completed marker alone cannot prove that the external effect and checkpoint committed together.

## Remaining limits

* Current direct API, sitemap and robots responses return HTTP 403. One new October 8 locator was discovered through the ordinary web landing page and is retained alongside the baseline. The earlier 341 URL inventory remains historical evidence, not a refreshed current total.
* The current web landing page exposes recent locators and a See More control, not archive exhaustion. Direct body denial is distinct from articles available through ordinary web retrieval.

All behavioral cases above are proposed and unexecuted. This publisher task changed research records only. It does not claim a revised skill passed any host evaluation.
