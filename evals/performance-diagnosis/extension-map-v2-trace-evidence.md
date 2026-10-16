# Trace evidence extension evaluation map, version 2

The original [cases.json](cases.json), prompts, rubrics and fixtures remain
unchanged. The additive [trace evidence corpus](cases-v2-trace-evidence.json)
uses separate synthetic fixture projects. Give responders only one selected
prompt, its project, the installed candidate and declared capabilities. Keep
this map and the rubric out of their context.

| Capability or boundary | Existing regression selection | Additive case |
| --- | --- | --- |
| Correlated path and resource ownership | `held-pool` | `v2-correlated-trace` |
| Required fanout, effective limits and percentile boundaries | `throttled-container` | `v2-correlated-trace` |
| Missing spans, upstream loss and selected cohort population limits | `held-pool` | `v2-selected-incomplete-traces` |
| Presentation only requests remain local | `format-only` | `v2-trace-label-only` |

The changed conditional reference covers sampled trace evidence. The skill
description and invocation metadata are unchanged. Select both existing
substantive cases and the complete existing nontrigger set alongside all three
additive cases. Existing success and new capability success require separate
reporting. A corpus integrity check establishes fixture isolation and schema
validity, not agent behavior.

Record the frozen package tree, source attribution, actual host, model and
settings, capability deviations, observable reads, answers, workspace diffs and
independent criterion scores. Keep failed and partial attempts. These authored
cases establish no production claim, activation threshold or completed runtime
evaluation. Collector operation, real trace clock reconstruction and current
source execution on an unavailable host remain coverage gaps unless separately
executed and recorded.
