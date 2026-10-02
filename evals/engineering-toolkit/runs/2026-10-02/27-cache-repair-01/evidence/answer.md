Updated [service.py](../final-project/service.py) only. Cache misses now capture the value and version in one source snapshot; fills use the cache’s atomic version check, which rejects a delayed older fill even after JSON restoration.

`python3 -B verify.py` passed all 6 checks (up from 2 before the edit). The result covers the supplied local adapters and their specified ordering and restoration behavior; it does not establish production cache/store atomicity or crash durability.
