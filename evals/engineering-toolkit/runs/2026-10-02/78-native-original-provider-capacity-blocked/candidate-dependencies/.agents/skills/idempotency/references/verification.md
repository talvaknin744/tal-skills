# Verification at the effect boundary

Select the rows that challenge the proposed guarantee. Define observable counts and durable state before writing the test. A response assertion alone does not establish that work ran once.

| Exercise | Evidence to inspect |
|---|---|
| One intent submitted repeatedly | Stable logical result and effect count within the promised horizon |
| Same scoped token with changed intent | Documented rejection without a second effect or unrelated result disclosure |
| Equivalent representations | The same comparison result, including intentional defaults and exact amounts |
| Different authorized scopes | Independent operation identities and no cross-scope replay |
| Simultaneous contenders | Real shared-store arbitration across connections or workers; one accepted operation |
| Interruption at commit | Rolled-back work is retryable; committed work is recoverable without duplication |
| Remote effect succeeds, response disappears | Original downstream identity and honest reconciliation status |
| Owner resumes after takeover | Stale writes rejected at the actual protected resource |
| Message redelivery after commit | No repeated business mutation; external delivery tested at its own boundary |
| Expiry or rolling upgrade | Promised retention and comparison semantics preserved; unresolved work retained |

Use deterministic barriers or injected failures to force the critical interleavings; avoid relying only on sleep timing or a sequential mock that cannot exhibit the race. Verify the datastore behavior on the database used by the application before claiming cross-process safety. Fakes establish application logic, not provider durability or retention.

For implementation tasks, test the bug and the preserved behavior in the repository's existing framework. Run applicable checks once, then broaden only for a new failure or unresolved risk. Report a trace with the triggering inputs, injected failure, committed records, external-call identities, and result. For unavailable infrastructure, state the exact invariant left untested and the smallest safe proof environment.

Keep guarantees conditional on the tested topology, provider contract, and replay horizon. Do not label fixture-integrity tests or a model's written analysis as execution of the real operation.
