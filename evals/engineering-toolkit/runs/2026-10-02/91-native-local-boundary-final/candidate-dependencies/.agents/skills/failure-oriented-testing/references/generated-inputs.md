# Generated inputs and independent oracles

Use this branch when a fixed example set is unlikely to cover the risky input
space, when replacing an implementation, or when bytes reach native code.

1. Select the contract's partitions: valid inputs, malformed inputs, boundaries,
   and meaningful combinations. Generate structure when arbitrary bytes mostly
   exercise one trivial rejection. Keep a few explicit examples readable.
2. Write down the oracle's authority and limitations. Differential agreement can
   preserve an old bug; reconcile disagreements with the specification before
   changing expected results. Metamorphic relations need their own preconditions
   (for example, permutation invariance is invalid when order is contractual).
3. Declare admissible errors. A logic harness fails unexpected exceptions and
   wrong error categories. A memory-safety harness may deliberately tolerate
   specified parser rejections, but that gives no application-correctness claim.
4. For native fuzzing, verify the imported binary, compatible pinned build and
   sanitizer instrumentation before interpreting a run. Missing instrumentation
   fails setup. Platform-specific preload or leak-detection settings require
   current maintainer documentation for the selected tool/runtime.
5. Save the smallest explicit counterexample found and replay it outside the
   generator. Record reduction method and explored budget; call it minimal only
   within the reductions actually checked. Preserve crash files outside disposable
   environments. Opaque replay blobs and local example databases can expire.

For replacement checks, compare only contract-relevant fields and predeclare any
allowed differences. Shadow execution of a pure parser is different from executing
an order twice; use isolated data or an effect-free comparison boundary when the
operation has external effects.

**Evidence:** one independently justified expectation, one deliberately wrong
candidate rejected by that expectation, one retained replay, and the actual
implementation identity. A green generator with a broken assertion is not useful.
