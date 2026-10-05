# Address service extraction

The monolith currently owns customer addresses in main_db. The new Address service will own address_db. The migration copies a snapshot at 01:00, streams main_db changes to address_db until 03:00, stops that stream, and switches writes and reads to Address. Requests include address_id and a monotonic version. The monolith and Address use the same fields today.

The rollback plan says: if error rate rises in the first hour, route requests back to the monolith and restore its 01:00 snapshot. Address may have accepted new addresses or corrections during that hour. No reverse replication or reconciliation procedure exists. A support team can see which changes Address accepted, but has no automated import path. Old workers can still write main_db until restarted. Customers expect a successful address correction to be retained, including when placing an order later that day.
