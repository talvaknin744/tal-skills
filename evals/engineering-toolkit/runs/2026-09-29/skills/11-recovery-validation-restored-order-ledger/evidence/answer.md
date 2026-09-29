**Writes must remain closed.** `r3` is marked complete but has no matching ledger row, violating the [completion contract](/tmp/tal-skill-trials-20260929/11-recovery-validation-restored-order-ledger/workspace/project/contract.md:1). The [restored ledger](/tmp/tal-skill-trials-20260929/11-recovery-validation-restored-order-ledger/workspace/project/restored.json:13) contains two effects totaling **30**, versus three expected effects totaling **60**. `restore_exit: 0` does not satisfy this application invariant.

Missing acceptance evidence:

1. **Reconciled state:** Resolve the invalid `r3` completion and recover its effect using the original identity `r3`. Demonstrate exactly one committed ledger row per accepted identity: `r1=10`, `r2=20`, `r3=30`, with valid matching completions, no duplicates, and no unexpected effects. Counts and totals alone are insufficient.
2. **Safe replay and rejection:** Demonstrate that repeated replay preserves those exact effects without duplication, and that the acceptance verifier rejects the supplied completion-without-effect state despite a successful restore exit.
3. **Usable service:** Run a representative operation through the intended application admission path and identity in isolation; verify its committed effect and completion. No service probe or reconciliation has run.
4. **Reproducible rehearsal:** Record the actual new disposable target, evidence that it is separate from the source, backup identity and recovery boundary, relevant dependencies and versions, executed commands, restore logs, and validation results.

For **RPO**, all three accepted identities survive, and their payloads are available in the independent immutable manifest. This supports **zero lost accepted inputs within the supplied manifest**, while one required effect is missing. The backup’s one-minute age at the incident is not itself measured RPO.

For **RTO**, import took **3 minutes**, but **8 minutes** elapsed from the 12:00 incident to the 12:08 import. The recovery timer remains open until service is verified usable; neither duration is a completed RTO measurement. No numerical RPO/RTO acceptance targets were supplied.

All files remain unchanged. No external services were used.
