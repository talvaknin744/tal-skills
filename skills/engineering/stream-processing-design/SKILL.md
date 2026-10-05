---
name: stream-processing-design
description: Design continuous stream computations for event-time windows, late data, duplicates, corrections, joins, finality, and retained state; route broker acknowledgement repairs separately. Local in-memory date grouping needs no streaming skill.
license: MIT
---

# Stream processing design

Make the meaning of a continuously changing result explicit before choosing an operator or tuning its state. Keep the requested engine, sources, and sink unless their contracts cannot support the required result.

## Establish the result contract

Read the source envelope, query or operator, progress configuration, retained history, and sink. Name the result a user needs and when it may change. Distinguish source event time, arrival/processing time, and engine logical time. Record the source change model, logical identity, key, revision authority, and transaction boundaries; repeated arrival and a newer correction can require different transitions.

For each changed operator, state its time domain, admissible lateness, identity/correction rule, output change model, finality condition, and retained-state horizon. A watermark expresses progress under a policy; it does not prove that earlier real-world events cannot arrive. An input checkpoint or flush barrier establishes a different fact.


**Example:** A clickstream result can use event timestamps for daily totals while separately recording when late clicks arrive.
Completion: the result contract distinguishes arrival, contribution, progress, and externally visible output, with unresolved policy named explicitly.

## Select the relevant branches

For a materialized projection or cross-owner read model beyond operator semantics, hand off to the `microservice-data` skill. If `microservice-data` is not installed, continue with this skill's local guidance, leave conclusions specific to the missing sibling unresolved, and do not guarantee its outcomes.

- For windows, out-of-order or late input, temporal filters, or final output, read [time-and-finality.md](references/time-and-finality.md).
- For duplicate input, source replay, newer revisions, or conflicting payloads under one identity, read [identity-and-corrections.md](references/identity-and-corrections.md). Compose its contribution rule with the selected late-data policy.
- For maintained, historical, or latest-value enrichment, read [joins.md](references/joins.md).
- For TTL, state sizing, historical bootstrap, or replay, read [state-and-history.md](references/state-and-history.md).

Load the branches the request actually needs. For broker publication, acknowledgement, duplicate delivery, or source replay guarantees, hand off to the `messaging-reliability` skill. Broker publication, acknowledgement, and external business-effect guarantees remain separate from operator contribution semantics. The package supplies the streaming contract without requiring another skill. If `messaging-reliability` is not installed, continue with this skill's local guidance, leave conclusions specific to the missing sibling unresolved, and do not guarantee its outcomes.


**Example:** A repeated source record or replayed checkpoint calls for an identity rule before aggregate contribution is chosen.
## Trace output and verify

Trace representative input through admission, identity/revision arbitration, operator state, output changes, and the sink's materialized result. A sink must represent the chosen inserts, replacements, retractions, or final rows. Explain what late corrections and deletions do to an already visible result; choose update/correction/retraction or drop with an observable audit according to the authorized requirement.

Use explicit arrival schedules and progress markers to distinguish alternatives. Include out-of-order input, a same-identity duplicate, a correction, an old-revision replay, and a conflicting payload where those changes are permitted. Check independently expected aggregate or joined values and retained state, including replay near expiry. A changed row count alone does not establish correctness or a memory bound.

In implementation mode, run suitable existing checks or authorized engine tests. Reviews and designs supply proposed checks. Consult [sources.md](references/sources.md) for version-sensitive engine behavior; match actual connector, operator, and sink versions before using product syntax.


**Example:** A late correction can retract the old daily total and publish the corrected total if the sink supports both changes.
Completion: report the selected semantics, state/history limits, demonstrated output and state evidence, and remaining checks. Keep executed validation distinct from proposed schedules.
