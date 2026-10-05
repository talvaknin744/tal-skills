# Structure and interfaces

Start from what the client should see. Several patterns wrap objects, but their obligations differ.

| Design pressure | Candidate | Contract to establish |
| --- | --- | --- |
| Existing provider has the wrong interface | Adapter | Translate inputs, outputs, errors, and units into the client's contract. |
| Optional responsibilities should compose through the same interface | Decorator | Preserve the component contract while defining the added behavior and wrapper order. |
| Client needs a smaller entry point into a subsystem | Facade | Own the supported sequence of subsystem calls and expose meaningful failures. |
| Access to an object needs mediation | Proxy | Preserve the advertised contract while making access, latency, or failure differences explicit. |

A renamed method is insufficient adaptation when units, missing values, iteration operations, or errors differ. If the provider cannot deliver an operation the client requires, surface that incompatibility; choose a narrower truthful contract or change the integration deliberately.

A decorator should remain usable wherever the component is accepted. Inspect clients for concrete type checks, identity assumptions, extra methods, and reliance on exact ordering. State the actual behavior added: encryption followed by compression can differ from compression followed by encryption. A wrapper that translates to a new interface has a different purpose even if its code looks similar.

A facade reduces how much subsystem coordination a client must know. Place policy at the appropriate owner and keep the facade's entry points coherent; a growing list of pass-through methods may simply move coupling. A proxy's resemblance to a local object does not remove remote failures or establish authorization rules by itself.

## Collections and trees

Iterator is useful when traversal should be independent of storage representation; prefer the language's iteration protocol when it meets the contract. Specify order, exhaustion, and mutation behavior when clients rely on them.

Composite fits recursive part/whole structures whose leaf and group operations have useful common meaning. Establish the operations each kind can truthfully support. A uniform interface that makes normal leaf operations fail may cost more than separate capabilities. Check traversal and aggregation semantics, including empty groups and any allowed shared nodes; require cycle handling only if the model admits cycles.

Original verification probes:

- Exercise the adapter through the target client contract, including conversions and provider failures. Where native implementations of that contract exist, run the same contract checks against them.
- Test meaningful decorator combinations and order, with a single observable underlying effect per operation where promised.
- Exercise a facade failure halfway through its sequence and confirm the documented result or recovery behavior.
- Traverse an empty and nested collection, checking the promised order and aggregate result without exposing its internal representation.

These probes are engineering applications of the patterns, not examples reproduced from the source book.
