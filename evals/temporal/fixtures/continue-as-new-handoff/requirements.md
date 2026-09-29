# Account inbox Workflow

A long-lived Workflow receives commands with a stable commandId. Producers
retry until an acknowledgement; duplicate delivery is possible. The handler
awaits a validation Activity before accepting each command. Accepted commands
are then applied serially. Account balance, last applied command IDs, and
accepted-but-unapplied commands determine the state.

The proposed Continue-As-New call starts a new run using only the arguments
shown in inbox.pseudo. Local variables and unfinished handlers are not carried
into that run by this application's contract. Producers target a stable
Workflow ID; run-specific delivery/retry behavior has not been decided.
At the rollover threshold a validation may be in flight or a command may be
accepted just before the handoff. Keep this project unchanged.
