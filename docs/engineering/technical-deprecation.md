# technical-deprecation

## What it does

Retires a supported technical contract through evidenced consumer transitions. It separates discouraging new use from approving removal; warnings, deadlines, or a replacement launch do not prove removal is safe.

## When to reach for it

Use it for retiring a supported library, API, configuration option, or internal tool when consumers must migrate, replacement readiness, stalled deprecations, or removal gates. It excludes private unused-helper cleanup, worker draining, and public product shutdown policy. Use `microservice-integration` for contract design and `microservice-testing` for consumer/provider verification.

## It's working if

- The target contract, permitted behavior changes, accountable role, support policy, and requested stage are explicit.
- Known consumers and their relied-on behavior are evidenced; evidence coverage and unknown consumers are visible.
- Replacement behavior is compared against consumer contracts and migration progress has named transitions or unresolved gaps.
- Each gate has an owner and observable evidence; unresolved consumer risk is not silently treated as approval.
- The requested stage is checked or its next step is concrete, and completion claims identify stage, evidence, and remaining limits.

## Where it fits

This is the supported technical contract retirement specialist. Compatibility means preserving the behavior existing consumers rely on under the stated support policy. It neighbors `microservice-integration` for compatibility planning and `microservice-testing` for provider evidence; `graceful-draining` covers worker lifecycle rather than public contract retirement. See [the deprecation skill](../../skills/engineering/technical-deprecation/SKILL.md) and [supported contract retirement reading path](../reading-paths.md).
