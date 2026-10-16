# Pooler compatibility extension evaluation map, version 2

The original [cases.json](cases.json), prompts, rubrics and fixtures remain
unchanged. The additive [pooler compatibility corpus](cases-v2-pooler-compatibility.json)
uses separate synthetic fixture projects. Give responders only one selected
prompt, its project, the installed candidate and declared capabilities. Keep
this map and the rubric out of their context.

| Capability or boundary | Existing regression selection | Additive case |
| --- | --- | --- |
| Application, pool and server wait boundaries | `pool-and-lock` | `v2-protocol-preparation` |
| Actual engine evidence and bounded intervention | `cardinality-skew` | `v2-protocol-preparation` |
| Pool mode and protocol preparation conditions | `pool-and-lock` | `v2-protocol-preparation` |
| Required transaction, tenant and ownership lifetime | `pool-and-lock` | `v2-session-lifetime` |
| Correctness only and copy requests retain their scope | `transaction-only` | `v2-pool-config-copy` |

The added reference is conditional on deployed PgBouncer and a pool mode or
state lifetime question. The skill description and invocation metadata are
unchanged. Select both existing substantive cases and the complete existing
nontrigger set alongside all three additive cases. Report established behavior
and new capability scores separately. Corpus integrity establishes fixture
isolation and schema validity, not agent behavior.

Record the frozen package tree, source attribution, actual host, model and
settings, capability deviations, observable reads, answers, workspace diffs and
independent criterion scores. Preserve failed and partial attempts. The supplied
versions and timing data are synthetic. These cases establish no driver, live
pooler, notification or ownership guarantee. Backend reassignment and state
isolation need authorized runtime verification. Current source execution on an
unavailable host remains a coverage gap unless separately recorded.
