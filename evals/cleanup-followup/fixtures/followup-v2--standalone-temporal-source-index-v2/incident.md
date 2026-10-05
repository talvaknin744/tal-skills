# Renewal incident

The renewal Workflow receives an immutable tenant ID, invoice ID, and amount.
The tenant/invoice pair identifies one charge obligation, including Workflow
restarts. A later invoice with the same amount is a separate obligation.
The Activity may execute again after a timeout or Worker crash. A new Workflow
Run ID is assigned when operations reset/restart the renewal.

PayGate accepts a charge and atomically associates its result with a merchant
account plus idempotency key for seven days. Same key and same charge returns
the original receipt; changed amount with the same key is rejected. It exposes
a key lookup during that period. Our automatic recovery deadline is 48 hours.
After key expiry, payment operations require reconciliation before replacement.

Incident: PayGate accepted the charge, but the connection closed before the
Activity received its response. The next attempt charged the invoice again.
No tests or event history are supplied. Keep this project unchanged.
