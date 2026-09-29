# Isolating an obstructing dependency

Use this branch when the affected code cannot be instantiated, linked, or observed in a useful test. First name the obstruction and the behavior the real code must still execute. Select the least disruptive substitution point that removes that obstruction.

## Select a boundary

| Obstruction | Candidate edit | Evidence needed |
| --- | --- | --- |
| Collaborator already arrives as an argument | Supply a recording or controlled implementation; introduce a narrow interface only if the language requires it | The replacement accepts the calls the real path makes and exposes the relevant effects |
| Constructor creates the collaborator | Accept it through a constructor parameter; retain the existing creation path for ordinary callers | Existing callers retain defaults and tests can instantiate without triggering unwanted construction |
| Method creates a short-lived collaborator | Parameterize the method or delegate through a small factory | Creation frequency, initialization order, and lifetime stay consistent |
| Global, singleton, or free-function access | Route only the affected calls through a replaceable object, or use a scoped replacement of an existing reference | Every access on the exercised path reaches the replacement; original state is restored after the test |
| Build or link dependency prevents a focused harness | Isolate the necessary interface or, when the build supports it, substitute the dependency at link time | The test and production artifacts select the intended implementations and preserve the signatures the caller uses |

An interface can isolate a dependency's type without removing eager initialization, module loading, or transitive construction. Trace those paths before treating the dependency as separated.

## Keep the test about the real behavior

A recording substitute is useful when the result is an interaction: emitted content, argument values, or an important ordering constraint. A harmless substitute is sufficient when the dependency is irrelevant to the assertion. Assert behavior relevant to the task rather than every incidental call.

An override may bypass more than the unwanted dependency. If a testing subclass replaces the calculation, parsing, formatting, or branch being changed, move the substitution boundary outward until that logic executes. Prefer an existing argument boundary when it is sufficient; the presence of a legacy dependency does not justify a new application framework.

If no tests exist before the enabling edit, keep that edit mechanically reviewable: add a parameter, redirect a call, or introduce delegation without relocating or rewriting business decisions. Use compiler feedback and any accessible boundary checks, then immediately capture the newly reachable behavior. Explain the remaining uncertainty if no pre-edit executable check was possible.

## Respect construction and shared state

Verify constructor dispatch and initialization rules in the actual language. In C++, a virtual call from a base constructor does not reach a derived override. In languages where an override is reached, derived state may still be uninitialized. A factory override is useful only when it actually prevents the original construction and preserves needed initialization.

Replacing a field after construction cannot undo connections, writes, or other effects already performed by the original constructor. For those effects, substitute before construction. Preserve ownership and cleanup when passing or replacing collaborators; a test object must not be destroyed twice or retained beyond its lifetime.

For a temporary global replacement, restore the original value through guaranteed cleanup even when an assertion fails. Prevent concurrently running tests from observing each other's replacement, or choose instance-level injection instead. Treat a new public setter as a production interface change and prefer the narrower existing mechanism when one suffices.

Finish by checking both the test path and the ordinary construction/call path. If the latter needs an unavailable dependency, state that limit and the integration check still needed.
