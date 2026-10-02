Repaired [migration.py](../final-project/migration.py). The backfill now reads status, revision, and incarnation from one snapshot, then conditionally writes the code only if that same source incarnation and revision still exist. The public function and both checkpoint calls remain in place.

`python3 -B verify.py` passed: **4 checks, 0 failures**.

| Evidence | Result |
| --- | --- |
| Independent outcome — observed | The verifier’s literal expected rows matched the complete actual sets after an unchanged row, an intervening update, a delete and recreate, and a deletion. Retries mapped the current rows. Missing and extra rows: none. |
| Atomic publication — observed locally | `map_if_current` guards and writes under the in-memory store lock. Database transaction atomicity remains unverified. |
| Foreground writers — observed locally | The supplied old writer advances the source revision on updates and leaves the derived fields untouched. Other writer generations and deployment admission rules are unspecified. |

This exercise establishes the behavior for the supplied deterministic schedules. It does not verify database isolation, replication, process failure, or a production rollout.
