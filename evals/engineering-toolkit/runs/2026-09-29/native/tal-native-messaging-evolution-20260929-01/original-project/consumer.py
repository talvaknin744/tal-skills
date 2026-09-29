class ConflictingEvent(ValueError):
    pass


class Consumer:
    def __init__(self):
        self._accounts = {}
        self._effects = []

    def apply(self, event):
        account = event["account_id"]
        self._accounts[account] = {"revision": event["revision"], "balance": event["balance"]}
        self._effects.append([account, event["revision"], event["balance"]])
        return "applied"

    def snapshot(self):
        return {"accounts": {key: dict(value) for key, value in self._accounts.items()},
                "effects": [list(effect) for effect in self._effects]}
