# architecture

## What it does

Produce an evidence-grounded decision about system design, migration or an existing architecture.

## When to reach for it

Use for architecture decisions, migrations, technology choices and architecture reviews. Routine implementation and debugging stay outside this boundary. Invoke explicitly with Claude /architecture or Codex $architecture; automatic model invocation is disabled.

Invocation: user-invoked. Claude Code: /architecture. Codex: $architecture. Automatic invocation is disabled.

## It's working if

- The decision states the decision, system boundary, goals, constraints and material unknowns.
- The review traces relevant behavior and links consequential claims to files, artifacts, source versions or executed observations.
- The decision compares meaningful alternatives and records consequences, the smallest useful intervention, tradeoffs and evidence that could change the recommendation.
- The report ends with a verdict, prioritized actions, assumptions and unresolved proof, with observed checks separated from proposed validation.

## Where it fits

Compose with a domain skill such as distributed-system-patterns or concurrency-correctness when a specific topology or correctness boundary needs deeper treatment.

Canonical skill: [skills/engineering/architecture/SKILL.md](../../skills/engineering/architecture/SKILL.md).
