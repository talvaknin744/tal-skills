# Runtime boundaries

Use this reference when a handler, worker, or integration accepts values from outside its trusted domain.

| Trigger | Failure mechanism | Change and verification |
| --- | --- | --- |
| A typed request comes from JSON, a queue, or a database driver | Type assertions and generated interfaces do not validate runtime values | Parse from `unknown`, check required fields and the intended unknown-field policy, then construct the domain value. Exercise malformed inputs through the real decoder. |
| A numeric value controls money, limits, or counts | Strings, fractions, non-finite values, overflow, or coercion bypass the intended constraint | State the numeric representation and range. Test edge values and booleans. Choose integer/decimal representations for the domain instead of assuming every JSON number is safe. |
| Several services normalize an identity | Different defaults, whitespace rules, or payload versions map one operation differently | Define the accepted wire contract and stable identity explicitly. Compare normalized intent, including tenant scope, before replay. Keep cross-language fixture cases. |
| An adapter returns a success-shaped object after an exception | Transport or database failures become domain success | Model known rejection, dependency failure, cancellation, and unknown effect separately. Verify each observable outcome, including errors after effect dispatch. |

Keep validation proportional to the API. Rejecting all extra fields fits a strict command, but can break a deliberately extensible event envelope. A broad runtime schema library is useful when it serves an existing contract; a small validated command does not require an invented framework.

Read the actual compiler configuration. `strict` helps static reasoning; it cannot prove an incoming JSON value or database result. Avoid assertions that manufacture invariants the parser has not established. At an adapter boundary, narrow driver errors before using fields such as SQLSTATE.

Completion evidence: accepted and rejected wire examples, the resulting domain value, and a separate successful typecheck. Type-only code changes need static verification appropriate to their public API rather than an unrelated database harness.
