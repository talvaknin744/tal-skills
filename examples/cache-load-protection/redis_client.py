"""Bounded RESP2 client for these disposable fixtures, not an application driver."""

import socket


class RedisError(RuntimeError):
    pass


class Redis:
    def __init__(self, port):
        self.socket = socket.create_connection(("127.0.0.1", port), timeout=3)
        self.file = self.socket.makefile("rb")

    def command(self, *arguments):
        parts = [str(value).encode() for value in arguments]
        request = b"*" + str(len(parts)).encode() + b"\r\n"
        for part in parts:
            request += b"$" + str(len(part)).encode() + b"\r\n" + part + b"\r\n"
        self.socket.sendall(request)
        return self._read()

    def _read(self):
        line = self.file.readline()
        if not line or not line.endswith(b"\r\n"):
            raise ConnectionError("Incomplete Redis response")
        kind, value = line[:1], line[1:-2]
        if kind == b"+":
            return value.decode()
        if kind == b"-":
            raise RedisError(value.decode())
        if kind == b":":
            return int(value)
        if kind == b"$":
            length = int(value)
            if length == -1:
                return None
            data = self.file.read(length)
            if len(data) != length or self.file.read(2) != b"\r\n":
                raise ConnectionError("Incomplete Redis bulk string")
            return data.decode()
        if kind == b"*":
            length = int(value)
            return None if length == -1 else [self._read() for _ in range(length)]
        raise ValueError(f"Unsupported fixture response: {kind!r}")

    def close(self):
        self.file.close()
        self.socket.close()

    def __enter__(self):
        return self

    def __exit__(self, *unused):
        self.close()
