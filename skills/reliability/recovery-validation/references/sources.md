# Source cards and limits

Reviewed 29 September 2026. This package is an original synthesis; book text and
vendor examples are not bundled. It has no mandatory sibling-skill dependency.

## End-to-end acceptance

- **Source/read scope:** *Site Reliability Engineering* (Beyer, Jones, Petoff,
  Murphy, editors; first edition, 2016), official complete online chapter
  [Data Integrity: What You Read Is What You Wrote](https://sre.google/sre-book/data-integrity/),
  recovery testing and integrity sections read. Full chapter accessible; no claim
  to reread the entire book for this skill.
- **Trigger/failure:** backup checks pass while required data or dependencies are
  unusable during recovery.
- **Mechanism/conditions:** rehearse the recovery chain and validate independent
  application invariants with declared loss/time objectives.
- **Counterexample/verification:** a checksum can validate transferred bytes;
  it cannot validate business correctness. Record actual service acceptance and
  elapsed stages, including failures. A tiny local rehearsal is not a capacity test.

## PostgreSQL formats and acceptance layers

- **Source/read scope:** PostgreSQL **18** official
  [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html),
  [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html),
  [pg_isready](https://www.postgresql.org/docs/18/app-pg-isready.html),
  [pg_verifybackup](https://www.postgresql.org/docs/18/app-pgverifybackup.html), and
  [continuous archiving](https://www.postgresql.org/docs/18/continuous-archiving.html).
  Relevant options, notes, backup dependencies, and caveats read.
- **Trigger/failure:** an archive restore succeeds while login, invariants, or
  acknowledged writes are missing; interrupted non-atomic restoration leaves
  partial state.
- **Mechanism/conditions:** format-matched tooling plus application checks; use
  an explicit atomicity/retry choice and independent recovery-point evidence.
- **Counterexample/verification:** physical verification does not apply to a
  logical dump. The companion synthetic PostgreSQL 18.6 experiment exercised
  logical restoration and authenticated SQL only; physical/PITR, failover, KMS,
  HTTP admission, and production performance remain untested.

## Restored revisions and surviving consumers

- **Source/read scope:** etcd **3.6** [Disaster recovery](https://etcd.io/docs/v3.6/op-guide/recovery/),
  revision-difference, revision-bump/compaction, and membership sections read.
- **Trigger/failure:** restoring older revisions leaves surviving watch consumers
  with unusable local state.
- **Mechanism/conditions:** documented revision and membership recovery for etcd;
  retain a later-position consumer in the rehearsal.
- **Counterexample/verification:** a new isolated reader does not exercise this
  failure. Verify a surviving consumer rebuilds. This package documents the
  scenario; its PostgreSQL example does not execute etcd.

## Application ownership and uncertain outcomes

- **Source/read scope:** Martin Kleppmann's complete author article
  [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
  (2016), paused-client and fencing discussion. Recovery-epoch and external-effect
  guidance here is an application inference, not a vendor recovery guarantee.
- **Trigger/failure:** a surviving owner or already executed effect outlives the
  restored local record.
- **Mechanism/conditions:** resource-enforced authority plus stable effect identity
  and authoritative reconciliation where the destination supports them.
- **Counterexample/verification:** local-only effects need no external provider
  reconciliation. Exercise a stale owner and a missing result record against the
  actual resource; this package's logical restore probe provides no such proof.

[Matt Pocock's writing guidance](https://www.aihero.dev/skills-writing-for-agents)
informs the activation description, conditional branches, and completion gates.
