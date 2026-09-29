# Preserving code responsibilities

Choose the relevant transformation; a cleanup request does not require every row.

| Candidate | Evidence to gather | Preservation check |
| --- | --- | --- |
| Unused local helper | Closed local visibility; callers and registration paths | Remove only after scope and references agree; run its callers' checks |
| Repeated code | Same owned knowledge and same reason to change | Independent policies remain independently changeable |
| Nested or confusing control flow | Actual return/error/effect boundaries | Existing contract cases survive flattening, including early failures |
| Validation or defensive branch | Input provenance, failure mode, and responsibility | Malformed input still fails through the real boundary |
| Lifecycle bookkeeping | Resource owner and handoff/cleanup protocol | Success, error, cancellation, and pending-work outcomes remain valid |

Keep test inputs explicit when abstraction would hide their meaning. Preserve an
interaction assertion if the interaction itself is promised, such as one external
charge; private lookup ordering normally has a weaker claim to preservation.

For replacement implementations, decide allowed differences before comparing.
Record output normalization rules so the comparator does not erase the defect.
Run an independent contract example as well as differential checks. Repeated
agreement on a finite corpus supports that corpus only.

Treat removal of supported behavior as a deprecation decision: identify users,
migrate or explicitly retire the contract, and verify remaining dependencies.
Keep that work outside a local cleanup unless the user authorized it.

Examples of deceptive simplifications:

- A type assertion changes compiler knowledge, not external runtime validation.
- Stopping new certificate acquisition does not necessarily reject cached
  certificates or an HTTP fallback; prove endpoint retirement at its own boundary.
- Cancellation signals stopping; waiting for owned work and accounting for unknown
  remote outcomes remain separate responsibilities.

These are responsibility checks, not demands to add new mechanisms to an unrelated
edit. Use installed-version primary documentation if the selected boundary relies
on a specific runtime or library guarantee.
