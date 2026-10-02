Updated [service.py](../final-project/service.py) only. Cache misses now capture one complete source record, and delayed fills use the cache’s atomic version check. An overlapping read can still return the value it captured, while its fill cannot replace a newer observed record.

`python3 -B verify.py` passed all **6 of 6** checks. Before the edit, it passed 2 of 6.

The result covers the supplied local adapters: overlapping reads and changes, deletion and recreation, reordered notifications, cache hits, eviction, and JSON restoration of the ordering floor. It does not establish behavior for missing notifications, lost metadata, crash-safe persistence, multiple processes, or external stores; those are outside the fixture.
