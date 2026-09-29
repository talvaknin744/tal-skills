The correction can stay inside `ShippingQuote.quote`: members at 4,000–4,999 cents must change from 199-cent shipping to free shipping. Keep the result construction, audit call, and constructor behavior intact.

I inspected all three supplied project files and executed the existing calculation through a recording audit substitute. Three temporary `unittest` methods passed, covering 14 subtotal/member combinations, omitted `member`, collaborator reuse, and propagation of an audit exception. Both Python files also compiled in memory. No project files were edited, deployment configuration was read, or carrier requests were made. The snapshot contains no test suite or documented build command; no callers were supplied beyond the construction contract in `request.md`.

The smallest test boundary is already available: patch `quote.CarrierAudit` before calling `ShippingQuote()`. `quote` imports the class without constructing it; configuration reading occurs only in `CarrierAudit.__init__`. A recording substitute must implement `record(line)` and retain the lines. This avoids construction and HTTP traffic while executing the actual pricing, result assembly, audit formatting, and exception path.

For example, a future test can use:

```python
import quote
from unittest.mock import patch

class RecordingAudit:
    def __init__(self):
        self.lines = []

    def record(self, line):
        self.lines.append(line)

audit = RecordingAudit()
with patch.object(quote, "CarrierAudit", return_value=audit) as factory:
    service = quote.ShippingQuote()
    result = service.quote(4000, member=True)
    factory.assert_called_once_with()
```

Patch the name looked up by `quote`, not `gateway.CarrierAudit`. Replacing `service.audit` after construction is too late. Use a context manager to restore the binding even after a failure, and do not run tests that depend on this module binding concurrently in the same process. No production edit is necessary merely to enable tests. If instance-level injection is required later, the minimal alternative is `__init__(self, audit=None)` with `self.audit = CarrierAudit() if audit is None else audit`; it must retain no-argument construction and use an explicit `None` check. That extra interface is not needed for this ticket.

The following fees are both the observed baseline and the concrete proposed regression matrix. All inputs are integer cents.

| Subtotal | Nonmember: current → required | Member: current → required |
| ---: | ---: | ---: |
| 0 | 399 → 399 | 199 → 199 |
| 3,999 | 399 → 399 | 199 → 199 |
| 4,000 | 399 → 399 | 199 → 0 |
| 4,001 | 399 → 399 | 199 → 0 |
| 4,999 | 399 → 399 | 199 → 0 |
| 5,000 | 0 → 0 | 0 → 0 |
| 5,001 | 0 → 0 | 0 → 0 |

For each case, assert the complete dictionary with exactly `subtotal_cents`, `shipping_cents`, and `total_cents`, and assert exactly one audit line in `subtotal|0-or-1|fee` format. Use literal expected fees from this table, not expectations calculated by calling the pricing implementation.

At the distinguishing boundary, the observed result is `{"subtotal_cents": 4000, "shipping_cents": 199, "total_cents": 4199}` and audit line `4000|1|199`. The regression must require `{"subtotal_cents": 4000, "shipping_cents": 0, "total_cents": 4000}` and `4000|1|0`. Those expectations fail against the observed current behavior; I have not changed the implementation or executed a revised implementation.

Proceed in these reviewable steps when coding is authorized:

1. Add characterization tests using the scoped audit replacement and the current column above. Include `quote(4000)` to preserve the default nonmember behavior: fee 399, total 4,399, audit `4000|0|399`. Check two calls reuse the one constructed audit instance.
2. Add or update the member 4,000, 4,001, and 4,999 assertions to the required zero fee, corresponding totals, and audit lines. Run them against the old code and record the intended failures. These are the only changed business expectations.
3. Change only the free-shipping condition to:

   ```python
   if subtotal_cents >= 5000 or (member and subtotal_cents >= 4000):
       fee = 0
   elif member:
       fee = 199
   ```

   Retain the initial 399-cent fee, result dictionary, total calculation, and audit-before-return call.
4. Run the full focused suite, for example `python3 -B -m unittest discover -s tests -p 'test_shipping_quote.py'` after that test file exists. Include a substitute whose `record` raises a sentinel exception, assert the identical exception reaches the caller, and assert its recorded line. Exercise this at member 4,000 after the fix (`4000|1|0`) and an unaffected case. Do not catch, suppress, or retry the audit failure.
5. Compile the modules in memory and inspect the final diff. Expected scope is the one predicate plus focused tests; no carrier, pricing framework, input-validation, or broad refactoring changes.

The substitute establishes local calculation and audit-call compatibility, including that the no-argument constructor calls its selected factory once. It does not validate real configuration loading, authentication, HTTP transport, or carrier acceptance. Those require a separately authorized integration check with appropriate configuration and a controlled endpoint; none is needed or permitted for this read-only review.
