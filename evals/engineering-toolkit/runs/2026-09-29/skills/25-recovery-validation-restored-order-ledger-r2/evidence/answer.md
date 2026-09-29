**Writes must remain closed.** The restored state violates the acceptance contract: `r3` is marked completed but has no committed ledger effect. Ledger total is **30**, versus the manifest’s **60**. `restore_exit: 0` establishes import success, not usable recovery. See [contract.md](/tmp/tal-skill-trials-20260929/25-recovery-validation-restored-order-ledger-r2/workspace/project/contract.md:1) and [restored.json](/tmp/tal-skill-trials-20260929/25-recovery-validation-restored-order-ledger-r2/workspace/project/restored.json:8).

Missing acceptance evidence:

- **Reconciled state:** Exactly one matching effect per accepted identity—`r1=10`, `r2=20`, `r3=30`—with no orphan completions, duplicates, unexpected identities, or conflicting amounts. Verify individual rows as well as total **60**.
- **Safe repair protocol:** On an isolated copy, arbitrate attempts using the original identity bound to its immutable payload, with uniqueness or a conditional claim. Reuse matching effects; commit the missing `r3` effect and corrected completion atomically. Hold payload conflicts for resolution. Blind replay could skip `r3` because its completion already exists.
- **Failure and replay tests:** Show the verifier rejects the current snapshot. Demonstrate repeated and concurrent replay, plus interruption between effect and completion, preserve one effect per identity and valid completion state.
- **Restore provenance and isolation:** Record backup identity, restore command/tool version, logs, and evidence that restoration used a new disposable directory rather than the source. Demonstrate a successful repeat restore and validation.
- **Application acceptance:** Exercise a representative operation through the intended application admission path and identity, verify its committed result, and record the time verified usable service is reached.

**RPO:** Zero accepted IDs are missing relative to the supplied manifest; the missing `r3` effect is a consistency failure. Establish that the manifest covers all accepted inputs through the incident and that their payloads remain recoverable. The `11:59` backup timestamp alone does not prove a one-minute RPO.

**RTO:** Import took three minutes, but **eight minutes elapsed from the 12:00 incident to import at 12:08**. With reconciliation and the service probe still pending, RTO remains unestablished; eight minutes is only a lower bound. No numerical RPO/RTO acceptance targets are supplied.

All files remain unchanged. No external services were used.
