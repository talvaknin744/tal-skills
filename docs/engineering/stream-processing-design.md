# stream-processing-design

## What it does

Defines the meaning and changing behavior of continuously maintained stream results before choosing operators or tuning state. It separates event time, arrival/processing time, and logical progress, as well as contribution semantics from output delivery.

## When to reach for it

Use it for event-time windows, late data, corrections, temporal joins, finality, or retained state; exclude broker acknowledgement repair and bounded in-process edits.

## It's working if

- The result contract distinguishes arrival, contribution, progress, and externally visible output.
- Each changed operator states time domain, lateness, identity/correction rule, output changes, finality, and retained-state horizon.
- The sink represents chosen inserts, updates, retractions, or final rows, with visible late correction behavior.
- Explicit schedules cover permitted out-of-order, duplicate, correction, replay, and conflicting-payload cases.
- Expected output and retained state are checked; engine/version evidence and remaining limits are reported.

## Where it fits

This is the continuous computation semantics specialist. It neighbors `messaging-reliability` for broker delivery and `microservice-data` for materialized projections and cross-owner reads. See [the stream design skill](../../skills/engineering/stream-processing-design/SKILL.md) and [streaming time and state reading path](../reading-paths.md).
