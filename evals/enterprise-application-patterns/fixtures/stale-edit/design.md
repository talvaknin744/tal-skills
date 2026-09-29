# Purchase-order editing

Editors open an order, change line quantities, and save minutes later. The saved
order total must equal its saved line totals. Two concurrent submissions based on
the same version must not silently overwrite one another. The form carries the
version from the original read. The only current writer is `saveOrder` below.

The application has a process-wide map keyed by order ID. `loadOrder` returns an
existing object from that map or loads the header and lines, stores the object,
and returns it. There is no refresh or invalidation logic. Form construction
copies values from this object; changing form fields does not mutate the object.

The database supports atomic transactions. `execute` is autocommitted unless
explicitly passed a transaction object. The proposed UnitOfWork tracks changes,
but its `flush` runs each statement using ordinary autocommitted `execute` calls.
Its name does not change that behavior. An affected-row count is available.

```text
saveOrder(form):
  current = execute("SELECT version FROM orders WHERE id = ?", form.id)
  if current.version != form.originalVersion:
    return conflict
  work = UnitOfWork()
  work.add("UPDATE order_lines SET quantity = ?, total = ? WHERE id = ?",
           each of form.lines)
  work.add("UPDATE orders SET total = ?, version = ? WHERE id = ?",
           sum(form.lines.total), form.originalVersion + 1, form.id)
  work.flush()
  return saved
```

Order 42 starts at version 8. Its one line has quantity 1 and total 10, matching
header total 10. Editor A submits quantity 2 / total 20 from version 8. Editor B
submits quantity 3 / total 30 from version 8. Both version SELECTs can return 8
before either flush. The database can reject a header write after a successful
line write; the application currently reports save failure in that case.

The team suggests that the global Identity Map prevents conflicting saves and
the UnitOfWork makes the operation atomic. It also considers holding a database
transaction open from form load to submit. Review the guarantees and propose a
concrete save boundary and conflict response. Leave all files unchanged.
