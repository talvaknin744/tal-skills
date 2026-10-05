# Choose the feedback mechanism

Use this reference when an uncertain feature, unfamiliar dependency, or proposed integration needs evidence before broader investment.

## Disposable prototype

Choose a prototype to answer a specific question about interaction, feasibility, data shape, or an algorithm. List the question and the aspects the experiment deliberately omits. A drawing, data sample, or small script may be enough.

Treat its result as knowledge. Keep throwaway code separate from the production path and make its disposal explicit before presenting it. A successful screen demonstration establishes only the behavior actually exercised. If the deliverable must become production code, choose a retained slice with the necessary engineering from the start.

For performance questions, match the variables that determine the claim: runtime, input size and distribution, resource constraints, and dependency latency. A convenient language or local fake may answer a relative algorithm question while being inadequate for an absolute response-time commitment. Report the measurement's limits.

## Retained tracer bullet

Choose a tracer bullet when the main uncertainty is whether the real parts work together or whether a user can complete the intended path. Select one narrow scenario that crosses the critical boundaries from input to an observable result. Preserve the project's required error handling, tests, and code structure for that scenario; defer feature breadth.

Name which components and contracts are exercised and which remain substituted. A local or authorized test environment can prove a scoped integration, but a substitute cannot prove the dependency it replaces. If access is missing, leave that part of the claim unresolved and specify the remaining check.

Build the slice so subsequent behavior can extend it. Observe the result with the intended consumer or a check representing their need, then revise the approach if it misses the target. A successful connection is useful evidence; it does not establish all required failure, scaling, or usability properties.

## Close the experiment

Record the question, setup, result, and consequent decision. Distinguish measured results from predictions and proposed checks. Retain the tracer's working path and regression checks; retain only the prototype's relevant findings unless the user explicitly needs the disposable artifact.

When preserving existing behavior, use a representative behavioral check as the feedback loop instead of inventing a separate prototype. Confirm that the check distinguishes the failure being addressed when its sensitivity is uncertain. Keep temporary deliberate faults isolated and remove them before delivery.
