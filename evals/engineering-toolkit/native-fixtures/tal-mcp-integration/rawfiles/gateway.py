class Gateway:
    def __init__(self):
        self._handles = {"h-alice": {"owner": "alice", "value": "alice-private"},
                         "h-bob": {"owner": "bob", "value": "bob-private"}}
        self._cache = {}
        self.dispatches = 0

    def call(self, headers, body, verified_principal):
        self.dispatches += 1
        arguments = body["params"]["arguments"]
        handle = arguments["handle"]
        if handle in self._cache:
            return dict(self._cache[handle])
        principal = arguments.get("claimedPrincipal", verified_principal)
        record = self._handles[handle]
        if record["owner"] != principal:
            raise PermissionError("private handle")
        result = {"principal": principal, "value": record["value"]}
        self._cache[handle] = result
        return dict(result)
