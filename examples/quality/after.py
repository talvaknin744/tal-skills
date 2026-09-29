"""Same public contract with flat guards and the unused local formatter removed."""


class InvalidCredit(ValueError):
    pass


class RequestConflict(ValueError):
    pass


class TransportFailure(RuntimeError):
    pass


class CreditLedger:
    def __init__(self):
        self._journal = []
        self._receipts = {}

    @staticmethod
    def _support_amount(amount):
        # Support owns this limit; it can change independently of goodwill policy.
        if type(amount) is not int:
            raise InvalidCredit("amount must be an integer")
        if not 1 <= amount <= 100:
            raise InvalidCredit("amount outside policy")

    @staticmethod
    def _goodwill_amount(amount):
        # Goodwill owns this limit; equal bounds do not imply a shared policy.
        if type(amount) is not int:
            raise InvalidCredit("amount must be an integer")
        if not 1 <= amount <= 100:
            raise InvalidCredit("amount outside policy")

    def credit(self, key, policy, amount, fault="none"):
        if type(key) is not str or not key:
            raise InvalidCredit("key must be a nonempty string")
        if policy == "support":
            self._support_amount(amount)
        elif policy == "goodwill":
            self._goodwill_amount(amount)
        else:
            raise InvalidCredit("unknown policy")
        if fault not in ("none", "before_commit", "after_commit"):
            raise InvalidCredit("unknown fault")

        payload = (policy, amount)
        if key in self._receipts:
            old_payload, receipt = self._receipts[key]
            if old_payload != payload:
                raise RequestConflict("key already binds another credit")
            return receipt
        if fault == "before_commit":
            raise TransportFailure("before commit")

        receipt = f"credit-{len(self._journal) + 1}"
        # One uninterruptible model step. This is not database atomicity.
        self._journal.append((key, policy, amount, receipt))
        self._receipts[key] = (payload, receipt)
        # Keep the receipt when a response is lost: the effect already exists.
        if fault == "after_commit":
            raise TransportFailure("response lost after commit")
        return receipt

    def snapshot(self):
        return {
            "balance": sum(row[2] for row in self._journal),
            "journal": [list(row) for row in self._journal],
            "requests": {
                key: {"policy": payload[0], "amount": payload[1], "receipt": receipt}
                for key, (payload, receipt) in sorted(self._receipts.items())
            },
        }
