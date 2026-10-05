# Worker rollout integration evaluations

This suite evaluates the focused adoption of the October distributed-systems
research. The four single-skill corpora contain two relevant cases and one
nontrigger each. Their raw fixtures are separate from prompts and private
rubrics; authored cases alone are not passing results.

| Concern | Candidate | Corpus |
| --- | --- | --- |
| Entity reincarnation and merge invariants | `concurrency-correctness` | [correctness](correctness/cases.json) |
| Writer overlap and schema exposure | `infrastructure-change-safety` | [schema](schema/cases.json) |
| Resident work, reserves and reclaim | `overload-control` | [fairness](fairness/cases.json) |
| Clock domains and cancellation completion | `microservice-operations` | [deadlines](deadlines/cases.json) |

The [rollout scenarios](rollout/README.md) use the native worker workflow and its
installed specialist closure. They test coordination and planning artifacts.
The separate [runtime example](../../examples/worker-rollout/README.md) tests
real local signals and PostgreSQL mutations. Neither substitutes for the other.

## Run a single-skill case

Freeze the complete candidates, cases, fixtures and runner inputs into a new
file outside this checkout:

```sh
node scripts/evals/cli.mjs freeze --suite worker-rollout-integration --out /tmp/tal-rollout-freeze.json
node scripts/evals/cli.mjs prepare --freeze /tmp/tal-rollout-freeze.json --skill overload-control --case resident-reserve --out /tmp/tal-resident-trial
node scripts/evals/cli.mjs run --trial /tmp/tal-resident-trial --binary /path/to/codex --execute --timeout-ms 600000
node scripts/evals/cli.mjs verify --trial /tmp/tal-resident-trial --check-id independent-01
node scripts/evals/cli.mjs score-inputs --trial /tmp/tal-resident-trial --out /tmp/tal-resident-score
```

Use fresh paths for every attempt. The model and reasoning settings inherit the
user's configuration. Execute a relevant case for each new capability and a
nontrigger for each affected concern, alongside the unchanged regression cases.
An authored case is unobserved coverage until executed and independently scored.
Follow the [runner guide](../engineering-toolkit/README.md)
for independent scoring, critical gates, sealed evidence and capability limits.
This runner disables child agents and cannot demonstrate native workflow
coordination. It exposes the candidate through normal metadata discovery;
nontriggers do not explicitly request it.

## Protect existing behavior

Use the separate `worker-rollout-regression` suite for relevant unchanged cases
from the draining, concurrency, infrastructure, overload and operation corpora.
For example:

```sh
node scripts/evals/cli.mjs freeze --suite worker-rollout-regression --out /tmp/tal-regression-freeze.json
node scripts/evals/cli.mjs prepare --freeze /tmp/tal-regression-freeze.json --skill graceful-draining --case rolling-worker-drain --out /tmp/tal-regression-trial
```

The legacy cache-fill case predates explicit edit/verifier metadata. This suite
freezes its existing `service.mjs`-only scope and `node verify.mjs` requirement as
execution controls, preserving its original prompt, fixtures and rubric. A
runner change requires a fresh freeze and staging directory; older evidence is
never rebound to new controls. Run the original native worker-workflow fixture
when changing shared roles or workflow instructions. Record old and new results
separately under the [change evaluation contract](../../CONTRIBUTING.md#changing-skills-agents-or-workflows).

Observed results and independent reviews belong in the
[integration evidence](../../research/worker-rollout-integration/2026-10-02/README.md).
Keep failed, blocked and partial attempts, and label model arithmetic, local
fixture checks, native behavior and real runtime evidence separately.
