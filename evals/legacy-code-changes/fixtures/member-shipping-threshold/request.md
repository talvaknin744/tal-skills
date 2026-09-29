# Member shipping correction

Support confirmed a defect: members should receive free shipping when the
subtotal is at least 4,000 cents. The current release charges some eligible
members 199 cents. Nonmembers retain the 5,000-cent free-shipping threshold.
Member orders below 4,000 cents still cost 199 cents to ship; nonmember orders
below their threshold still cost 399 cents. Inputs are nonnegative integer cents.

The quote object keys, total calculation, and audit line format must remain
compatible. Audit exceptions currently propagate to the caller and should
continue to do so. Callers construct ShippingQuote() without arguments.

There are no tests for this module. Python's unittest is available; no additional
packages are installed. The carrier configuration is not available locally.
Inspect these files only: do not read deployment credentials or contact the
carrier. We want a concrete implementation plan for the focused correction,
including enough test cases to review before coding. A broad pricing redesign
is outside this ticket.
