"""Pinned, disposable single-broker integration; synthetic local data only."""

import json
import secrets
import shutil
import sqlite3
import subprocess
import tempfile
import time
import uuid
from contextlib import contextmanager
from pathlib import Path


IMAGE = "rabbitmq:4.3.0@sha256:46bf0bdf0d2008acae9c5475558001e961297bd0868214c9216bef107d7d2b87"
QUEUE = "commit-before-ack"


def docker(*args: str, timeout: int = 30) -> subprocess.CompletedProcess:
    return subprocess.run(["docker", *args], capture_output=True, text=True, timeout=timeout, check=False)


def successful(result: subprocess.CompletedProcess) -> str:
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "Docker command failed")
    return result.stdout.strip()


@contextmanager
def database(path: Path):
    connection = sqlite3.connect(path)
    try:
        connection.execute("PRAGMA synchronous=FULL")
        yield connection
    finally:
        connection.close()  # Also rolls back any unfinished transaction.


def run_cases(pika, parameters, path: Path, result: dict) -> None:
    with database(path) as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("CREATE TABLE applied (operation TEXT PRIMARY KEY, amount INTEGER NOT NULL)")
        db.execute("CREATE TABLE effects (operation TEXT PRIMARY KEY, count INTEGER NOT NULL)")
        db.commit()

    def effect(operation, amount=1, commit=True):
        with database(path) as db:
            db.execute("BEGIN IMMEDIATE")
            inserted = db.execute("INSERT INTO applied VALUES (?, ?) ON CONFLICT DO NOTHING", (operation, amount)).rowcount
            if inserted:
                db.execute("INSERT INTO effects VALUES (?, 1)", (operation,))
            elif db.execute("SELECT amount FROM applied WHERE operation=?", (operation,)).fetchone()[0] != amount:
                raise ValueError("operation identity reused with changed intent")
            db.commit() if commit else db.rollback()
            return inserted

    def count(operation):
        with database(path) as db:
            row = db.execute("SELECT count FROM effects WHERE operation=?", (operation,)).fetchone()
            return row[0] if row else 0

    def connect():
        connection = pika.BlockingConnection(parameters)
        try:
            channel = connection.channel()
            channel.confirm_delivery()
            return connection, channel
        except BaseException:
            connection.close()
            raise

    def receive(channel):
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            method, _, body = channel.basic_get(QUEUE, auto_ack=False)
            if method:
                return method, json.loads(body)
            time.sleep(.05)  # Bounded observation of broker requeue, not a scheduling assumption.
        raise AssertionError("broker did not provide expected recoverable message")

    def publish(channel, operation, amount=1):
        channel.basic_publish("", QUEUE, json.dumps({"operation": operation, "amount": amount}).encode(),
                              properties=pika.BasicProperties(delivery_mode=2, message_id=operation), mandatory=True)

    def acknowledge(channel, tag):
        channel.basic_ack(delivery_tag=tag)
        # An RPC response on this channel establishes processing of the preceding ACK.
        return channel.queue_declare(QUEUE, passive=True).method.message_count

    connection = None
    try:
        deadline = time.monotonic() + 60
        while True:
            try:
                connection, channel = connect()
                break
            except pika.exceptions.AMQPConnectionError:
                if time.monotonic() >= deadline:
                    raise RuntimeError("RabbitMQ readiness deadline exceeded")
                time.sleep(.25)
        properties = connection._impl.server_properties
        result["runtime"].update({"broker_version": str(properties["version"]), "erlang": str(properties["platform"]), "sqlite": sqlite3.sqlite_version})
        assert str(properties["version"]) == "4.3.0"
        channel.queue_declare(QUEUE, durable=True, arguments={"x-queue-type": "classic"})
        observations = result["cases"]

        operation = "commit-before-ack"
        publish(channel, operation)
        first, body = receive(channel)
        assert body["operation"] == operation and first.redelivered is False
        assert effect(operation) == 1 and count(operation) == 1
        connection.close()
        connection, channel = connect()
        retried, body = receive(channel)
        assert retried.redelivered is True and body["operation"] == operation
        assert effect(operation) == 0 and count(operation) == 1
        assert acknowledge(channel, retried.delivery_tag) == 0
        observations.append({"name": operation, "status": "passed", "redelivered": True, "effect_count": 1})

        publish(channel, operation)
        independent, body = receive(channel)
        assert independent.redelivered is False and body["operation"] == operation
        assert effect(operation) == 0 and count(operation) == 1
        assert acknowledge(channel, independent.delivery_tag) == 0
        observations.append({"name": "independently-published-duplicate", "status": "passed", "redelivered": False, "effect_count": 1})

        try:
            effect(operation, amount=2)
            raise AssertionError("same identity accepted changed intent")
        except ValueError:
            pass
        assert count(operation) == 1
        observations.append({"name": "changed-intent-rejected", "status": "passed", "effect_count": 1})

        operation = "rollback-before-disconnect"
        publish(channel, operation)
        first, body = receive(channel)
        assert body["operation"] == operation
        assert effect(operation, commit=False) == 1 and count(operation) == 0
        connection.close()
        connection, channel = connect()
        retried, body = receive(channel)
        assert retried.redelivered is True and body["operation"] == operation
        assert effect(operation) == 1 and count(operation) == 1
        assert acknowledge(channel, retried.delivery_tag) == 0
        observations.append({"name": operation, "status": "passed", "rolled_back_effect_count": 0, "final_effect_count": 1})

        operation = "ack-before-commit-negative-control"
        publish(channel, operation)
        first, body = receive(channel)
        assert body["operation"] == operation
        assert acknowledge(channel, first.delivery_tag) == 0
        connection.close()
        connection, channel = connect()
        missing, _, _ = channel.basic_get(QUEUE, auto_ack=False)
        assert missing is None and count(operation) == 0
        observations.append({"name": operation, "status": "passed", "unsafe_result_reproduced": True, "message_recoverable": False, "effect_count": 0})
        channel.queue_delete(QUEUE)
    finally:
        if connection is not None and connection.is_open:
            connection.close()


def verify_broker() -> dict:
    result = {
        "status": "failed",
        "runtime": {"requested_image": IMAGE},
        "configuration": {"broker_count": 1, "queue_type": "classic", "durable_queue": True, "persistent_messages": True, "publisher_confirms": True, "consumer_ack": "manual", "ledger": "SQLite WAL, synchronous=FULL"},
        "cases": [],
        "cleanup": {"container_removed": False, "anonymous_volumes_removed": False, "temporary_ledger_created": False, "temporary_ledger_removed": False},
        "limits": [
            "One local broker and SQLite file; no quorum, failover, or power-loss guarantee was tested.",
            "Consumer connections closed gracefully; neither broker nor host was restarted or killed.",
            "Durable settings are configuration, not an observed restart-survival proof.",
            "No DLQ transfer/persistence, external-provider transaction, ledger expiry, or parallel consumer test.",
        ],
    }
    token = uuid.uuid4().hex
    name = "tal-messaging-" + token[:12]
    start_attempted = False
    ledger_directory = None
    try:
        if not shutil.which("docker"):
            raise RuntimeError("Docker is required for --broker; default semantic checks need no Docker")
        try:
            import pika
        except ImportError as error:
            raise RuntimeError("Install examples/messaging/requirements.txt before --broker") from error
        if pika.__version__ != "1.3.2":
            raise RuntimeError("This example pins Pika 1.3.2; use its requirements.txt")
        result["runtime"]["pika"] = pika.__version__
        result["runtime"]["docker_engine"] = successful(docker("version", "--format", "{{.Server.Version}}"))
        inspected = docker("image", "inspect", IMAGE)
        if inspected.returncode:
            successful(docker("pull", IMAGE, timeout=180))
            inspected = docker("image", "inspect", IMAGE)
        image = json.loads(successful(inspected))[0]
        result["runtime"].update({"image_id": image["Id"], "repo_digests": image["RepoDigests"], "architecture": image["Architecture"], "os": image["Os"]})
        password = secrets.token_urlsafe(24)
        start_attempted = True
        successful(docker("run", "--detach", "--name", name, "--label", "tal-skills.messaging-run=" + token,
                          "--publish", "127.0.0.1::5672", "--env", "RABBITMQ_DEFAULT_USER=fixture",
                          "--env", "RABBITMQ_DEFAULT_PASS=" + password, IMAGE))
        address = successful(docker("port", name, "5672/tcp"))
        host, port = address.rsplit(":", 1)
        assert host == "127.0.0.1", "broker must remain loopback-only"
        parameters = pika.ConnectionParameters(host, int(port), "/", pika.PlainCredentials("fixture", password),
                                               socket_timeout=3, blocked_connection_timeout=5, connection_attempts=1)
        with tempfile.TemporaryDirectory(prefix="tal-messaging-") as directory:
            ledger_directory = Path(directory)
            result["cleanup"]["temporary_ledger_created"] = True
            run_cases(pika, parameters, ledger_directory / "effects.sqlite3", result)
        result["status"] = "passed"
    except Exception as error:
        result["failure"] = {"type": type(error).__name__, "message": str(error)}
    finally:
        result["cleanup"]["temporary_ledger_removed"] = ledger_directory is not None and not ledger_directory.exists()
        if start_attempted:
            try:
                owned = successful(docker("ps", "-a", "--filter", "label=tal-skills.messaging-run=" + token, "--format", "{{.Names}}"))
                if owned:
                    assert owned == name, "unexpected resource matched the unique ownership label"
                    successful(docker("rm", "--force", "--volumes", name))
                remaining = successful(docker("ps", "-a", "--filter", "label=tal-skills.messaging-run=" + token, "--format", "{{.Names}}"))
                assert not remaining, "owned broker still exists after cleanup"
                result["cleanup"].update({"container_removed": True, "anonymous_volumes_removed": True, "image_retained": True})
            except Exception as error:
                result["status"] = "failed"
                result["cleanup"]["failure"] = str(error)
                result["cleanup"]["owned_container"] = name
    return result
