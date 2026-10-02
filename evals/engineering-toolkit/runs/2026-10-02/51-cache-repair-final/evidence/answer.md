Updated [service.py](../final-project/service.py) so a cache miss captures one complete source record and publishes it through the cache’s atomic version check. A delayed read may still return its captured value, as the contract permits, but its fill cannot overwrite a newer observed change.

`python3 -B verify.py` passed **6/6 checks**; the original code passed 2/6. The checks cover overlapping reads and changes, deletion and recreation, cache hits, and rejection of a stale fill after JSON restoration.

The result applies to the supplied in-memory adapters and confirmed change notifications. It does not establish behavior for missed notifications, lost cache ordering metadata, crash-safe durability, replicas, or multiple processes.
