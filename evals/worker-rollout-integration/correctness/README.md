# Correctness evaluation inputs

These are exactly two triggering cases and one nontrigger for the existing
`concurrency-correctness` skill. They are authored inputs, not model results.

| Case | Task | Local check |
| --- | --- | --- |
| `cache-incarnation-snapshot` | Repair only the local cache client | `python3 -B verify.py` |
| `merge-reservation-boundary` | Read-only acceptance and display review | Optional `python3 -B observe.py`; observation, not acceptance |
| `immutable-label-format` | Change only one string formatter | `python3 -B verify.py` |

For a candidate trial, copy only the selected fixture directory. Supply only its
case prompt, declared tools and independently installed candidate skill. Keep
`cases.json`, this README and calibration records outside the candidate workspace.
The rubric is withheld in `cases.json`; protected behavioral verifiers specify
public contract observations and contain no suggested implementation. No web,
subagents, packages, credentials or external services are required. Python checks
use standard-library functionality with `-B` and must not use optimization.

The cache adapter supplies an ordered, authority-allocated incarnation and
atomic cache transitions. The verifier forces separate delete/recreate,
payload/token capture and compare/unchecked-write races, then checks literal
expected identity sets and values. It does not derive expected values by calling
the candidate or prove real cache/database, cross-store or crash guarantees.
The merge observation is finite set arithmetic. The nontrigger is an immutable
local formatter despite the word revision in its input.

Source attribution uses the reviewed
[schema-evolution example](../../../docs/research/distributed-systems-followup/2026-10-01/schema-evolution.md)
for the independently authored incarnation/revision, consistent-read and
bidirectional-oracle obligations, and
[coordination findings](../../../docs/research/distributed-systems-followup/2026-10-01/coordination-design.md)
for separating merge convergence, invariant preservation and freshness.
The former includes a full 12-page F1 reading; F1's engine schema leases are not
the cache adapter's protocol. The latter records complete extracted CALM v2 main
text §§1–6 (figures not visually inspected) and Bailis's complete 2014 author
explanation (comments excluded); linked papers/theses were not additional reads.
The histories, code and criteria here are original synthetic fixtures.

These nested cases use the integration coordinator's corpus routing/schema
support rather than the legacy single-skill corpus path convention. No runner,
skill or legacy corpus is changed by this subtree. Author calibration, when
recorded, establishes verifier sensitivity and a scratch positive control only;
it is not behavioral model evaluation or independent scoring.

[Author calibration](calibration.json) records the faulty cache baseline,
separate partial repairs, and a full scratch control. The formatting baseline
and scratch formatting control are separate. Corrected control bodies remain
outside the repository and are not candidate inputs.
