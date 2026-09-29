"""Explicit, disposable cache-ordering verification; not a production adapter."""
import argparse
import hashlib
import json
import multiprocessing as mp
import os
from pathlib import Path
import signal
import socket
import sqlite3
import subprocess
import sys
import tempfile
import uuid
import time

REDIS_VERSION = '8.10.2'
REDIS_IMAGE = 'redis@sha256:3811787313eba226a2ef38658c6ccb91cd5e110edc89c37767de373120a0e5a0'
OWNER_LABEL = 'io.tal-skills.cache-example-run'
FLOOR, VALUE = 'probe:{north}:floor', 'probe:{north}:value'

PUBLISH = """
local f = redis.call('GET', KEYS[1])
if not f then return -1 end
local floor = tonumber(f)
local cached = tonumber(redis.call('HGET', KEYS[2], 'revision') or '0')
local proposed = tonumber(ARGV[1])
if proposed < floor or proposed < cached then return 0 end
redis.call('HSET', KEYS[2], 'revision', ARGV[1], 'record', ARGV[2])
redis.call('SET', KEYS[1], ARGV[1])
return 1
"""

PERMISSIVE_PUBLISH = PUBLISH.replace(
    "if not f then return -1 end", "if not f then f = '0' end")

ADVANCE = """
local f = redis.call('GET', KEYS[1])
if not f then return -1 end
local cached = tonumber(redis.call('HGET', KEYS[2], 'revision') or '0')
local floor = math.max(tonumber(f), tonumber(ARGV[1]))
redis.call('SET', KEYS[1], tostring(floor))
if cached < floor then redis.call('DEL', KEYS[2]) end
return floor
"""

READ = """
local f = redis.call('GET', KEYS[1])
if not f then return false end
local cached = tonumber(redis.call('HGET', KEYS[2], 'revision') or '0')
if cached < tonumber(f) then return false end
return redis.call('HGET', KEYS[2], 'record')
"""

DELTA_CONTROL = """
local previous = tonumber(redis.call('GET', KEYS[1]) or '0')
if tonumber(ARGV[1]) <= previous then return 0 end
redis.call('INCRBY', KEYS[2], ARGV[2])
redis.call('SET', KEYS[1], ARGV[1])
return 1
"""


class Redis:
    """Small RESP2 client for this local fixture, not a general Redis driver."""
    def __init__(self, port):
        self.socket = socket.create_connection(('127.0.0.1', port), timeout=5)
        self.file = self.socket.makefile('rb')

    def command(self, *args):
        data = [str(a).encode() for a in args]
        request = b'*' + str(len(data)).encode() + b'\r\n'
        for part in data:
            request += b'$' + str(len(part)).encode() + b'\r\n' + part + b'\r\n'
        self.socket.sendall(request)
        return self.response()

    def response(self):
        line = self.file.readline()
        if not line:
            raise ConnectionError('Redis connection closed')
        kind, value = line[:1], line[1:-2]
        if kind == b'+':
            return value.decode()
        if kind == b'-':
            raise RuntimeError(value.decode())
        if kind == b':':
            return int(value)
        if kind == b'$':
            n = int(value)
            if n == -1:
                return None
            payload = self.file.read(n)
            assert self.file.read(2) == b'\r\n'
            return payload.decode()
        if kind == b'*':
            return [self.response() for _ in range(int(value))]
        raise ValueError(f'Unexpected RESP kind {kind}')

    def close(self):
        self.file.close()
        self.socket.close()

def worker(pipe, port, database):
    cache = Redis(port)
    connection = sqlite3.connect(database, isolation_level=None)
    pending = None
    pending_allowed = None
    read_count = 0

    def source_read():
        nonlocal read_count
        read_count += 1
        row = connection.execute('SELECT id, label, revision FROM labels WHERE id=?', ('north',)).fetchone()
        return dict(zip(('id', 'label', 'revision'), row))

    def publish(record, mode):
        if mode in ('naive', 'checked'):
            cache.command('HSET', VALUE, 'revision', record['revision'], 'record', json.dumps(record))
            return 1
        script = PERMISSIVE_PUBLISH if mode == 'permissive' else PUBLISH
        return cache.command('EVAL', script, 2, FLOOR, VALUE, record['revision'], json.dumps(record))

    pipe.send({'pid': os.getpid(), 'redis_client_id': cache.command('CLIENT', 'ID')})
    try:
        while True:
            request = pipe.recv()
            action, mode = request['action'], request.get('mode', 'fixed')
            if action == 'stop':
                pipe.send({'stopped': True})
                break
            try:
                if action == 'reset':
                    pending, pending_allowed, read_count = None, None, 0
                    result = {'reset': True}
                elif action == 'capture':
                    pending = source_read()
                    result = {'captured': pending, 'public_response_sent': False}
                    if mode == 'checked':
                        observed_floor = cache.command('GET', FLOOR)
                        pending_allowed = pending['revision'] >= int(observed_floor or 0)
                        result['client_observed_floor'] = observed_floor
                        result['client_check_allowed'] = pending_allowed
                elif action == 'finish':
                    assert pending is not None
                    # The intentionally broken variant checks before the pause,
                    # then acts on that stale decision after another writer.
                    accepted = 0 if mode == 'checked' and not pending_allowed else publish(pending, mode)
                    result = {'record': pending, 'publish_result': accepted, 'public_response_sent': True}
                    pending = None
                elif action == 'read':
                    raw = cache.command('EVAL', READ, 2, FLOOR, VALUE) if mode == 'fixed' else cache.command('HGET', VALUE, 'record')
                    if raw is not None:
                        result = {'record': json.loads(raw), 'path': 'cache'}
                    else:
                        record = source_read()
                        result = {'record': record, 'path': 'source', 'publish_result': publish(record, mode)}
                    result['source_reads'] = read_count
                elif action in ('write', 'commit_only'):
                    connection.execute('BEGIN IMMEDIATE')
                    connection.execute('UPDATE labels SET label=?, revision=revision+1 WHERE id=?', (request['label'], 'north'))
                    row = connection.execute('SELECT id, label, revision FROM labels WHERE id=?', ('north',)).fetchone()
                    connection.execute('COMMIT')
                    record = dict(zip(('id', 'label', 'revision'), row))
                    if action == 'commit_only':
                        result = {'record': record, 'database_committed': True, 'service_acknowledged': False}
                    else:
                        transition = cache.command('DEL', VALUE) if mode == 'naive' else cache.command('EVAL', ADVANCE, 2, FLOOR, VALUE, record['revision'])
                        result = {'record': record, 'database_committed': True,
                                  'cache_transition_result': transition, 'service_acknowledged': transition != -1}
                elif action == 'advance':
                    result = {'floor': cache.command('EVAL', ADVANCE, 2, FLOOR, VALUE, request['revision'])}
                elif action == 'delta_control':
                    result = {'applied': cache.command('EVAL', DELTA_CONTROL, 2,
                        'probe:{delta}:floor', 'probe:{delta}:value', request['sequence'], request['delta'])}
                elif action == 'stats':
                    result = {'source_reads': read_count}
                else:
                    raise ValueError(action)
                pipe.send({'ok': True, 'result': result})
            except Exception as error:
                pipe.send({'ok': False, 'error': repr(error)})
    finally:
        connection.close()
        cache.close()

def exercise(port, inspect, directory, resources):
    cache = Redis(port)
    resources['cache'] = cache
    info = dict(line.split(':', 1) for line in cache.command('INFO', 'server').splitlines() if ':' in line)
    assert info['redis_version'] == REDIS_VERSION, info['redis_version']
    database = directory / 'generated.sqlite3'
    source = sqlite3.connect(database, isolation_level=None)
    resources['source'] = source
    source.execute('PRAGMA journal_mode=WAL')
    source.execute('CREATE TABLE IF NOT EXISTS labels (id TEXT PRIMARY KEY, label TEXT NOT NULL, revision INTEGER NOT NULL)')
    context = mp.get_context('spawn')
    actors = resources['actors']
    processes = resources['processes']
    identities = {}
    for name in ('a', 'b'):
        local, remote = context.Pipe()
        process = context.Process(target=worker, args=(remote, port, str(database)))
        actors[name] = local
        processes.append(process)
        process.start()
        remote.close()
        assert local.poll(10), 'Worker did not initialize'
        identities[name] = local.recv()
    assert identities['a']['pid'] != identities['b']['pid']
    assert identities['a']['redis_client_id'] != identities['b']['redis_client_id']
    cases = resources['cases']
    trace = []

    def rpc(actor, action, **values):
        request = {'action': action, **values}
        actors[actor].send(request)
        assert actors[actor].poll(10), f'Timeout: {actor} {action}'
        response = actors[actor].recv()
        assert response.get('ok'), response
        trace.append({'sequence': len(trace) + 1, 'actor': actor, 'request': request, 'response': response['result']})
        return response['result']

    def reset():
        nonlocal trace
        trace = []
        source.execute('DELETE FROM labels')
        source.execute('INSERT INTO labels VALUES (?, ?, ?)', ('north', 'Original', 1))
        cache.command('DEL', FLOOR, VALUE)
        cache.command('SET', FLOOR, 1)
        rpc('a', 'reset')
        rpc('b', 'reset')

    def record(name, outcome, evidence):
        cases.append({'name': name, 'outcome': outcome, 'evidence': evidence, 'trace': list(trace)})

    def expire_floor():
        cache.command('PEXPIRE', FLOOR, 40)
        deadline = time.monotonic() + 3
        while cache.command('GET', FLOOR) is not None:
            assert time.monotonic() < deadline, 'Floor did not expire'
            time.sleep(0.005)
        cache.command('DEL', VALUE)

    reset()
    rpc('a', 'capture', mode='naive')
    ack = rpc('b', 'write', mode='naive', label='Updated')
    old = rpc('a', 'finish', mode='naive')
    later = rpc('b', 'read', mode='naive')
    assert ack['service_acknowledged'] and old['record']['revision'] == 1 and later['record']['revision'] == 1
    record('naive_cache_aside_stale_fill', 'forbidden_outcome_reproduced', {'ack_revision': 2, 'later_read_revision': 1})

    reset()
    checked = rpc('a', 'capture', mode='checked')
    rpc('b', 'write', label='Updated')
    rpc('a', 'finish', mode='checked')
    later = rpc('b', 'read', mode='naive')
    assert checked['client_observed_floor'] == '1' and checked['client_check_allowed']
    assert cache.command('GET', FLOOR) == '2' and later['record']['revision'] == 1
    record('client_check_then_set', 'forbidden_outcome_reproduced', {'floor_after_write': 2, 'cached_revision': 1})

    for eviction in (False, True):
        reset()
        rpc('a', 'capture')
        ack = rpc('b', 'write', label='Updated')
        if eviction:
            rpc('b', 'read')
            cache.command('DEL', VALUE)
            assert cache.command('GET', FLOOR) == '2'
        old = rpc('a', 'finish')
        later = rpc('b', 'read')
        repeated = rpc('b', 'read')
        assert ack['service_acknowledged'] and old['publish_result'] == 0 and old['record']['revision'] == 1
        assert later['record']['revision'] == 2 and repeated['path'] == 'cache'
        assert repeated['source_reads'] == later['source_reads']
        record('atomic_fill_after_value_eviction' if eviction else 'atomic_fill_after_write', 'contract_satisfied',
               {'overlapping_read_revision': 1, 'old_fill_result': 0, 'later_read_revision': 2,
                'value_eviction': eviction, 'floor_preserved': True, 'repeated_read_avoids_source': True})

    reset()
    rpc('a', 'capture')
    rpc('b', 'write', label='Second')
    rpc('b', 'write', label='Third')
    delayed = rpc('a', 'advance', revision=2)
    cache.command('DEL', VALUE)
    old = rpc('a', 'finish')
    later = rpc('b', 'read')
    assert delayed['floor'] == 3 and old['publish_result'] == 0 and later['record']['revision'] == 3
    record('delayed_older_notification', 'contract_satisfied', {'floor': 3, 'delayed_notification_revision': 2, 'later_read_revision': 3})

    for mode in ('permissive', 'fixed'):
        reset()
        rpc('a', 'capture')
        rpc('b', 'write', label='Updated')
        expire_floor()
        old = rpc('a', 'finish', mode=mode)
        later = rpc('b', 'read', mode=mode)
        if mode == 'permissive':
            assert old['publish_result'] == 1 and later['record']['revision'] == 1
            outcome = 'forbidden_outcome_reproduced'
        else:
            assert old['publish_result'] == -1 and later['record']['revision'] == 2 and later['path'] == 'source'
            assert later['publish_result'] == -1
            outcome = 'contract_satisfied_via_authoritative_fallback'
        record('floor_expiry_' + mode, outcome, {'metadata_loss': 'observed real PEXPIRE',
               'delayed_fill_result': old['publish_result'], 'later_read_revision': later['record']['revision'],
               'later_read_path': later['path']})

    reset()
    rpc('a', 'read')
    commit = rpc('b', 'commit_only', label='Updated')
    stale = rpc('a', 'read')
    assert commit['database_committed'] and not commit['service_acknowledged'] and stale['record']['revision'] == 1
    rpc('b', 'advance', revision=2)
    repaired = rpc('a', 'read')
    assert repaired['record']['revision'] == 2
    record('database_commit_before_cache_transition', 'dual_write_gap_observed',
           {'database_revision': 2, 'read_before_cache_transition': 1, 'service_acknowledged_during_gap': False,
            'read_after_replayed_floor_advance': 2, 'physical_process_crash': False})

    cache.command('DEL', 'probe:{delta}:floor', 'probe:{delta}:value')
    trace = []
    newer = rpc('b', 'delta_control', sequence=2, delta=10)
    older = rpc('a', 'delta_control', sequence=1, delta=1)
    observed = int(cache.command('GET', 'probe:{delta}:value'))
    assert newer['applied'] == 1 and older['applied'] == 0 and observed == 10
    record('snapshot_rule_cannot_discard_deltas', 'forbidden_outcome_reproduced',
           {'required_sum': 11, 'observed_sum': observed, 'late_delta_discarded': True})

    result = {'executed_at_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
              'scope': 'Two spawned service processes; separate Redis TCP and SQLite connections; generated local records',
              'container': {'id': inspect['Id'], 'image_id': inspect['Image'], 'configured_image': inspect['Config']['Image'],
                            'redis_version': info['redis_version'], 'port': port,
                            'persistence': 'disabled for disposable probe', 'maxmemory_policy': 'noeviction'},
              'python': sys.version, 'sqlite_version': sqlite3.sqlite_version, 'actors': identities,
              'scenario_count': len(cases), 'cases': cases,
              'scripts': {name: hashlib.sha256(script.encode()).hexdigest() for name, script in
                          [('publish', PUBLISH), ('advance', ADVANCE), ('read', READ)]}}
    return result


def docker(*args, timeout=30):
    return subprocess.run(
        ['docker', *args], capture_output=True, text=True, check=True,
        timeout=timeout,
    ).stdout.strip()


def start_container(directory, run_id):
    """Only synthetic data, a temporary container and a loopback port."""
    docker('info', '--format', '{{.ServerVersion}}', timeout=10)
    container_id = docker(
        'run', '--detach', '--pull=missing',
        '--name', 'tal-cache-' + run_id,
        '--label', OWNER_LABEL + '=' + run_id,
        '--cidfile', str(directory / 'container.id'),
        '--publish', '127.0.0.1::6379',
        '--memory', '256m', '--cpus', '1', '--read-only',
        '--tmpfs', '/data:rw,noexec,nosuid,size=16m',
        REDIS_IMAGE, 'redis-server', '--save', '', '--appendonly', 'no',
        '--maxmemory', '128mb', '--maxmemory-policy', 'noeviction',
        timeout=120,
    )
    inspect = json.loads(docker('inspect', container_id))[0]
    assert inspect['Config']['Labels'].get(OWNER_LABEL) == run_id
    port = int(inspect['NetworkSettings']['Ports']['6379/tcp'][0]['HostPort'])
    deadline = time.monotonic() + 10
    while True:
        connection = None
        try:
            connection = Redis(port)
            if connection.command('PING') == 'PONG':
                return port, inspect
        except (ConnectionError, OSError):
            if time.monotonic() >= deadline:
                raise RuntimeError('Disposable Redis did not become ready')
            time.sleep(0.05)
        finally:
            if connection:
                connection.close()
        if time.monotonic() >= deadline:
            raise RuntimeError('Disposable Redis did not return PONG')


def cleanup(resources, run_id):
    """Remove only processes and containers created by this invocation."""
    errors = []
    for pipe in resources['actors'].values():
        try:
            pipe.send({'action': 'stop'})
            if pipe.poll(1):
                pipe.recv()
        except (BrokenPipeError, EOFError, OSError):
            pass  # A terminated worker has nothing left to acknowledge.
        finally:
            pipe.close()

    process_results = []
    for process in resources['processes']:
        if process.pid is None:
            continue
        process.join(2)
        forced = process.is_alive()
        if forced:
            process.terminate()
            process.join(2)
        if process.is_alive():
            process.kill()
            process.join(2)
        stopped = not process.is_alive()
        process_results.append({
            'pid': process.pid, 'stopped': stopped, 'forced': forced,
            'exit_code': process.exitcode,
        })
        if not stopped:
            errors.append(f'Worker {process.pid} did not stop')
        elif forced or process.exitcode != 0:
            errors.append(f'Worker {process.pid} required forced cleanup or exited unsuccessfully')
        process.close()

    for name in ('source', 'cache'):
        if name in resources:
            try:
                resources[name].close()
            except Exception as error:
                errors.append(f'{name}: {error}')

    removed = []
    try:
        # The invocation-specific label also finds a container if `docker run`
        # created it but failed before returning its ID to this process.
        ids = docker('ps', '--all', '--quiet', '--no-trunc',
                     '--filter', 'label=' + OWNER_LABEL + '=' + run_id,
                     timeout=10).splitlines()
        for container_id in ids:
            inspect = json.loads(docker('inspect', container_id, timeout=10))[0]
            if inspect['Config']['Labels'].get(OWNER_LABEL) != run_id:
                raise RuntimeError('Refusing to remove an unowned container')
            docker('rm', '--force', container_id, timeout=15)
            removed.append(container_id)
    except Exception as error:
        errors.append(f'Container cleanup: {error}')
    return {'workers': process_results, 'removed_container_ids': removed,
            'errors': errors, 'images_removed': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path,
                        default=os.environ.get('TAL_EXAMPLE_REPORT'),
                        help='Write structured results here; otherwise emit JSON on stdout.')
    options = parser.parse_args()
    if not __debug__:
        parser.error('Run without -O: this verifier uses executable assertions.')
    if sys.version_info < (3, 11):
        parser.error('Python 3.11 or newer is required.')

    def interrupted(signum, frame):
        raise KeyboardInterrupt(f'Interrupted by signal {signum}')

    signal.signal(signal.SIGTERM, interrupted)
    run_id = uuid.uuid4().hex[:16]
    resources = {'actors': {}, 'processes': [], 'cases': []}
    report = {
        'schema_version': 1, 'status': 'failed', 'run_id': run_id,
        'image_pin': REDIS_IMAGE, 'expected_redis_version': REDIS_VERSION,
        'candidate_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'scope': 'Bounded local integration evidence; not a production adapter',
        'cases': resources['cases'],
    }
    exit_code = 1
    with tempfile.TemporaryDirectory(prefix='tal-cache-') as temporary:
        try:
            port, inspect = start_container(Path(temporary), run_id)
            report.update(exercise(port, inspect, Path(temporary), resources))
            report['status'] = 'passed'
            exit_code = 0
        except KeyboardInterrupt as error:
            report['status'] = 'interrupted'
            report['error'] = str(error)
            exit_code = 130
        except Exception as error:
            report['error'] = f'{type(error).__name__}: {error}'
            if isinstance(error, subprocess.CalledProcessError):
                report['command_error'] = error.stderr.strip()
        finally:
            report['cleanup'] = cleanup(resources, run_id)
            if report['cleanup']['errors']:
                report['status'] = 'failed'
                exit_code = 1
        report['scenario_count'] = len(report['cases'])
    report['cleanup']['temporary_database_removed'] = True
    report['limitations'] = [
        'The database commit and Redis transition are separate operations.',
        'An overlapping read may return an older snapshot; post-acknowledgement reads may not regress.',
        'Value deletion emulates eviction; memory-pressure eviction was not tested.',
        'Actual floor expiry was tested; persistence, restart, replication and failover were not.',
        'Missing metadata disables cache use and filling; automatic metadata recovery is absent.',
        'The interrupted dual write is a controlled boundary, not a physical crash or durable outbox.',
        'Conditional replacement of snapshots cannot be applied to unordered deltas.',
        'Lua revision comparison is only exercised for small exact integers.',
        'No throughput, arbitrary-schedule, arbitrary-database or external-effect guarantee is established.',
    ]
    if options.report:
        options.report.parent.mkdir(parents=True, exist_ok=True)
        options.report.write_text(json.dumps(report, indent=2) + '\n')
        print(f"{report['status']}: {report['scenario_count']} scenarios; report: {options.report}")
    else:
        print(json.dumps(report, indent=2))
    if 'error' in report:
        print(report['error'], file=sys.stderr)
    return exit_code


if __name__ == '__main__':
    raise SystemExit(main())
