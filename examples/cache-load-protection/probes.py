"""Eight bounded observations; each reports its unsafe control and evidence scope."""

import asyncio
from collections import Counter
import hashlib
import json
import sqlite3
import time
import uuid

from redis_client import Redis, RedisError


PUBLISH = """
local floor = redis.call('GET', KEYS[1])
if not floor then return -1 end
if tonumber(ARGV[1]) ~= tonumber(floor) then return 0 end
redis.call('SET', KEYS[2], ARGV[2], 'PX', ARGV[3])
return 1
"""
ADVANCE = """
local floor = redis.call('GET', KEYS[1])
if not floor then return -1 end
if tonumber(ARGV[1]) > tonumber(floor) then
  redis.call('SET', KEYS[1], ARGV[1])
  redis.call('DEL', KEYS[2])
end
return tonumber(redis.call('GET', KEYS[1]))
"""
READ = """
local floor = redis.call('GET', KEYS[1])
local raw = redis.call('GET', KEYS[2])
if not floor or not raw then return false end
if cjson.decode(raw).revision ~= tonumber(floor) then return false end
return raw
"""
BLOOM_GUARD = """
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return -1 end
local kind = redis.call('TYPE', KEYS[2]).ok
if kind ~= ARGV[2] then return -1 end
return redis.call('BF.EXISTS', KEYS[2], ARGV[3])
"""
RELEASE = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
"""


def wait_absent(cache, key):
    deadline = time.monotonic() + 3
    while cache.command("EXISTS", key):
        if time.monotonic() >= deadline:
            raise AssertionError("Real Redis expiration not observed by deadline")
        time.sleep(0.002)


class Source:
    def __init__(self, path):
        self.db = sqlite3.connect(path, isolation_level=None, timeout=3)
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, value TEXT)")
        self.db.execute("CREATE TABLE IF NOT EXISTS epochs (id TEXT PRIMARY KEY, revision INTEGER NOT NULL)")
        self.reads = 0

    def seed(self, key, value=None):
        self.db.execute("INSERT OR REPLACE INTO epochs VALUES (?, 1)", (key,))
        self.db.execute("DELETE FROM records WHERE id=?", (key,))
        if value is not None:
            self.db.execute("INSERT INTO records VALUES (?, ?)", (key, value))

    def read(self, key):
        self.reads += 1
        row = self.db.execute("SELECT e.revision, r.value FROM epochs e LEFT JOIN records r ON r.id=e.id WHERE e.id=?", (key,)).fetchone()
        if row is None:
            return {"revision": 0, "kind": "missing", "value": None}
        return {"revision": row[0], "kind": "missing" if row[1] is None else "value", "value": row[1]}

    def create(self, key, value):
        self.db.execute("BEGIN IMMEDIATE")
        try:
            self.db.execute("INSERT INTO records VALUES (?, ?)", (key, value))
            self.db.execute("UPDATE epochs SET revision=revision+1 WHERE id=?", (key,))
            revision = self.db.execute("SELECT revision FROM epochs WHERE id=?", (key,)).fetchone()[0]
            self.db.execute("COMMIT")
            return revision
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def close(self):
        self.db.close()


def keys(name):
    return f"load:{{{name}}}:floor", f"load:{{{name}}}:entry"


def publish(cache, name, snapshot):
    return cache.command("EVAL", PUBLISH, 2, *keys(name), snapshot["revision"], json.dumps(snapshot), 60000)


def lookup(cache, source, name):
    raw = cache.command("EVAL", READ, 2, *keys(name))
    if raw is not None:
        return {"path": "cache", "snapshot": json.loads(raw)}
    snapshot = source.read(name)
    return {"path": "database", "snapshot": snapshot, "publish": publish(cache, name, snapshot)}


def ttl_jitter(cache, source, port):
    ceiling, jitter = 60000, 20000
    ttls = [ceiling - int.from_bytes(hashlib.sha256(f"key-{i}".encode()).digest()[:8], "big") % (jitter + 1) for i in range(128)]
    uniform = Counter([ceiling // 1000] * len(ttls))
    spread = Counter(ttl // 1000 for ttl in ttls)
    assert min(ttls) >= ceiling - jitter and max(ttls) <= ceiling
    assert max(spread.values()) < max(uniform.values())
    naive_positive_jitter = [ceiling + (ceiling - ttl) for ttl in ttls]
    assert max(naive_positive_jitter) > ceiling

    def remaining(sample_at, now, assigned_ttl):
        return max(0, sample_at + assigned_ttl - now)

    assert remaining(0, 61000, ceiling) == 0
    assert remaining(0, 59000, ceiling) == 1000
    assert 59000 + ceiling > ceiling  # Starting a fresh TTL after a slow fill is unsafe.
    observed = []
    for i, ttl in enumerate(ttls[:8]):
        key = f"jitter:{i}"
        cache.command("SET", key, "snapshot", "PX", ttl)
        pttl = cache.command("PTTL", key)
        assert 0 < pttl <= ttl
        observed.append({"assigned_ms": ttl, "observed_pttl_ms": pttl})
    return {"scope": "Virtual-time expiry buckets plus actual Redis PTTL assignments; no request-load benchmark",
            "unsafe_control": {"synchronized_peak_bucket": max(uniform.values()),
                "positive_jitter_max_age_ms": max(naive_positive_jitter),
                "slow_fill_with_restarted_ttl_expires_at_ms": 119000},
            "bounded_jitter_peak_bucket": max(spread.values()), "expiry_buckets": dict(sorted(spread.items())),
            "hard_age_ceiling_ms_from_source_sample": ceiling, "remaining_after_59s_ms": 1000,
            "publication_after_61s": "rejected", "actual_redis_ttls": observed,
            "limit": "This fixed 128-key schedule illustrates spreading. It does not bound stochastic collisions, upstream snapshot age, or production source load."}


def repeated_negative(cache, source, port):
    name = "negative-repeat"
    source.seed(name)
    floor, entry = keys(name)
    cache.command("SET", floor, 1)
    before = source.reads
    results = [lookup(cache, source, name) for _ in range(20)]
    assert all(item["snapshot"]["kind"] == "missing" for item in results)
    assert source.reads - before == 1
    assert results[0]["path"] == "database" and all(item["path"] == "cache" for item in results[1:])
    cache.command("PEXPIRE", entry, 10)
    wait_absent(cache, entry)
    assert lookup(cache, source, name)["path"] == "database"
    assert source.reads - before == 2
    uncached_before = source.reads
    for _ in range(20):
        source.read(name)
    assert source.reads - uncached_before == 20
    return {"scope": "Real Redis negative entry and SQLite reads, sequential same-key requests",
            "unsafe_control": {"uncached_requests": 20, "database_reads": 20},
            "cached_requests": 20, "database_reads_before_expiry": 1,
            "database_reads_after_observed_expiry": 2,
            "expiry_gate": "Fixture shortens entry TTL to 10ms using PEXPIRE, then observes absence",
            "limit": "No bound for many distinct keys, simultaneous cold misses, source failures, or capacity during fallback."}


def negative_create_race(cache, source, port):
    outcomes = {}
    with Redis(port) as creator_cache:
        creator = Source(source.db.execute("PRAGMA database_list").fetchone()[2])
        try:
            for mode in ("delete-only", "fenced"):
                name = "negative-race-" + mode
                source.seed(name)
                floor, entry = keys(name)
                cache.command("SET", floor, 1)
                captured = source.read(name)  # Gate A: absence snapshot retained by old reader.
                assert captured["kind"] == "missing"
                revision = creator.create(name, "created")  # Gate B: independent DB connection commits.
                if mode == "delete-only":
                    creator_cache.command("DEL", entry)
                    cache.command("SET", entry, json.dumps(captured), "PX", 60000)
                    observed = json.loads(cache.command("GET", entry))
                    assert observed["kind"] == "missing"
                    outcomes[mode] = {"database_revision": revision, "later_cached_result": observed,
                                      "unsafe_negative_resurrected": True}
                else:
                    transition = creator_cache.command("EVAL", ADVANCE, 2, floor, entry, revision)
                    assert transition == revision  # Application acknowledges only after this transition.
                    rejected = publish(cache, name, captured)  # Gate C: delayed absence tries to publish.
                    later = lookup(cache, source, name)
                    assert rejected == 0 and later["snapshot"]["value"] == "created"
                    creator_cache.command("DEL", floor)
                    lost_floor_publication = publish(cache, name, captured)
                    fallback = lookup(cache, source, name)
                    assert lost_floor_publication == -1
                    assert fallback["path"] == "database" and fallback["snapshot"]["value"] == "created"
                    assert fallback["publish"] == -1
                    outcomes[mode] = {"database_revision": revision, "stale_publish_result": rejected,
                        "later_result": later, "floor_loss_publish_result": lost_floor_publication,
                        "floor_loss_read_path": fallback["path"]}
        finally:
            creator.close()
    return {"scope": "Two real Redis connections and SQLite connections; explicit sequential race gates in one process",
            "unsafe_control": outcomes["delete-only"], "guarded": outcomes["fenced"],
            "limit": "DB commit and Redis floor advancement are not atomic. Success follows both; no crash recovery/outbox or automatic missing-floor reconstruction is implemented."}


def bloom_readiness(cache, source, port):
    ready, bloom = "bloom:{readiness}:ready", "bloom:{readiness}:filter:g2"
    source.seed("bloom-existing", "database-value")
    cache.command("BF.RESERVE", bloom, 0.001, 32)
    bloom_type = cache.command("TYPE", bloom)
    assert bloom_type not in ("none", "string")

    def decision():
        return cache.command("EVAL", BLOOM_GUARD, 2, ready, bloom, "g2", bloom_type, "bloom-existing")

    def fallback():
        before = source.reads
        value = source.read("bloom-existing") if decision() == -1 else None
        assert value and value["value"] == "database-value"
        assert source.reads == before + 1

    # g1 readiness cannot claim the new g2 filter is complete.
    cache.command("SET", ready, "g1")
    assert cache.command("BF.EXISTS", bloom, "bloom-existing") == 0
    assert decision() == -1
    fallback()
    incomplete = {"raw_membership": 0, "guard": -1, "result": "database-value"}
    cache.command("BF.ADD", bloom, "bloom-existing")
    cache.command("SET", ready, "g2")  # Fixture-only quiescent build is now complete.
    assert decision() == 1
    ready_observed = cache.command("GET", ready)
    cache.command("DEL", bloom)  # Loss after a separate readiness check reproduces the unsafe schedule.
    raw_missing = cache.command("BF.EXISTS", bloom, "bloom-existing")
    assert ready_observed == "g2" and raw_missing == 0 and decision() == -1
    fallback()
    cache.command("SET", bloom, "wrong-type-replacement")
    try:
        raw_wrong_type = cache.command("BF.EXISTS", bloom, "bloom-existing")
    except RedisError as error:
        raw_wrong_type = {"error": str(error)}
    assert decision() == -1
    fallback()
    cache.command("DEL", bloom)
    cache.command("BF.RESERVE", bloom, 0.001, 32)
    cache.command("BF.ADD", bloom, "bloom-existing")
    assert decision() == 1
    known_absent = cache.command("EVAL", BLOOM_GUARD, 2, ready, bloom, "g2", bloom_type, "not-in-static-source")
    assert known_absent == 0
    return {"scope": "Actual RedisBloom with Lua-atomic readiness, type, and membership checks",
            "unsafe_control": {"readiness_before_filter_loss": ready_observed,
                "missing_filter_membership": raw_missing, "wrong_type_membership": raw_wrong_type,
                "naive_zero_means_database_absent_would_hide": "database-value"},
            "incomplete_generation": incomplete, "bloom_type": bloom_type,
            "missing_wrong_type_or_old_generation": "authoritative lookup",
            "complete_static_generation_absence": known_absent,
            "limit": "Generation g2 completeness is established only by quiescent fixture setup. Online DB commits, asynchronous BF.ADD, rebuild fencing, and Redis restart recovery need their own synchronization protocol."}


def bloom_false_positive(cache, source, port):
    key = "bloom:{false-positive}:filter"
    cache.command("BF.RESERVE", key, 0.5, 32, "NONSCALING")
    for i in range(32):
        cache.command("BF.ADD", key, f"present-{i}")
    candidate = None
    for i in range(4096):
        probe = f"absent-{i}"
        if cache.command("BF.EXISTS", key, probe) == 1:
            candidate = probe
            break
    assert candidate is not None, "No actual Bloom false positive found within the bounded fixture search"
    before = source.reads
    actual = source.read(candidate)
    assert actual["kind"] == "missing" and source.reads == before + 1
    return {"scope": "Actual RedisBloom false positive followed by a real SQLite query",
            "configured_error_rate": 0.5, "capacity": 32, "queries_until_witness": i + 1,
            "unsafe_control": {"membership": 1, "treating_positive_as_existence": "incorrect"},
            "witness": candidate, "authoritative_result": actual["kind"], "authoritative_reads": 1,
            "limit": "High error rate is intentional to find a witness quickly; this is not an error-rate measurement or production parameter recommendation."}


def lease_fencing(cache, source, port):
    lease = "lease:{item}:owner"
    owner_a, owner_b = uuid.uuid4().hex, uuid.uuid4().hex
    db = source.db
    db.execute("CREATE TABLE fence_sequence (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)")
    db.execute("INSERT INTO fence_sequence VALUES (1, 0)")
    db.execute("CREATE TABLE resource (id INTEGER PRIMARY KEY, fence INTEGER NOT NULL, value TEXT NOT NULL)")
    db.execute("INSERT INTO resource VALUES (1, 0, 'initial')")

    def new_fence():
        db.execute("BEGIN IMMEDIATE")
        try:
            token = db.execute("UPDATE fence_sequence SET value=value+1 WHERE id=1 RETURNING value").fetchone()[0]
            db.execute("COMMIT")
            return token
        except BaseException:
            db.execute("ROLLBACK")
            raise

    assert cache.command("SET", lease, owner_a, "NX", "PX", 60000) == "OK"
    fence_a = new_fence()
    db.execute("UPDATE resource SET fence=? WHERE id=1", (fence_a,))
    cache.command("PEXPIRE", lease, 10)
    wait_absent(cache, lease)
    with Redis(port) as successor:
        assert successor.command("SET", lease, owner_b, "NX", "PX", 60000) == "OK"
        fence_b = new_fence()
        assert fence_b > fence_a
        db.execute("UPDATE resource SET fence=? WHERE id=1 AND fence<?", (fence_b, fence_b))
        unsafe_deleted = cache.command("DEL", lease)
        assert unsafe_deleted == 1 and successor.command("GET", lease) is None
        assert successor.command("SET", lease, owner_b, "NX", "PX", 60000) == "OK"
        stale_release = cache.command("EVAL", RELEASE, 1, lease, owner_a)
        assert stale_release == 0 and successor.command("GET", lease) == owner_b
        assert db.execute("UPDATE resource SET value='new-owner' WHERE id=1 AND fence=?", (fence_b,)).rowcount == 1
        db.execute("UPDATE resource SET value='stale-overwrite' WHERE id=1")
        unsafe_write = db.execute("SELECT value FROM resource WHERE id=1").fetchone()[0]
        assert unsafe_write == "stale-overwrite"
        db.execute("UPDATE resource SET value='new-owner' WHERE id=1 AND fence=?", (fence_b,))
        blocked = db.execute("UPDATE resource SET value='stale-overwrite' WHERE id=1 AND fence=?", (fence_a,)).rowcount
        assert blocked == 0 and db.execute("SELECT value FROM resource WHERE id=1").fetchone()[0] == "new-owner"
        assert successor.command("EVAL", RELEASE, 1, lease, owner_b) == 1
    return {"scope": "Real Redis lease expiry and owner-safe release; real SQLite conditional resource mutation",
            "unsafe_control": {"old_owner_deleted_new_lease": unsafe_deleted == 1, "unfenced_value": unsafe_write},
            "stale_release_result": stale_release, "fences": [fence_a, fence_b],
            "stale_mutation_rows": blocked, "final_resource": "new-owner", "current_owner_release": 1,
            "limit": "The sequence and accepted fence live in real SQLite; crash durability is not tested. Random Redis owner values are not fencing tokens. A is rejected once B's fence is installed. Restoring B's lease after the destructive control resets this fixture, not a production reacquisition protocol. No atomic Redis/SQLite grant protocol, external side-effect fence, or failover claim."}


def scan_policy(cache, source, port):
    expected = {f"scan:target:{i:03}" for i in range(96)}
    for key in expected:
        cache.command("SET", key, "fixture")
    for i in range(96):
        cache.command("SET", f"scan:other:{i:03}", "fixture")
    password = uuid.uuid4().hex
    cache.command("ACL", "SETUSER", "scan-reader", "reset", "on", ">" + password, "~*", "+scan", "+ping")
    with Redis(port) as reader:
        assert reader.command("AUTH", "scan-reader", password) == "OK"
        try:
            reader.command("KEYS", "scan:target:*")
            raise AssertionError("KEYS was not denied by the fixture ACL")
        except RedisError as error:
            assert "NOPERM" in str(error)
            denial = str(error)
        cursor, all_keys, batches = "0", [], []
        deadline = time.monotonic() + 5
        for _ in range(4096):
            cursor, batch = reader.command("SCAN", cursor, "MATCH", "scan:target:*", "COUNT", 1)
            all_keys.extend(batch)
            batches.append({"cursor": cursor, "items": len(batch)})
            if cursor == "0":
                break
            assert time.monotonic() < deadline
        else:
            raise AssertionError("SCAN did not terminate within the fixture bound")
        assert set(all_keys) == expected
        assert len(all_keys) >= len(expected)  # Deduplicate; uniqueness is not a SCAN promise.
    cache.command("ACL", "DELUSER", "scan-reader")
    return {"scope": "Actual Redis SCAN over stable fixture keys and ACL-denied KEYS",
            "unsafe_control": {"prohibited_keys_command": denial}, "unique_expected": len(expected),
            "unique_observed": len(set(all_keys)), "returned_items": len(all_keys),
            "count_hint": 1, "calls": len(batches), "largest_batch": max(item["items"] for item in batches),
            "empty_nonterminal_batches": sum(item["items"] == 0 and item["cursor"] != "0" for item in batches),
            "terminal_cursor": cursor,
            "limit": "COUNT is not a page-size or latency limit. Mutation snapshots, Redis Cluster coverage, and runtime complexity were not measured; full iteration and KEYS complexities come from official documentation."}


class SingleFlight:
    def __init__(self, bound, shield=True):
        self.bound, self.shield = bound, shield
        self.tasks, self.attached = {}, 0
        self.two_attached = asyncio.Event()

    async def get(self, key, loader):
        if key not in self.tasks:
            if len(self.tasks) >= self.bound:
                raise OverflowError("Active-key bound reached")

            async def owned():
                try:
                    return await loader()
                finally:
                    self.tasks.pop(key, None)

            self.tasks[key] = asyncio.create_task(owned())
        task = self.tasks[key]
        self.attached += 1
        if self.attached >= 2:
            self.two_attached.set()
        return await asyncio.shield(task) if self.shield else await task


async def singleflight_async():
    results = {}
    async with asyncio.timeout(5):
        for shield in (False, True):
            group = SingleFlight(1, shield)
            entered, finish = asyncio.Event(), asyncio.Event()
            calls = 0

            async def loader():
                nonlocal calls
                calls += 1
                entered.set()
                await finish.wait()
                return "loaded"

            first = asyncio.create_task(group.get("same", loader))
            await entered.wait()
            second = asyncio.create_task(group.get("same", loader))
            await group.two_attached.wait()
            overflow = False
            try:
                await group.get("different", loader)
            except OverflowError:
                overflow = True
            assert overflow
            first.cancel()
            try:
                await first
            except asyncio.CancelledError:
                pass
            if not shield:
                try:
                    await second
                    raise AssertionError("Unsafe shared task unexpectedly survived waiter cancellation")
                except asyncio.CancelledError:
                    results["unsafe_control"] = "canceling one waiter canceled the shared load and the second waiter"
            else:
                assert len(group.tasks) == 1
                finish.set()
                assert await second == "loaded"
                results["shielded_remaining_waiter"] = "loaded"
            assert calls == 1 and not group.tasks
            assert first.done() and second.done()
            results["loader_calls_per_variant"] = calls
            results["active_key_bound"] = 1
            results["additional_key_rejected"] = overflow
    results.update({"scope": "Event-gated in-process asyncio model; no distributed coalescer or source I/O",
                    "limit": "Cancellation isolation does not make a loader durable. A real service must own loader shutdown, timeouts, shared errors, and capacity across processes."})
    return results


def run_probes(port, database, results):
    source = Source(database)
    try:
        with Redis(port) as cache:
            cases = [("bounded-ttl-jitter", ttl_jitter), ("negative-cache-repeated-miss", repeated_negative),
                     ("negative-create-stale-fill", negative_create_race), ("bloom-readiness", bloom_readiness),
                     ("bloom-false-positive", bloom_false_positive), ("lease-resource-fencing", lease_fencing),
                     ("scan-prohibited-keys", scan_policy),
                     ("singleflight-cancellation-bound", lambda *_: asyncio.run(singleflight_async()))]
            for case_id, function in cases:
                try:
                    evidence = function(cache, source, port)
                    results.append({"id": case_id, "status": "pass", "evidence": evidence})
                except Exception as error:
                    results.append({"id": case_id, "status": "fail", "error": f"{type(error).__name__}: {error}"})
    finally:
        source.close()
