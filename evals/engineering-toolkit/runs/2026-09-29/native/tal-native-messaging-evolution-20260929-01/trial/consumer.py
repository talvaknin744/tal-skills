class ConflictingEvent(ValueError):
    pass


class Consumer:
    def __init__(self):
        self._accounts = {}
        self._effects = []
        self._messages = {}

    def apply(self, event):
        if not isinstance(event, dict):
            raise ValueError("event must be a dictionary")
        message_id = event.get("message_id")
        account = event.get("account_id")
        revision = event.get("revision")
        balance = event.get("balance")
        if not isinstance(message_id, str) or not message_id:
            raise ValueError("message_id must be a nonempty string")
        if not isinstance(account, str) or not account:
            raise ValueError("account_id must be a nonempty string")
        if type(revision) is not int or revision <= 0:
            raise ValueError("revision must be a positive integer")
        if type(balance) is not int:
            raise ValueError("balance must be an integer")

        # Keep immutable content for every accepted delivery, including stale ones.
        content = (account, revision, balance)
        if message_id in self._messages:
            if self._messages[message_id] != content:
                raise ConflictingEvent("message_id reused for different content")
            return "duplicate"

        current = self._accounts.get(account)
        if current is not None and revision == current["revision"]:
            if balance != current["balance"]:
                raise ConflictingEvent("account revision has conflicting balance")
            outcome = "duplicate"
        elif current is not None and revision < current["revision"]:
            outcome = "stale"
        else:
            self._accounts[account] = {"revision": revision, "balance": balance}
            self._effects.append([account, revision, balance])
            outcome = "applied"

        self._messages[message_id] = content
        return outcome

    def snapshot(self):
        return {"accounts": {key: dict(value) for key, value in self._accounts.items()},
                "effects": [list(effect) for effect in self._effects]}
