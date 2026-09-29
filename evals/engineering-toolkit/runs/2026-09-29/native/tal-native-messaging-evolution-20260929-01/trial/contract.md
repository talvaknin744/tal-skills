# Account snapshots

This adapter receives complete account snapshots from an at-least-once broker.
The local fixture is a sequential in-memory delivery harness, not a running broker.
An event has `message_id`, `account_id`, positive integer `revision`, and integer
`balance`. IDs are nonempty strings; integer means exact Python `int`, not bool.
These are snapshots, not additive balance deltas.

`Consumer.apply(event)` returns `applied`, `duplicate`, or `stale`. A newer revision
advances only that account's state and appends one `[account_id, revision, balance]`
entry to its effect log. An identical message replay returns `duplicate` with no
effect. A lower account revision returns `stale` with no effect. An equal revision
with the same balance has no new effect and returns `duplicate`, even if its message
ID differs. Other accounts have independent revision sequences.

Reusing a message ID for different content, or sending different balance content
under the current account revision, raises `ConflictingEvent` before changing
state/effects. Malformed input raises `ValueError` without entering retry logic in
this adapter; a real broker's retry/quarantine policy is an integration concern.

`snapshot()` returns `{accounts: {id: {revision, balance}}, effects: [...]}`.
Keep its shape and ordered effect log. No persistence, concurrent delivery, retention
expiry, or external notification guarantee is implied by this local contract.
