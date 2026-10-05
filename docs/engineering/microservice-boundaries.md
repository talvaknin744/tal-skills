# microservice-boundaries

## What it does

Chooses business capability boundaries that let useful changes ship independently. It treats a service as an owned capability with contract and state, rather than a target size or a process per entity.

## When to reach for it

Use it to choose or review service boundaries, assess a proposed split, or diagnose a distributed monolith's coupling. It covers capability decomposition and ownership; routine module refactoring and general architecture reviews are outside its trigger. When a boundary is selected and extraction work begins, move to `microservice-extraction`.

Invocation: automatic

## It's working if

- The decision states a concrete goal, evidence or assumption, and measurable condition for improvement.
- Affected capabilities, invariants, authoritative state, and ownership homes are mapped; contested ownership is visible.
- Each candidate boundary has an evidenced benefit, dominant cost, and change or failure scenario that could invalidate it.
- Each proposed boundary has an owner and contract, with material coupling treated or recorded as an unresolved decision.
- The next step tests the claimed benefit, including comparison with retaining or combining modules/services.

## Where it fits

This is the service decomposition decision specialist. It precedes `microservice-extraction`, and uses `microservice-data` for cross-owner invariants or `microservice-integration` for communication seams. See [the boundaries skill](../../skills/engineering/microservice-boundaries/SKILL.md) and repository [reading paths](../reading-paths.md).
