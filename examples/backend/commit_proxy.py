"""Loopback-only PostgreSQL fault fixture: withhold actual COMMIT replies.

The client-to-server direction forwards bytes unchanged. The server-to-client
direction parses PostgreSQL frames and closes both sockets when CommandComplete
says COMMIT. The database has therefore completed the transaction, while the
client cannot observe that acknowledgement. TLS is disabled in this fixture.
"""

from __future__ import annotations

import json
import socket
import struct
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class CommitReplyProxy:
    def __init__(self, upstream_host: str, upstream_port: int):
        self.upstream = (upstream_host, upstream_port)
        self.stop = threading.Event()
        self.lock = threading.Lock()
        self.sockets: set[socket.socket] = set()
        self.workers: list[threading.Thread] = []
        self.connections = 0
        self.commits_dropped = 0
        self.errors: list[str] = []
        self.listener = socket.socket()
        self.listener.bind(("127.0.0.1", 0))
        self.listener.listen()
        self.listener.settimeout(0.2)
        self.port = self.listener.getsockname()[1]
        proxy = self

        class Status(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path != "/":
                    self.send_error(404)
                    return
                payload = json.dumps(proxy.snapshot()).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def log_message(self, *_):
                pass

        self.control = ThreadingHTTPServer(("127.0.0.1", 0), Status)
        self.control.daemon_threads = True
        self.control_url = f"http://127.0.0.1:{self.control.server_port}/"
        self.accept_thread = threading.Thread(target=self._accept, daemon=True)
        self.control_thread = threading.Thread(target=self.control.serve_forever, daemon=True)
        self.accept_thread.start()
        self.control_thread.start()

    def snapshot(self):
        with self.lock:
            return {"connections": self.connections,
                    "commits_dropped": self.commits_dropped,
                    "errors": list(self.errors)}

    @staticmethod
    def _close(sock):
        try:
            sock.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        sock.close()

    def _accept(self):
        while not self.stop.is_set():
            try:
                client, _ = self.listener.accept()
            except socket.timeout:
                continue
            except OSError:
                return
            with self.lock:
                self.connections += 1
                self.sockets.add(client)
            worker = threading.Thread(target=self._connection, args=(client,), daemon=True)
            self.workers.append(worker)
            worker.start()

    def _connection(self, client):
        server = None
        forwarder = None
        try:
            server = socket.create_connection(self.upstream, timeout=5)
            server.settimeout(None)
            with self.lock:
                self.sockets.add(server)

            def forward():
                try:
                    while chunk := client.recv(65536):
                        server.sendall(chunk)
                except OSError:
                    pass
                finally:
                    try:
                        server.shutdown(socket.SHUT_WR)
                    except OSError:
                        pass

            forwarder = threading.Thread(target=forward, daemon=True)
            forwarder.start()

            def exact(count):
                chunks = bytearray()
                while len(chunks) < count:
                    chunk = server.recv(count - len(chunks))
                    if not chunk:
                        raise EOFError
                    chunks.extend(chunk)
                return bytes(chunks)

            while not self.stop.is_set():
                kind = exact(1)
                length_bytes = exact(4)
                length = struct.unpack("!I", length_bytes)[0]
                if not 4 <= length <= 64 * 1024 * 1024:
                    raise ValueError("invalid PostgreSQL frame; fixture requires sslmode=disable")
                payload = exact(length - 4)
                if kind == b"C" and payload == b"COMMIT\0":
                    with self.lock:
                        self.commits_dropped += 1
                    return
                client.sendall(kind + length_bytes + payload)
        except (EOFError, ConnectionError, OSError):
            pass  # Client disconnects and the injected drop are expected.
        except Exception as exc:
            with self.lock:
                self.errors.append(f"{type(exc).__name__}: {exc}")
        finally:
            self._close(client)
            if server:
                self._close(server)
            if forwarder:
                forwarder.join(timeout=5)
                if forwarder.is_alive():
                    with self.lock:
                        self.errors.append("client forwarding thread did not stop")
            with self.lock:
                self.sockets.discard(client)
                self.sockets.discard(server)

    def close(self):
        self.stop.set()
        self.listener.close()
        self.control.shutdown()
        self.control.server_close()
        self.accept_thread.join(timeout=5)
        with self.lock:
            sockets = list(self.sockets)
        for sock in sockets:
            self._close(sock)
        for worker in self.workers:
            worker.join(timeout=5)
        self.control_thread.join(timeout=5)
        alive = sum(worker.is_alive() for worker in self.workers)
        if alive:
            raise RuntimeError(f"{alive} proxy connection workers did not stop")
