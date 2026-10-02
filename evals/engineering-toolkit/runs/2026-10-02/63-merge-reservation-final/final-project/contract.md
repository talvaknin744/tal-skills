# Reservation and display contracts

This is a synthetic local review. Two regions may be disconnected. The initial
inventory of SKU `seat-1` is one unit. Each accepted reservation is final, for one
unit, and identified by a distinct operation ID. The acceptance rule is that the
total quantity of accepted, unreversed reservations for the SKU never exceeds
one. Both region APIs currently return `accepted` before exchanging state.
Neither successful reservation is provisional, and no cancellation or
compensation capability has been supplied.

The display endpoint may show an incomplete regional view for up to 60 seconds.
It is advisory and cannot itself authorize a final reservation. No requirement
for the newest display value at response time is imposed. Successful reservation
receipts are durable facts of this scenario, not evidence from a real database.

Each replica stores a set of reservation records. Complete records merge by set
union; duplicate delivery of the same operation is harmless. Operation IDs A and
B are different legitimate requests. The region APIs atomically check their own
set before adding a reservation, but no common acceptance authority or allocated
rights are currently used. Union is associative, commutative and idempotent for
these records. Those mathematical properties are supplied facts; their
implications for the stated acceptance rule are the review question.

`observations.json` is an authored history, not a captured trace.
`observe.py` performs only deterministic set arithmetic. Its exit status means
the script completed, not that the proposed release is correct. You may run it
with `python3 -B observe.py`; preserve every supplied file. Do not contact services,
install packages, run a model, or claim production/datastore validation.
