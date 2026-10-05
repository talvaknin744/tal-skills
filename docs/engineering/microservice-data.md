# microservice-data

## What it does

Makes service data ownership, cross-service consistency, workflow recovery, and read-model freshness explicit for a business operation. It distinguishes authoritative records from projections and does not treat a saga as whole-process atomicity.

## When to reach for it

Reach for it when splitting shared tables, replacing cross-service transactions or joins, modeling sagas, or publishing reporting/query projections over service-owned data. Single-database tuning belongs to `database-performance`; single-operation retry deduplication belongs to `idempotency`. For service boundary choice, use `microservice-boundaries`; for message delivery mechanics, use `messaging-reliability`.

## It's working if

- Every affected write, mutable concept, and constraint has an owner; cross-owner access is evidenced or marked unknown.
- Each invariant has local enforcement or explicit distributed semantics, including allowed intermediate state and lag.
- Every partial workflow outcome has a valid next state, responsible actor, and way to detect stalled work.
- Each affected read names its source of truth, freshness contract, and stale/missing-data behavior; new projections include bootstrap and repair.
- Claims about invariants and recovery outcomes are demonstrated or marked unverified with the next check.

## Where it fits

This is the cross-service data and workflow specialist. It neighbors `microservice-boundaries` for ownership decisions, `microservice-integration` for interaction contracts, and `messaging-reliability` for broker delivery. See [the data skill](../../skills/engineering/microservice-data/SKILL.md) and [stale-read reading path](../reading-paths.md).
