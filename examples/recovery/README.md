# PostgreSQL recovery acceptance

Run a real, disposable logical-backup rehearsal that distinguishes a completed
restore from usable application data. Requires Python 3.9+ (standard library only),
Docker with a local Unix-socket daemon, and enough space for the pinned image.
The first run downloads that image if needed, before the recovery timer starts.

From the repository root:

```sh
python3 examples/recovery/verify.py --output /tmp/tal-recovery-report.json
```

Exit `0` means every expected positive/negative outcome and cleanup passed.
Without `--output`, the full JSON report goes to stdout. A failed run records its
error and completed scenarios; examine `status` and `cleanup`, not only a scenario
count. `report.json` is one recorded execution, bound to the verifier's SHA-256;
rerunning produces different identities, timings, and archive hashes.

The fixture uses PostgreSQL **18.6**, with pg_dump and pg_restore from the same
[digest-pinned official image](https://hub.docker.com/_/postgres). The exact image
is declared in `verify.py` and recorded in every report. Two generated containers
have no host ports, no network connectivity, tmpfs data, unique ownership labels,
and temporary credentials. Application queries use a restricted role over
loopback with SCRAM password authentication. Cleanup removes only this run's
labelled containers and temporary files. No database URL or production target is
accepted. Force-killing the Python process can bypass cleanup; use the unique
container names/labels recorded by Docker to remove that interrupted run's resources.

## What the scenarios establish

| Scenario | Required observation |
| --- | --- |
| Missing application role | Restore and pg_isready succeed; application access fails |
| Dependency repair | Recreate role/grants; identity, schema, known content, watermark, and ledger invariants pass |
| Wrong application password | Existing role with an invalid password is rejected |
| Acknowledged write after backup | Source acknowledged operation 4; recovered history ends at 3; zero-loss claim is rejected |
| Wrong logical identity | Queries succeed but application acceptance rejects another expected system |
| Semantic corruption | A valid archive restores, but a one-cent ledger error violates business invariants |
| Interrupted restore | Stop an actual pg_restore backend at an observed COPY lock barrier; partial state fails despite watermark 3 surviving |
| Fresh retry | Restore the original archive into another empty database and pass all nine acceptance checks |

The order digest covers order IDs and amounts. Separate balance, completeness,
amount, and orphan checks cover ledger semantics. This is an explicit application
contract, not a universal database-integrity check.

## Timing and loss boundaries

The recovery timer starts immediately before target provisioning after the source
acknowledges operation 4. It stops after restoring, repairing the missing role,
and passing application checks. Separate timers record target provisioning and
the `pg_restore` command, including its local Docker exec overhead. Detection,
backup creation, image download, remote transfer, and traffic cutover are excluded.
No production RTO target is supplied or certified.

The unchanged [historical report](history/report-before-timing-correction.json)
predates the independent review's timing correction: its `restore_command_seconds`
incorrectly includes target provisioning. Its values remain preserved under that
original label as historical evidence; use the current report for separate stage
durations.

RPO is one known missing acknowledged operation in this fixture. The recorded
client acknowledgment time gap is not an exact server commit interval or proof
of a general time-based RPO. The source remains alive for comparison: source loss
is simulated. A one-operation loss allowance passes; a zero-loss allowance fails.

## Scope limits

This is a tiny logical pg_dump/pg_restore exercise using tmpfs. It does not run
pg_verifybackup or validate physical backups, PITR/WAL retention, failover,
production storage durability, representative restore throughput, external keys,
HTTP readiness, surviving caches/watchers, stale-owner fencing, or external-effect
reconciliation. The interrupted scenario deliberately restores pre-data separately
and then interrupts non-atomic data loading. It makes no claim about tested
`--single-transaction` behavior.

See the independently installable
[recovery-validation skill](../../skills/engineering/recovery-validation/SKILL.md)
for those conditional recovery concerns and primary source contracts.
