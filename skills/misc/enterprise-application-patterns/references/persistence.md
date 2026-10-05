# Matching persistence responsibilities

Trace a concrete load, change, and save before choosing abstractions. Inspect schema constraints, existing data access APIs, framework configuration, and observed query behavior. Names such as repository, session, or entity manager do not prove which responsibilities are implemented.

For procedural logic, a gateway can encapsulate data access while returning rows or record sets. A Row Data Gateway represents a row; a Table Data Gateway handles operations over a table-like source. Keep business behavior distinct from a gateway's access mechanics. Stored procedures and views may be the actual boundary behind that gateway.

Active Record combines a row-shaped object's business behavior with persistence. It can fit a simple model whose objects closely match tables. Data Mapper separates object behavior from relational storage and is useful when their shapes or evolution differ. Assess the mapping cost against the independence it buys. Preserve a consistent primary save path for the affected model; an external-data gateway can coexist with a mapper without becoming a second writer for the same object.

For coordinated object changes, establish what the Unit of Work tracks, how new/changed/deleted objects become registered, and when it orders and flushes writes. Reuse existing framework behavior where demonstrated. A successful flush is not evidence that a database transaction committed, and a change tracker alone supplies no cross-request concurrency guarantee. Verify rollback behavior for both stored data and any in-memory state reused afterward.

An Identity Map gives one in-memory representation per persisted identity within an explicit scope. Check that two loads of the same record use that representation and that separate operations do not inherit stale mutable instances inadvertently. Identity coherence within that scope is different from freshness or isolation across independent transactions.

For relationship traversal, check lazy-loading boundaries and representative query counts. A result renderer may trigger queries after the intended persistence scope closes. Choose an explicit fetch or result representation when needed; whole-graph eager loading is not an automatic cure. Verify mapping round trips for the changed fields and associations, write ordering for new references, and the failure path after an intermediate write.
