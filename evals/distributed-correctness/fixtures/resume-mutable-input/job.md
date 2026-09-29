# Campaign export resumed after deployment

An accepted campaign export takes 18–30 hours. It must include each recipient
eligible when the request was accepted exactly once and calculate that
recipient's amount using the accepted pricing revision. Later edits to
recipients or pricing apply to later exports. Output rows have unique keys
`(export_id, recipient_id)`. The export writes rows and its cursor in one
transaction; committed rows survive process replacement.

The request audit ledger contains this immutable acceptance record:

```json
{"export_id":"exp-804","region":"UK","recipients_revision":100,
 "pricing_revision":17,"calculation_version":1,"accepted_at":"2026-09-25T08:00:00Z"}
```

The recipient and pricing services retain queryable revision histories for
seven days, including deleted records. Revision identifiers belong to their
respective datasets. Recipient queries can select a retained revision and sort
by immutable recipient ID. Export artifacts can be retained independently.
Ordinary queries without a revision read the latest state. Database
transactions must finish within 30 seconds. Most exports finish within 36
hours, but operations sometimes resume a paused export after eight days.

At 22:00, worker v1 persisted cursor `offset=40000`, then terminated for a
deployment. During the job, recipients were inserted and deleted and their
`updated_at` order changed; pricing advanced from revision 17 to 19. Worker v2
loaded the checkpoint at 22:05. The checkpoint contains only `export_id` and
`offset`; it has no format or calculation version. V2 changed rounding behavior
and its default region from UK to US. The immutable audit ledger remains
available. Already emitted rows contain amount and recipient ID but omit the
pricing and calculation versions. The operator proposes saving the offset more
often and opening one Repeatable Read transaction for the remainder of the job.
