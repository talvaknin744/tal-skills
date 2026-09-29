# Invoice extraction pilot

Our existing application accepts invoice PDFs, retains originals for 90 days,
queues work in its existing worker, and shows an editable invoice review screen.
It uses one database. Existing readers expect extraction_state to be the text
values "pending", "ready", or "failed". The invoice fields are supplier_name,
invoice_date (ISO date), and total_amount (decimal currency units).

We are adding AcmeExtract, a fictional vendor SDK. We have an authorized test
account and 20 representative, non-sensitive sample PDFs with expected fields.
The unanswered questions are whether the SDK results can populate these three
fields accurately and whether users can correct a result through the existing
review screen. A pilot covers one supplier's layout. Other suppliers can wait.

The team has a two-day mockup: a browser page displays hardcoded extracted fields
and toggles a success message without upload, persistence, a worker, or SDK calls.
It ignores errors and was written to explore placement of the edit controls.
The product owner liked the layout. The team calls it a "tracer bullet" and plans
to ship that code after wiring up the missing systems in the final two days.

The proposed SDK integration passes its result object directly to UI rendering
and writes the SDK status values "10", "20", or "99" into extraction_state.
It also writes the SDK's integer cents directly to total_amount. A proposed
rollback says: "Revert the code commit; all existing readers will work again."
The pilot must leave older invoice readers working throughout. We can retain
the existing domain fields and translate SDK values inside the worker.

The two-week pilot's acceptance condition is that each of the 20 supported valid
samples yields the three correct, editable fields. Separate checks using an
unreadable PDF and a rejected SDK request must show a recoverable error without
hiding the source PDF. We need a retained path to build on after the pilot. The team has
also floated a five-second performance target, but no load profile or measurement
has been agreed. Nothing has been benchmarked yet.

Please assess the plan and name a bounded next experiment. Do not connect to the
test account, contact anyone, or modify these files in this review.
