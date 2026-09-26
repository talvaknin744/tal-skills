# Idempotency storage rollout

POST /v1/shipments validates a request, derives a normalized command, and stores
a hash next to a tenant/operation/client key. A successful record also stores
the result. Records can be `pending`, `unknown`, or `completed`. Provider
creation can succeed before a network timeout; staff reconcile unknown records
using a stable downstream reference. Provider reference lookup is available
for 90 days. Clients are documented to retry for at most 72 hours.

Cleanup currently deletes every record whose `created_at` is more than 24
hours old, regardless of state. The team proposes increasing that to 72 hours
and calling the issue solved. An old client retry can arrive later due to a
device returning online, and support can replay retained jobs for 14 days.

Version 1 normalization supplies an omitted `serviceLevel` as `standard`.
Version 2 will supply it as `economy` after a pricing change. A deployment
recomputes the hash using whichever normalizer is currently installed.
Existing records contain only `request_hash`, not the normalization version
or normalized command. Hashing raw JSON instead has been suggested as a fix.
The planned release must preserve the meaning of accepted operations.
