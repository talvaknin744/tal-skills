# Prove coexistence and cutover

Use this for a staged extraction's release plan or implementation. Keep each gate tied to a user journey or data invariant.

## Compare behavior

Characterize the old behavior consumers rely on, including errors, authorization, and asynchronous completion. Keep an explicit decision record for intended differences so comparison does not preserve a known defect by accident.

For parallel runs, send only one path's result to the user. Isolate or suppress writes, notifications, charges, and other irreversible effects in the comparison path. Compare normalized outputs and business outcomes while accounting for timestamps or nondeterminism. A shadow run that accidentally performs both effects is an additional production execution.

Exercise old consumers against the new implementation and the supported version overlaps. Cover background workers and delayed messages as well as request routing. A sticky cohort may be necessary when a workflow spans several calls; choose routing rules that preserve its data authority.

## Set gates

For each stage record the signal, target, observation window, decision owner, and action on failure. Use project targets for correctness, latency, errors, migration lag, and relevant resource use. If targets are unknown, mark the proposed values and the decision needed; do not invent a claim of acceptable performance.

Exercise the relevant failure windows: during the initial copy, before final catch-up, during routing changes, after a new write, and during worker recovery. State whether each is locally demonstrated, rehearsed in a representative environment, or still unverified.

## Recover and retire

Write recovery instructions around current state, not only version numbers. A route toggle can restore code selection while leaving the selected code with stale data. If reverse synchronization is required, describe how it preserves new writes, deletions, and schema compatibility before reopening old writers.

Keep the old implementation until its agreed recovery window and checks are satisfied. Then remove obsolete writers, routes, toggles, permissions, and migration jobs within the authorized scope. Retirement is complete when supported consumers use the intended contract and monitoring no longer shows dependence on the old path.
