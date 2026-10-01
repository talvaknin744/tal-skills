"""Finite loopback HTTP histories; custom trusted retry metadata, not Uber middleware."""
from collections import Counter
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import threading
from urllib.error import HTTPError
from urllib.request import Request, ProxyHandler, build_opener


@dataclass
class State:
    mode: str
    attempts: tuple = (2, 2, 2)
    context_drop: bool = False
    missing_claim: bool = False
    effects: bool = False
    deduplicate: bool = False
    calls: Counter = field(default_factory=Counter)
    journal: list = field(default_factory=list)
    receipts: dict = field(default_factory=dict)
    effect_count: int = 0
    lock: threading.Lock = field(default_factory=threading.Lock)


def request(url, headers=None):
    # Only the response from this configured local peer can supply a claim.
    try:
        response = build_opener(ProxyHandler({})).open(
            Request(url, headers=headers or {}), timeout=3)
    except HTTPError as error:
        response = error
    with response:
        body = json.loads(response.read())
        raw = response.headers.get('X-Example-Retry-Claim')
        if raw not in (None, '0', '1'):
            raise ValueError('Malformed internal claim')
        return response.status, None if raw is None else raw == '1', body


def chain(state, forged_claim=False):
    servers, threads = [], []
    addresses = [None] * 4

    def handler(node):
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass

            def do_GET(self):
                with state.lock:
                    state.calls[node] += 1
                    state.journal.append({'node': node, 'event': 'received'})
                claim = True
                if node == 3:
                    status, body = 503, {'error': 'leaf unavailable'}
                    if state.effects:
                        with state.lock:
                            if state.deduplicate and 'operation-1' in state.receipts:
                                status, body = 200, state.receipts['operation-1']
                            else:
                                state.effect_count += 1
                                body = {'receipt': state.effect_count}
                                state.receipts['operation-1'] = body
                                # First effect is committed before an error response.
                                status = 503 if state.calls[node] == 1 else 200
                else:
                    maximum = state.attempts[node]
                    tried = 0
                    for attempt in range(maximum):
                        if attempt:
                            tried += 1
                        status, downstream_claim, body = request(addresses[node + 1])
                        if status < 400:
                            break
                        if state.mode == 'owned' and downstream_claim is False:
                            break
                    # A configured, eligible retry opportunity was exercised here,
                    # or suppression was inherited. No configured retry leaves a
                    # claim for a configured ancestor to evaluate, not a mandate.
                    claim = not (tried > 0 or downstream_claim is False)
                    if node == 2 and state.context_drop:
                        claim = True
                payload = json.dumps(body).encode()
                self.send_response(status)
                if not (node == 2 and state.missing_claim):
                    self.send_header('X-Example-Retry-Claim', '1' if claim else '0')
                self.send_header('Content-Length', str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        return Handler

    try:
        for node in reversed(range(4)):
            server = ThreadingHTTPServer(('127.0.0.1', 0), handler(node))
            server.daemon_threads = False
            servers.append(server)
            addresses[node] = f'http://127.0.0.1:{server.server_port}/'
            thread = threading.Thread(target=server.serve_forever,
                                      kwargs={'poll_interval': 0.01},
                                      name=f'retry-example-{node}')
            threads.append(thread)
            thread.start()
        headers = {'X-Example-Retry-Claim': '0'} if forged_claim else None
        status, claim, body = request(addresses[0], headers)
    finally:
        for server in servers:
            server.shutdown()
            server.server_close()
        for thread in threads:
            thread.join(timeout=3)
        if any(thread.is_alive() for thread in threads):
            raise RuntimeError('Owned HTTP thread did not exit')
    return {'calls': [state.calls[i] for i in range(4)], 'status': status,
            'claim': claim, 'body': body, 'effects': state.effect_count,
            'journal': state.journal, 'owned_servers_closed': len(servers)}


def causal_claim(local_failure, required_failure, optional_failure):
    # An optional failure alone did not cause this request's failure. An actual
    # required causal failure takes precedence here; simultaneous competing
    # causes require a richer application contract than this small classifier.
    return local_failure and not required_failure


def admitted_schedule(deadline, budget, delays):
    now, admitted = 0, []
    for delay in delays:
        now += delay
        if now >= deadline or len(admitted) >= budget:
            break
        admitted.append(now)
    return admitted
