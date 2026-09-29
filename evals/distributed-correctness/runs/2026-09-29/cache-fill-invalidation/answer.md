Fixed `LabelService` in `service.mjs`, preserving its public API.

The failing history was: reader A captures revision 1 and pauses; writer B commits revision 2 and deletes the cache entry; A resumes and unconditionally caches revision 1; a later read returns the stale value.

Reads now fill through `cache.publishIfFresh`, which atomically rejects a snapshot older than the shared floor or cached value. Writes await `cache.advanceFloor` before returning, ensuring the shared floor is at least the acknowledged revision and removing any older entry. The floor survives value eviction and cannot be lowered by a delayed older writer. An overlapping reader can still return its captured snapshot, even when its cache fill is rejected, as permitted by the requirements.

For participating service instances sharing these adapters, a read invoked after a successful write returns that revision or newer. Cache misses read the authoritative database; cache hits remain free of database reads. Coordination is per ID, so a write to another ID leaves a populated entry usable.

Validation: `node verify.mjs` initially failed the three stale-fill checks (2/5 passed). After the change it passed all five checks (exit 0), covering delayed fills, eviction, delayed older revision notification, repeated cache hits, and ID independence. SHA-256 hashes confirmed `model.mjs`, `verify.mjs`, and `requirements.md` were unchanged.

Scope: this result relies on the supplied atomic cache operations, authoritative database snapshots, successful adapter calls, and shared floors that outlive every outstanding reader. Reads overlapping an unacknowledged write may observe an earlier revision. The checks do not establish a distributed transaction or production storage correctness. Crashes between database commit and floor advancement, adapter outages, floor expiry, and replica reads remain outside the supplied model and were not tested. The repair adds no database reads to populated-cache hits; writes wait for one floor update, and fills use one conditional publication.
