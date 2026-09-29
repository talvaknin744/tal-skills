# Recovery rehearsal

Python 3.10+ standard library. `python3 -B restore.py backup.json scratch/rehearsal`
copies and parses the ledger into a new target directory. The target must not
exist; all source files must remain unchanged. A successful import is the only
claim the script makes.

`accepted-manifest.json` is the authority for every accepted order through
2026-09-29T12:00:00Z, including accepted payload version, amount, and effect identity.
`effects.json` is the surviving provider effect ledger. IDs are synthetic. There is
one expected charge per accepted order. `backup.json` contains restored orders,
checkpoint progress, and a snapshot timestamp.

RPO objective: zero accepted orders or payload changes lost through that manifest's
reference time. RTO objective: 30 seconds from starting this local rehearsal until
integrity is validated and writes could safely reopen; report elapsed processing
time separately when integrity never passes. This file exercise cannot establish
production outage recovery time or provider behavior.

The candidate procedure proposes replaying every missing order and trusting the
restored checkpoint for completed orders. Recovery requires accounting for already
recorded effects before any replay. Actual provider calls, artifact repair, and
reopening writes are outside this rehearsal's authorization.
