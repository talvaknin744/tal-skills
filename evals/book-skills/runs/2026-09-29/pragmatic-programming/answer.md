Reject the single `POLICY_WINDOW_DAYS` and shared one-argument predicate. Retail returns and employee expenses represent separately owned policies with different change schedules. Keep their public functions distinct. Consolidate the one retail policy across the API, shop copy, and support export.

The next concrete change is retail 30 → 45 days while HR remains at 30. HR’s possible 30 → 14 change is a separate future decision, not part of this release. Preserve inclusive upper bounds and rejection of negative ages.

The smallest proposed source change is two named values in the existing module, each used only by its own function:

```python
RETAIL_RETURN_WINDOW_DAYS = 30
EXPENSE_SUBMISSION_WINDOW_DAYS = 30

def can_return(days_since_delivery):
    return 0 <= days_since_delivery <= RETAIL_RETURN_WINDOW_DAYS

def can_submit_expense(days_since_expense):
    return 0 <= days_since_expense <= EXPENSE_SUBMISSION_WINDOW_DAYS
```

First establish behavior equivalence with both values at 30. A later authorized retail change edits only `RETAIL_RETURN_WINDOW_DAYS` to 45, alongside independent expected results in the tests. Identical comparisons do not justify tying ownership together. No new service, generic policy framework, or helper with flags is needed; separate modules can wait until the existing ownership workflow needs them.

| Representation | Authority and ownership | Proposed update path |
| --- | --- | --- |
| Retail API predicate | Commerce; `RETAIL_RETURN_WINDOW_DAYS` is the authoritative retail value | `can_return` reads the value directly |
| Shop’s stated return window | Commerce; the displayed number is derived from the same retail value | Template reads a generated retail policy artifact and formats the delivery-based sentence |
| Support `return_window_days` column | Commerce; active policy value derives from the same source | Export job reads that release’s retail artifact instead of a literal |
| Employee expense predicate | HR; `EXPENSE_SUBMISSION_WINDOW_DAYS` is independently authoritative | Only `can_submit_expense` consumes it; HR approval and release timing remain independent |

Use the permitted small generated artifact, for example `retail-policy.json` containing `{"return_window_days": 30}`. A small generator imports the authoritative retail value from `policies.py` and writes deterministic JSON. No HR value belongs in that artifact. The API rule continues to use the source directly; the artifact is a distribution format for consumers that cannot import Python.

Generation must be part of the normal build/release path, not a manual copy step. Package the generated file with the corresponding API release, render the shop from it, and configure the support job to consume that same active release’s artifact. Make the consumer edits once: replace the shop’s numeric literal with the generated value and replace the export’s numeric literal with an artifact lookup. Keep the existing export column name and type. The surrounding wording, delivery-based start point, and customer explanation still need Commerce review; sharing a number alone cannot establish that all prose expresses the rule accurately.

The brief says coordinated publication is possible. Use that to activate the API, shop, and export configuration together. At release validation, check the artifact against the source and check the actual rendered page and a produced export row. Reject a stale artifact or an unavailable required field rather than silently falling back to 30. Invalidate any shop cache during activation if such a cache exists. Pin each export run to one policy version so a release during a run does not mix values. Exact build, template, cache, and export mechanisms remain to be inspected: those implementations were not supplied.

Verify change locality with these planned checks:

- **Baseline preservation:** at 30 days, both entrypoints return false for -1, true for 0 and 30, and false for 31. Establish this before introducing the named values.
- **Retail release:** with retail 45 and HR 30, `can_return(31)` and `can_return(45)` are true, `can_return(46)` is false, and `can_return(-1)` is false. `can_submit_expense(30)` stays true and `can_submit_expense(31)` stays false. The rendered shop text must say “Returns within 45 days of delivery.” and an actual export row must contain integer 45 in `return_window_days`. Use literal expected 45 values to avoid having the same erroneous constant generate both implementation and test oracle.
- **Staleness failure:** prepare the 45-day source with a deliberately stale 30-day artifact in an isolated test; release validation must fail. Repeat with the export or rendered template retaining its old literal. Check the real consumer outputs, not only the generator’s JSON.
- **Independent HR change rehearsal:** in a disposable test scenario, use retail 45 and HR 14. Expense day 14 must pass and day 15 must fail, while the retail boundary checks, rendered shop text, and exported retail field stay unchanged. Deterministic regeneration should leave the retail artifact byte-identical. Do not ship the HR change without its own approval.
- **Dependency review:** inspect the source changes and consumer imports after both rehearsals. The retail change should affect its source value, expected retail behavior, and generated outputs, with no HR logic change. The HR change should affect its value and its tests, with no retail consumer edits. Shared packaging or touching the same source file is acceptable; requiring coordinated policy edits is the coupling to remove.

This costs one generator, one small artifact contract, and two consumer integrations. It removes recurring manual synchronization of three copies. These are bounded changes with concrete boundary checks; a disposable architecture prototype would not resolve an additional identified uncertainty.

Reversal requires rebuilding and reactivating the matching API, artifact, shop rendering, and export configuration together. If the artifact interface is later removed, first migrate both consumers; reverting the generator alone would break them. Already produced support exports remain historical snapshots and should not be silently rewritten during rollback. The output format and the release coordination are remaining commitments.

I left the project unchanged and ran one temporary `unittest` method covering 20 cases across the two real functions: ages -1, 0, 14, 15, 29, 30, 31, 44, 45, and 46. All passed against the current inclusive 30-day rules; the module compiled in memory. No actual shop template, export implementation, release tooling, test suite, or history was provided. The generation, integration, stale-artifact failure, and future-change rehearsals are proposed checks, not demonstrated results.
