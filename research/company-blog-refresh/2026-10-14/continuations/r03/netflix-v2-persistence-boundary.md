# Netflix V2 response persistence boundary

An isolated exact source fixture found a remaining boundary in V2. The request method stores response content before challenge classification. When a synthetic HTTP 429 response triggers an injected OSError at that storage step, the method releases the shared lock without creating a circuit and leaves the request record started.

This is offline evidence, not a live storage failure or denial. The companion JSON binds the exact verifier and proof. Netflix remains the sole network owner and the live source remains unchanged. The earlier classification order fix therefore does not establish unqualified safety for concurrent owners under persistence exceptions.

A successor must classify and fail closed through persistence errors while preserving incomplete attempts. Peer admission still needs a separate independent compatibility check before any concurrent launch. No host availability or durable storage guarantee is claimed.
