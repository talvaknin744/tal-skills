# Local transfer transaction

One database transaction starts with account A at 100 and account B at 20. Statement one subtracts 30 from A. Statement two would add 30 to B but raises an error. The application's error handler explicitly rolls back the whole transaction. The database guarantees atomic transactions. There are no external calls, triggers with external effects, other databases, or concurrently committed changes in this example.
