# Customer reports

Each signed-in user belongs to one tenant. Reports must be visible only to that tenant's users. Report IDs are random UUIDs; customer support may share a report URL with another user in the same tenant. The route is called with a session whose tenant ID was verified by authentication middleware. The SQL function in `reports.py` is the complete authorization path for reading a report. There is no database row-level policy or gateway filter. The shared cache is keyed only by report ID.
