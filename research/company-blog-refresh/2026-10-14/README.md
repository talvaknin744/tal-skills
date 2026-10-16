# Company blog refresh and skill improvements

This followup resumes the original 60 publisher survey. The historical inventory,
coverage catalog, selected readings, evaluation cases and results remain unchanged.
The original compressed crawl archive and every listed member were verified before
the new collection began. Fresh publisher reports live in [publishers](publishers/).

- [Skill opportunities](skill-opportunities.md) maps selected and deferred findings
  to their existing owners, source limits and proposed evaluations.
- [Evaluation plan](evaluation-plan.md) separates existing regressions, new
  capability cases, invocation coverage and host limits.
- [Independent review](independent-review.md) retains detected collector failures,
  corrections and the technical review of the selected guidance.
- [Archive manifest](MANIFEST.md) records the verified local crawl asset and
  unavailable original response objects.

## Crawl results

The [independent coverage audit](coverage-audit.md) reconciles all 60 publisher
reports against their retained state and raw response bindings.

| Observation | Count |
| --- | ---: |
| Retained URL identities | 64,635 |
| Scoped article candidates | 60,572 |
| Processed frontier dispositions | 63,075 |
| Actual article HTTP target URLs attempted | 48,267 |
| Retrieved response or alternate source dispositions | 54,008 |
| Automatically extracted prose candidates | 52,872 |
| Fetched responses without substantive extraction | 1,136 |
| Excluded navigation, media and other nonarticles | 4,063 |
| Deliberate reading scopes | 119 |
| Pending HashiCorp URLs after access checkpoints | 1,560 |

These populations differ. Public content APIs and official alternate publication
files can provide bodies without one HTTP request per canonical article URL.
Policy deferrals can produce a disposition without an article request. Redirect
aliases can share a final target, and a successful redirect does not establish
the historical article's content.

The audit verified 66,636 existing object bindings. Three original response
objects are unavailable locally, affecting Cloudflare, Snyk and Elastic. Their
receipts and recovery observations remain retained. Whole evidence integrity is
partial. Historical archive omissions, access restrictions, short or rendered
content, automatic container identity warnings and early source reconstruction
gaps remain explicit in the audit and individual reports.

## Evidence boundaries

Discovery identifies URLs within an explicitly stated publisher scope. An exhausted
frontier proves that the collected queue has no pending work, rather than that a
publisher has exposed every article it ever published. Sitemaps, feeds, archive
pagination and public content APIs can expose different subsets. Reports retain
those differences and any blocked or missing endpoints.

Body retrieval saves the actual response and its digest outside the checkout.
Automatic extraction is a separate observation, with article container and error
classification limits. Deliberate article reading is recorded by URL and reading
scope. Neither a metadata count nor an extracted body establishes that every
article was read or that its technical claims apply to another system.

Authored findings use first party evidence, identify the failure mechanism and
applicability, and distinguish selected changes from further research. Historical
company examples require current protocol or product documentation before they
can support an implementation contract.

## Resume collection

The reusable collector is [blog-crawler.py](../../../scripts/research/blog-crawler.py).
Use its help to select the publisher and an external archive root. Recover the
historical archive into an external directory and verify its recorded digest
before supplying it as the baseline. Explicit source URLs and article lists can
retain publisher specific terminal enumeration without copying raw payloads into
the repository. Successful bodies survive resumed collection. Failed attempts
remain visible when retrying unresolved work.

Keep collector responses, body payloads, request logs, databases and raw model
trials outside the source tree. Compact reports bind the external artifacts by
relative archive member name and SHA256. The repository stores authored findings,
scope qualifications, evaluation plans and independently checked results.

## Selected instruction changes

The selected scope is a dedicated agent evaluation capability, sampled trace
interpretation in performance diagnosis, and database pool compatibility in
database performance. Other findings remain proposed additions until their own
behavioral evaluations establish the changed contract. Packaging validation and
agent behavior are reported separately, with exact candidate identity and any
unavailable host coverage retained.

- [agent-evaluation](../../../skills/engineering/agent-evaluation/SKILL.md)
  evaluates observed tool effects and final state, defensible grades, clean trials,
  repeated outcomes and bounded future trial plans.
- [performance-diagnosis](../../../skills/performance/performance-diagnosis/SKILL.md)
  now separates sampling and missing spans from causal path evidence and keeps
  selected trace percentiles within their measured population.
- [database-performance](../../../skills/performance/database-performance/SKILL.md)
  now checks PgBouncer pool mode, protocol preparation support and state lifetime
  before recommending pool or preparation changes.

The [behavioral review](../../../evals/company-blog-refresh/runs/2026-10-14/independent-review.md)
retains each independently scored observation. Prior partial answers and actual
web restriction breaches remain visible beside fresh controlled trials. The
[preservation receipt](../../../evals/company-blog-refresh/runs/2026-10-14/preservation.json)
binds the original historical records and the versioned current source pointer.

The final source identity is `company-blog-refresh-final-source-03`. Its canonical
catalog digest is `892c1312af8790e366cbb4a7717239e23387a8af7cc8be12724057906cc12f1c`.
The independently scored matrix contains 19 governing observations across the
three changed packages, with every criterion scoring 2. Thirty actual native
executions remain retained in total, including four earlier major partials and
three original built in web capability breaches. These are forward observations,
with broader isolation unverified and Claude behavioral coverage unavailable.

Repository validation passed 595 checks. Collector, archive and coverage auditor
contracts passed separately. Raw evidence remains outside the checkout, changes
are unreleased on the local branch, and publisher access and historical discovery
gaps prevent an exhaustive all articles completion claim.
