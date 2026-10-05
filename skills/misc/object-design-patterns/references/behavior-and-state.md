# Behavior and state

Choose by what drives behavior and who owns the decision. The same delegation shape can serve different purposes.

## Selected policy or evolving lifecycle

Use Strategy when a client or composition point selects an interchangeable policy, such as a shipping quotation algorithm. Put only the variable behavior behind the contract; keep shared invariants with their owner. A function parameter can supply the policy when it needs no independent identity or lifecycle.

Use State when an object's current lifecycle phase determines valid behavior and events change that phase. First write the state/event outcomes: allowed operation, side effects, next state, and response to invalid events. Then decide whether state objects improve on a small explicit transition table. State delegation alone does not enforce transitions; assign transition ownership to the context or state handlers and expose only permitted events to clients.

If several contexts use shared state handlers, keep per-instance mutable data in the context or use separate handlers. A shared handler holding one context's data can leak behavior between instances. Strategy normally selects a policy; State evolves through events. An object can need both only when those are independent requirements.

Template Method fits an intentionally shared algorithm whose order belongs to a base type while subclasses supply selected steps. Check base-contract substitutability and hook obligations. Prefer composed policies when steps must vary independently or subclasses need to undo the base algorithm.

Original verification probes:

- Run the same client contract against each policy, including valid edge inputs and promised failures.
- Exercise every changed state/event pair, including an invalid event, repeated event, and independent context instance where sharing matters.
- For a template, demonstrate invariant step ordering and each permitted customization without overriding the entire algorithm.

## Notification or request ownership

Observer fits several independently registered dependents reacting to changes from one owner. Establish subscription and unsubscription ownership, the data each callback observes, and any order or reentrancy assumptions. A callback list can be enough; an event framework requires its own justification. An in-process observer relationship gives no durable delivery or cross-process consistency guarantee.

Command fits a request that must be stored, scheduled, passed around, or reversed independently of the invoker. Specify receiver, arguments, and the moment mutable inputs are captured. Undo needs sufficient prior state or a valid inverse; wrapping a method call cannot make an irreversible effect reversible.

Original verification probes:

- Subscribe, notify, unsubscribe, and notify again; check state visibility and any callback-failure policy the application promises.
- Delay a command while its source input changes; confirm execution uses the intended values.
- Where undo is required, show the actual prior state is restored and define behavior when the inverse is unavailable or fails.
