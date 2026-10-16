# Independent review, 2026-10-14

This reviewer did not author the changed skill instructions or responder outputs.
The review follows `AGENTS.md`, the change evaluation contract in
`CONTRIBUTING.md`, and `evals/README.md`. The baseline repository commit was
`07891113a5112650a11e619a248b23c0ffcdc640`. Staged files remained mutable during
initial inspection, so each executed check below records its observed candidate
hash. No publication or production guarantee is assessed here.

## Crawler interruption check

Candidate: `scripts/research/blog-crawler.py`, SHA256
`801f667568f62abfad8e8f6dba0de5836058141cd8829b8fbf08886694396220`.

Observed defect: default discovery resume skips a persisted source before
requeueing its stored continuations. An interruption after persisting a source
with a next link can leave its continuation unvisited on the next default run.
At this candidate, lines 550 and 551 perform the skip, while newly fetched
continuations are queued at line 574. The saved source event records
`continuations`, but the skip does not read that field.

Executed check: import the candidate, substitute a transport that records
requests, and supply a temporary external SQLite archive containing an already
fetched page 1 whose saved event declares page 2. Invoke the actual `run()` with
page 1 as the sole explicit source, discovery only, and default resume flags.
No network request was performed and no repository fixture was modified.

Observed result:

```json
{
  "saved_continuation": "https://example.test/blog?page=2",
  "requests_on_default_resume": [],
  "continuation_refetched": false
}
```

Outcome: fail for retention of an interrupted discovery frontier. This check is
an implementation experiment, not an agent behavioral score or publisher
coverage assessment. The crawler author received the result. A correction and
rerun are pending.

A separate initial observation concerned transient robots policy across body
only or resumed runs. The candidate above refreshes missing policies before
article requests at lines 585 through 597, so that initial body phase concern is
resolved by inspection. Redirect and source traversal policies were not tested.

## Instruction and behavioral review status

The existing performance rubrics preserve connection ownership, container
throttling, required leaf fanout, percentile nonadditivity, pool and lock timing,
plan loop interpretation, parameter skew, transaction invariants, and current
nontrigger boundaries. Rubrics and historical cases remain unchanged.

No responder packet has been scored yet. Candidate skill hashes, exact case
identities, independent criterion scores, activation body reads, efficiency
measurements, and remaining host gaps will be recorded from saved answers and
observable traces. Native Claude behavior is unverified unless a completed,
identified Claude run is supplied. Packaging success will not establish agent
behavior.

### Versioned crawler rerun

The same interruption check ran against SHA256
`c2342990bb8a8bb0f3859cce4b2f7490ff235fd1031b009286cf44b46c92847f`.
The resumed request list contained `https://example.test/blog?page=2`, so the
interrupted frontier case passed. The earlier failed attempt above remains
unchanged.

Inspection of this candidate found a new boundary gap: restoration queues every
saved continuation, while fresh discovery filters continuation hosts against
`allowed_source_hosts`. Saved source events contain the complete continuation
set, including previously rejected hosts. Restoration can therefore fetch a
host rejected during the first run. The crawler author received this finding;
its correction and a focused check remain pending.

Robots fetching uses `kind="robots"`, which bypasses nested robots lookup during
redirect processing. The redirect hop limit bounds that path. No recursive
robots lookup was found by inspection. Redirect behavior was not executed in this
review.

### Performance source boundary inspection

Independently retrieved primary material on 2026-10-14. No technical
contradiction was found in the staged performance additions.

The [PgBouncer feature map](https://www.pgbouncer.org/features.html),
[FAQ](https://www.pgbouncer.org/faq.html#how-to-use-prepared-statements-with-transaction-pooling)
and [configuration](https://www.pgbouncer.org/config.html#max_prepared_statements)
support the guidance separating pool modes, protocol preparation from SQL
preparation, and tracking configuration from application compatibility. The
[PostgreSQL 18 advisory lock documentation](https://www.postgresql.org/docs/18/explicit-locking.html#ADVISORY-LOCKS)
supports the distinct session and transaction release lifetimes. The candidate
retains installed version, state lifetime and invariant checks rather than
promising live compatibility.

[OpenTelemetry sampling](https://opentelemetry.io/docs/concepts/sampling/), the
[tail sampling processor README](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/tailsamplingprocessor/README.md),
[Grafana tail sampling documentation](https://grafana.com/docs/opentelemetry/collector/sampling/tail/)
and [Uber CRISP](https://www.uber.com/us/en/blog/crisp-critical-path-analysis-for-microservice-architectures/)
support the candidate's distinctions among selected cohorts, missing spans,
late arrivals, preselection metrics and uncertain cross host clock ordering.
The candidate treats critical path reconstruction and population claims as
inferences requiring evidence. It does not import historical clock correction
heuristics or current collector defaults as portable guarantees.

This is a source boundary review. No live database, pooler, collector or endpoint
experiment was executed and no agent outcome is inferred from the source checks.

### Crawler scope correction check

Executed a focused restoration boundary check against SHA256
`a902e53e60ae71aee0fe81a62a899aea55bebd0c29814b23e8aca01e533a5350`.
The persisted source declared one continuation on `example.test` and one on
`other.test`, with only `example.test` admitted by the configured source frontier.
The actual `run()` restored and requested the admitted page, and did not request
the other host. Outcome: pass for the observed interrupted frontier and source
host boundary. This mocked transport experiment used only temporary external
state and performed no network request. It does not establish complete publisher
coverage. The original failure and both versioned correction checks remain above.

### Agent evaluation source boundary inspection

The new package retains useful sibling boundaries: ordinary deterministic
software failures continue through `failure-oriented-testing`, and restored
application history through `recovery-validation`. Local fallbacks retain an
observable oracle while leaving sibling specific conclusions unresolved.

The independently retrieved [Anthropic evaluation article](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents),
[OpenAI skill evaluation article](https://developers.openai.com/blog/eval-skills)
and [Hugging Face tooling evaluation article](https://huggingface.co/blog/is-it-agentic-enough)
support outcome verification, calibrated criterion grading, isolated trials,
separate capability and regression cases, positive and negative invocation
observations, shared task comparisons, and distinguishing observed adoption
from correctness or effort. No technical contradiction was found in the staged
instructions.

Independent retrieval of the linked NVIDIA primary page failed in this review.
The candidate source ledger cites an archived primary body. Independent access
to that body remains pending, so this review does not claim to have verified that
specific reading scope. None of these source inspections executes the described
harnesses or establishes the new skill's behavior.

### Versioned NVIDIA archived body inspection

Direct retrieval failure above remains retained. The crawler supplied the
archived primary HTML and derived article text outside the repository. This
review independently read the authored body, from the model versus agent
comparison through the closing related session links, excluding the separately
labeled generated summary and author biographies. The HTML digest is
`8613034dd96d551a89c87f197e34a558ba60399fe44cd91fb6703db7c531388b`,
with 266168 bytes. The extracted text digest is
`79ccb043f8899f03b849f99bbc3d44e6e9fa231e8a86720fa21e2808471d6708`,
with 11770 bytes. Both stored names matched independent SHA256 computation.

The [NVIDIA article](https://developer.nvidia.com/blog/mastering-agentic-techniques-ai-agent-evaluation/)
supports task intent with constraints, scenario specific success, observable
tool behavior and effort per successful task. The candidate appropriately omits
its prerequisite claim about general model benchmark scores and restricts
inspection to observable evidence. No diagrams, linked sessions, toolkit or
model trials were executed by this reviewer. The initial live retrieval remains
failed, while the specific archived reading gap is now closed.

### Behavioral followup status

The separate [independent behavioral review](../../../evals/company-blog-refresh/runs/2026-10-14/independent-review.md)
now retains twelve scored performance cases and one earlier agent package attempt.
All selected performance criteria score 2, but three existing positive attempts
used web tools despite their declared disabled web conditions. Those capability
gaps remain explicit. The earlier agent package attempt is partial for its
future trial reproducibility contract. Final agent package attempts and separately
bound capability retries remain pending. Literal quotations and score bindings
were checked for all thirteen records; no score was inferred from packaging or
source inspection.


### Final behavioral and source status

The [final independent behavioral report](../../../evals/company-blog-refresh/runs/2026-10-14/report-v2-final.json)
binds `company-blog-refresh-final-source-03` and the tested canonical package trees.
The current `agent-evaluation` tree is
`b7ca2295d82249968f739a4fd49ae7483af24e13fd7c3f45f1af98893ba07e24`.
The canonical snapshot digest is
`892c1312af8790e366cbb4a7717239e23387a8af7cc8be12724057906cc12f1c`.
Independent file hash and current repository tree checks matched all three
selected packages to that snapshot.

Thirty observations are independently scored and preserved. Nineteen govern the
current package selection, with every criterion passing, 56 of 56 critical gates
and 104 of 104 major weighted points. Eleven earlier observations preserve prior
agent candidates and replaced web conditions. The full history retains four
partials and three actual web deviations. The repaired agent package passes all
seven fresh observations: both positive cases observed body reads in 3 of 3
normal discovery attempts, and the nontrigger observed zero. Quote audit version
4 checks every score and preserves all prior 23 score file bytes.

All case compliance flags remain false because wider filesystem, rubric and
inherited tool isolation is unproved. The native wrapper disables built in web;
MCP and shell network confinement remain unverified. Generated adapter identities,
untested packages and current source Claude behavior have separate coverage gaps.
Root coordinator receipts show 595 repository checks passing and 90 generated
adapters current, inspected as separate saved evidence. No production guarantee
or causal improvement follows from the source readings, repository checks or
selected behavioral observations. Earlier failures and partial evidence remain
in the append only review and versioned audits.
