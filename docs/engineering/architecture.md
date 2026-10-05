# architecture

## What it does

Produce an evidence-grounded decision about system design, migration or an existing architecture.

## When to reach for it

Use for architecture decisions, migrations, technology choices and architecture reviews. Routine implementation and debugging stay outside this boundary. Invoke explicitly with Claude /architecture or Codex $architecture; automatic model invocation is disabled.

## It's working if

- State the decision, system boundary, goals, constraints and material unknowns.
- Trace relevant behavior and attach consequential claims to files, artifacts, source versions or executed observations.
- Compare meaningful alternatives; describe consequence, smallest useful intervention, tradeoff and evidence that could change the recommendation.
- Finish with a verdict, prioritized actions, assumptions and unresolved proof; separate observed checks from proposed validation.

## Where it fits

Compose with a domain skill such as distributed-system-patterns or concurrency-correctness when a specific topology or correctness boundary needs deeper treatment.

Canonical skill: [skills/engineering/architecture/SKILL.md](../../skills/engineering/architecture/SKILL.md).
