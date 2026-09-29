# Technical deprecation: focused addition

Checked 29 September 2026. The user selected this addition after a read-only gap
audit. The [source ledger](technical-deprecation.json) separates source reading,
procedural applications, and proposed evaluations. No book text or example code
is included in the new package.

## Scope and fit

The new [technical-deprecation skill](../../../../skills/engineering/technical-deprecation/SKILL.md)
owns retiring a supported technical contract through consumer migration. Existing
cleanup guidance already distinguishes local deletion from removing supported
behavior; service integration handles compatible coexistence, and extraction
handles moving a capability out of a monolith. This addition supplies a distinct
entrypoint for library, API, configuration, and internal-tool retirement.

The package has four short stages with conditional consumer-evidence and
migration-gates references. It separates advisory deprecation, readiness for
removal, and actual removal. Consumers with inaccessible or infrequent use remain
visible uncertainties. Migration ownership is a responsibility to resolve, not a
new agent persona or invented personnel assignment. Private unused helpers,
worker shutdown, and public-product closure policy remain outside its trigger.

## Reading and transfer limits

*Software Engineering at Google*, first edition (2020), official
[Chapter 15](https://abseil.io/resources/swe-book/html/ch15.html), was read completely
in the earlier book research and reread here. It supplies the technical retirement
basis; the structured prior read and source hash remain in
[books-quality.json](../books-quality.json). This does not claim a new full-book
reading. The chapter's Google-specific tools, staffing practices, and controlled
outages are not installation defaults.

Targeted current checks used [PEP 387](https://peps.python.org/pep-0387/) and the
Python [3.14 warnings reference](https://docs.python.org/3.14/library/warnings.html).
Only the ledger's named policy and warning sections were inspected. These support
distinguishing policy state, runtime warnings, static diagnostics, and configured
enforcement. Python's support schedule is not transferred to other projects.

The consumer table, per-behavior replacement checks, allowed/prohibited-use pair,
and retirement acceptance gates are original operational applications. They do
not turn partial observation into proof that every external consumer is gone.

## Proposed independent checks

1. A retirement review must detect an infrequent consumer, a missing replacement
   behavior, and a path that can introduce fresh legacy dependencies.
2. A staged configuration/tool migration must preserve supported offline installs
   and distinguish reverting code from restoring state compatibility.
3. A private unused-helper removal must remain a bounded local change without
   acquiring a deprecation program.

Evaluation fixture and rubric authorship is assigned separately under
`evals/technical-deprecation/`; no evaluation cases are embedded in the installed
skill. The independent author controls the exact prompts and discriminators.
The package author has made no model calls, scored no runs, and performed no live
retirement. Packaging/link checks establish structure only. Independent review
and behavior evidence are separate release records owned by the coordinator.
