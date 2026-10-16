# Netflix r03 concurrent network owner boundary

The live collector is authorized for Netflix as the sole Medium network owner. Airbnb and Pinterest remain offline. HTTP 429, source HTTP 403 and explicit challenge markers open the circuit while the request lock is held. An unexpected non RSS HTTP 200 opens that circuit later in ingest, after the shared request lock has been released.

That classification order leaves a concurrent owner boundary. The 60 second start budget and repeated circuit checks delay a later request, but timing does not establish atomic safety for multiple owners. Preparation against the same file schema does not clear this boundary, and no concurrent runtime evaluation has passed.

A successor requires a new versioned source and a reviewed transition after this run stops or reaches a clean checkpoint. It must classify unexpected responses and persist the circuit under the same held lock, verify that another owner cannot start before classification completes, and preserve all current source and run evidence. The running source remains unchanged.
