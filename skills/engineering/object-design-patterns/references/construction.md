# Construction and lifetime

Locate who chooses concrete implementations, who uses them, and who owns their lifetime. Move construction knowledge only when that separation solves the observed coupling.

## Choosing objects or families

A constructor call at a clear composition point can be sufficient. A simple factory function can centralize repeated selection or validation without adding an inheritance hierarchy.

Factory Method is useful when an existing creator's workflow should remain stable while a subclass supplies a product. It entails an intentional extension point; a helper that constructs an object is not automatically this pattern. Verify product implementations satisfy what the creator actually invokes.

Abstract Factory fits a family of related products that must be selected together. Identify the compatibility invariant before defining its interface, such as a renderer and widget set using the same backend. Keep family choice at the composition point and pass products or the relevant factory contract into consumers. If only one independent product varies, a simpler supplier may suffice. Adding a new family and adding a new product kind impose different costs: the latter can require changing every family factory.

Construction abstractions should prevent the relevant invalid combination or make it visible at the boundary. Merely hiding several unrelated constructors behind one class does not establish compatibility. Decide how configuration errors, partial construction failures, and resource cleanup behave when relevant to the objects involved.

## One instance and global access

Distinguish one instance per request, session, process, or other owner from global access. An injected shared instance often provides the needed lifetime with clearer dependencies. Choose Singleton only for an actual uniqueness and access requirement, and state its scope.

If shared mutable state is necessary, account for initialization, concurrent access, teardown, and test isolation. Language/runtime guarantees must be checked for the deployed environment. The book's Java-era implementation recipes are not portable correctness guarantees, and a process singleton cannot establish uniqueness across processes.

Original verification probes:

- Build each supported product or family and exercise the consuming workflow with no concrete-type branches added to the consumer.
- Try the incompatible combination the abstraction is meant to exclude; verify it is prevented or rejected as specified.
- Create separate owners and confirm state and resources have the intended lifetime; a shared object must not leak another owner's mutable configuration.
- Where construction acquires resources, simulate a partial failure and verify the owned resources are released.

Use only probes justified by the requested design. A factory does not create a requirement for dependency injection infrastructure or global registries.
