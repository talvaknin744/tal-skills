# Credit and order saga

A customer has a credit limit of 100 and no outstanding orders. Two independent checkout sagas, A and B, each want an order worth 80. Each saga first reads Credit.available, then creates an order, then asks Shipping to dispatch, and finally records 80 of credit usage. These are separate service requests. Credit's read and later usage write have no reservation or compare-and-set. The team expects each saga to see enough credit and plans to cancel the order, subtract usage, and request a return if its later credit write detects overuse.

The business invariant says total accepted outstanding orders must never exceed the limit. Shipping can dispatch before the credit write, and a dispatched parcel cannot always be recalled. An order cancellation and parcel return are business actions, not transaction rollback. The proposal claims compensating every completed step makes the multi-service workflow as isolated as the previous local transaction.
