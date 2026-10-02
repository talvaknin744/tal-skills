# Worker rollout input

The service uses Python 3.14.8. The user request has a 500 ms useful response
target, measured from handler admission, including connection acquisition.
An upstream cancellation or earlier deadline must also be honored. The current
pool acquisition interface has no independent timeout parameter.

Each connection belongs exclusively to its active send, including cancellation
cleanup. `pool.release` makes it available for another handler immediately.
`carrier.send` can accept a shipment before its response arrives. Its cancellation
handler performs asynchronous socket cleanup before returning; requesting
cancellation is not an adapter completion receipt. There is no documented maximum
cleanup time or forced-stop guarantee. Shipments have a stable `shipment_id`, and
the carrier receipt lookup can reconcile acceptance before a later resend.

The supplied trace is a synthetic adapter timeline for review, not an executed
Python test. `loop_seconds` is the owning event loop's clock, and
`wall_epoch_seconds` is a separate epoch observation. The snippets and trace
are raw inputs; no external carrier or pool implementation is supplied.
