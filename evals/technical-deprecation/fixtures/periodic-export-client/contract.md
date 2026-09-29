# Supplied interface and consumer contracts

`ledger_client.export_v1(period)` and its `/exports/v1` endpoint return the complete
immutable period-close snapshot. All pages share the same snapshot identifier;
voided invoices remain as explicit rows. Repeating the export for the same closed
period produces the same record IDs, values and order. The endpoint and library
entrypoint are supported and currently have no promised removal date. A README
warning added last month recommends v2 for new work; existing clients still work.

`ledger_client.scan_v2(cursor=None)` and `/exports/v2` return pages from the current
invoice collection. A cursor is an opaque position in that live collection, not a
snapshot token. Voided invoices are omitted. Records can change or disappear
between pages. V2 uses the same invoice schema, but no period-close snapshot mode
has been implemented. The interactive dashboard intentionally displays current
nonvoided invoices and can refresh after concurrent changes.

The close-audit export must retain every record from the immutable closed period,
including voided rows, and must reproduce the accepted export later. Changing
that requirement requires an explicit business decision; no approval is supplied.
The reporting team's monthly run executes on the last business day. Its last run
was August 31; the next is September 30. Rehearsal may use a retained synthetic
period snapshot without waiting for that date. No rehearsal is recorded here.

Both library and direct HTTP consumers are supported internally. The repository
search scans current default branches of three registered repositories; it excludes
archived job images, generated templates, and ad-hoc client installations. Gateway
counts cover authenticated calls reaching this gateway only. Logs do not establish
which import paths or runnable old images still exist. This is a finite supplied
inventory, not an assertion that all possible clients have been discovered.
