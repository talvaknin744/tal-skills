# Overnight coverage

Each hospital ward must retain at least one doctor on call. Two doctors may
request time off concurrently through different application replicas.
`schedule.sql` runs on PostgreSQL, configured to Repeatable Read, using a new
transaction per request. The database begins with `(ward='east', doctor='Ada',
on_call=true)` and `(ward='east', doctor='Ben', on_call=true)`.

The trace shows both requests beginning before either commit. Both count two
on-call doctors, each updates only its own row, and both commits succeed. The
next read finds zero doctors on call. The primary key is `(ward, doctor)`.
An engineer proposes `SELECT ... FOR UPDATE` only on the requesting doctor's row
before the count. Another suggests Serializable without changing the retry
code. `requestTimeOff` sends an email after updating its row but before commit.

The business requirement is one or more on-call doctors for every ward after
every committed transaction, while unrelated wards may proceed concurrently.
Do not send a successful time-off email for a transaction that later aborts.
Returning a bounded, retryable conflict to the caller is acceptable; silently
granting both requests is not. Ward rows already exist in a separate
`wards(ward text PRIMARY KEY)` table. The deployment cannot add an extension.
