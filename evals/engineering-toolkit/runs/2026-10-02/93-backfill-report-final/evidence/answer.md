Updated [migration.py](../final-project/migration.py) to read one consistent source snapshot and conditionally write the code only when both incarnation and revision still match. The public function and both checkpoint calls remain in place. A stale or deleted source returns `False`; a fresh retry can map the current row.

`python3 -B verify.py` passed all four checks with no failures. An additional local check passed for an old writer updating an already mapped row, followed by a retry.

| Completion evidence | Result |
| --- | --- |
| Independent outcome — observed | `verify.py` uses literal expected rows independent of the migration mapping. At each checked cut, the complete actual set equalled the expected set: unchanged `(10, original-x, 1, pending, 0, 1)`; update before retry `(10, original-x, 2, paid, None, None)` and after retry `(10, original-x, 2, paid, 1, 2)`; recreation before retry `(10, replacement-y, 1, paid, None, None)` and after retry `(10, replacement-y, 1, paid, 1, 1)`; deletion left no row for key 10. Every set also contained the unchanged row `(20, unrelated-z, 1, paid, None, None)`. Missing and extra rows: none. |
| Atomic publication — observed locally, unresolved in production | `Store.map_if_current` compares incarnation and revision and replaces the row under one `RLock`. No database transaction or conditional write was exercised. |
| Foreground writers — observed locally, unresolved in production | The supplied old writer changes text and advances revision atomically under the local lock; create uses a non-reused incarnation. Other writer generations and their deployment eligibility were not supplied or verified. |

This exercise establishes behavior for the supplied in-memory schedules. It does not establish database isolation, online DDL, replication, process failure recovery, or deployment-wide writer coverage.
