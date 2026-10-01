# Independent stream-processing review

Reviewed 2026-10-01 by the quality research agent, which did not author this
package or its cases. Scope: the frozen `skills/messaging/stream-processing-design`
package, all three `evals/stream-processing-design` fixtures, case prompts and
rubrics, and their evaluator guide. No package or fixture was changed. No model,
streaming engine, broker, sink, or migration was run.

## Findings

**P2 — Qualify both halves of a correction that moves a contribution (resolved).**
`references/identity-and-corrections.md:7` says to remove the prior contribution
and add the replacement where the time policy permits. That leaves the first
half less clearly conditional than the second. A correction can move a record
from an immutable finalized window into an open window, or from an open window
into an inadmissible closed window. Removing the old contribution before checking
both windows can change an immutable result or lose the accepted contribution
when the replacement is refused. Require revision arbitration and the applicable
policy for both removal and admission before committing the result transition.
If either side is forbidden, reject/audit the correction or use an explicitly
authorized compensation policy; do not silently perform half a move. This is a
clarification of the general branch composition, not a demonstrated failure on
the current fixtures, whose event timestamps and device stay fixed.

Rechecked the author's final guidance correction: it now arbitrates revision and
admission for both sides before mutation, requires one recoverable disposition,
and preserves state plus accepted revision when immutable finality forbids either
side. The added A-final/B-open and symmetric schedules, including restart replay,
resolve the wording finding. These are proposed schedules in the reference, not
new executed cases. Rechecked identity-reference SHA-256:
`b64d0bdb4201d3f913fb18938f3e796a853bbb59d222a80fc9fa13eb1cf8dd8c`.

**P2 — The new cases still need scenario-index integration (resolved).**
The targeted corpus test failed all three case membership assertions because
`evals/engineering-toolkit/scenario-index.json` lacked their IDs when checked.
This is root-owned integration work, not a defect in the package's case values.
The test passed the two-positive/one-nontrigger count and reached the final index
membership assertion for every case after its prompt, capability, rubric, path,
and fixture-isolation assertions. Re-run after integration rather than treating
this result as a completed corpus validation.

Rechecked after root integrated the IDs: the targeted stream corpus check now
passes all four tests (case count plus all three case contracts), with zero
failures. The integration finding is resolved; this is corpus integrity evidence,
not a native behavioral score.

## Contract and case assessment

The activation description is scoped to continuously maintained computations;
its explicit bounded-collection exclusion matches the local grouping nontrigger.
Branches are conditional and use local references, so the package can be installed
independently. Output semantics, identity/revision authority, progress, admission,
and retained evidence are distinct. Product-dependent syntax remains subject to
actual connector/operator/sink versions.

The window fixture's required custom policy admits late changes until *both*
partition watermarks reach the end. Its aggregate oracle is consistent:
`5/1 → 15/2 → 15/2 → 18/2 → 25/3 → 25/3 → 25/3`; output becomes immutable at
12:08, and e4 does not change it. The rubric correctly preserves one contribution
per logical event, replacement revision authority, and audit of a conflicting
same-version payload. It does not infer physical completeness from a watermark
or checkpoint. This policy must not be translated mechanically to an engine
that drops input at an earlier watermark boundary.

The historical fixture is also internally consistent: f1 contributes one keyed
reporting row at USD 110, remains one row after replay, changes to USD 115 after
the historical correction, then becomes unmatched after withdrawal. Its current
10:00 rate cannot supply a 09:30 historical match. The sink rubric accepts both
retraction and explicit unmatched representations, so it does not force one
unrequested transport representation. The local fixture preserves both identical
intentional amounts and totals 7 and 4 under the supplied dates.

These cases provide useful initial discrimination. They do not exercise moved
keys/windows, fact deletion followed by old replay, snapshot/live overlap,
far-future pending state, or idled-input resumption. Those are coverage limits;
passing three cases would not validate every branch in the package.

## Evidence and verification limits

Current primary documentation was inspected to cross-check narrower engine claims:
[RisingWave watermarks](https://docs.risingwave.com/processing/watermarks) confirms
that event-time TTL can ignore expired changes while leaving downstream results;
[emit-on-window-close](https://docs.risingwave.com/processing/emit-on-window-close)
uses watermark closure for immutable output. Its wording uses “surpasses,” while
the fixture expressly defines reaching the boundary; the skill correctly asks
for the installed comparison rather than importing the fixture rule universally.
[Decodable temporal joins](https://docs.decodable.co/pipelines/joins/temporal-joins.html)
distinguishes historical and processing-time latest lookup.
[Flink deduplication](https://nightlies.apache.org/flink/flink-docs-stable/docs/sql/reference/queries/deduplication/)
displayed v2.3.0 and orders first/last rows by selected time attributes; that does
not itself supply the fixture's revision authority.
[Materialize temporal filters](https://materialize.com/docs/transform-data/patterns/temporal-filters/)
describes scheduled inclusions and retractions, supporting the visible-versus-pending
state distinction. This was a targeted documentation check, not a reread of all
historical article bodies or an execution of their examples.

Executed `node --test --test-name-pattern='stream-processing-design'
tests/engineering-toolkit/evals.test.mjs`: one passed, three failed only at case
index membership. The earlier global `node scripts/check-skills.mjs` passed all
packages and local references. Neither check establishes behavioral quality.
Native trial scoring remains pending until root supplies captured answers and traces.

Reviewed case SHA-256:
`946019c3a7dda57bc0c13f70d4848c1744712b1fd4df50203427bf50e8392bb8`.
Original reviewed identity-reference SHA-256:
`8b7e05f3bb6b466ff065030b00679af36a2f6aaef8c605c7b7fa6a1b784a4213`.
