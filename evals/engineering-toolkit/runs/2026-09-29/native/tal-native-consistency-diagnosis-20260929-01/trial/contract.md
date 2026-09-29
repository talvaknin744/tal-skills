# Counter contract

Python 3.10+ standard library. One `Counter` is shared by threads in one process.
Each completed `increment()` adds exactly one to its observable value. Two
completed increments from zero must yield two, regardless of client ordering.
`value()` returns an integer snapshot.

The optional `after_snapshot` diagnostic callback receives the initially observed
integer once, outside all counter locks, before that call's mutation completes.
It may block while another client runs. It observes a snapshot and does not own
the counter. Preserve this callback behavior and the function signatures.

The supplied verifier runs real Python threads. It uses a barrier in this hook
so both clients observe zero before either proceeds. All waits are bounded.
This is a local semantic invariant; it makes no distributed or crash-durability
claim and does not require any external service.
