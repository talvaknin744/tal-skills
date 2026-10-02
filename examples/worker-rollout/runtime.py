"""Bounded real worker: private stdio control, loopback readiness, real SIGTERM."""
from __future__ import annotations
import argparse
import json
import os
import select
import signal
import socket
import sys
import time
import protocol


def emit(event, **data):
    print(json.dumps({"event": event, **data}, separators=(",", ":")), flush=True)


class Runtime:
    def __init__(self, args, version, supported, amount):
        self.args, self.version, self.supported, self.amount = args, version, supported, amount
        self.reserved, self.active = {}, None
        self.terminal = {}
        self.first_signal, self.signal_count = None, 0
        self.drain_inventory, self.session, self.listener = None, None, None
        self.input_buffer = b""
        self.pending = []
        self.closed = False

    def signal(self, _signum, _frame):
        # No SQL, socket writes or locks in this handler. Python runs it in main.
        self.signal_count += 1
        if self.first_signal is None:
            self.first_signal = time.monotonic()
            if self.session:
                self.session.deadline = self.first_signal + self.args.drain_budget

    def start(self):
        signal.signal(signal.SIGTERM, self.signal)
        self.session = protocol.Session(os.environ["WORKER_ROLLOUT_DSN"], worker=True)
        if self.first_signal is not None:
            self.session.deadline = self.first_signal + self.args.drain_budget
        self.listener = socket.socket()
        self.listener.bind(("127.0.0.1", 0))
        self.listener.listen(8)
        self.listener.setblocking(False)
        emit("ready", pid=os.getpid(), version=self.version, generation=self.args.generation,
             host="127.0.0.1", port=self.listener.getsockname()[1],
             supported=[list(item) for item in sorted(self.supported)])

    def poll(self, timeout=0.01):
        if self.pending:
            return self.pending.pop(0)
        readable, _, _ = select.select([sys.stdin.fileno(), self.listener], [], [], timeout)
        if self.listener in readable:
            client, _ = self.listener.accept()
            try:
                client.settimeout(0.02)
                client.recv(1024)
                status = "503 Service Unavailable" if self.first_signal is not None else "200 OK"
                client.sendall(f"HTTP/1.1 {status}\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".encode())
            finally:
                client.close()
        if sys.stdin.fileno() in readable:
            chunk = os.read(sys.stdin.fileno(), 4096)
            if not chunk:
                raise EOFError("fixture coordinator disconnected")
            self.input_buffer += chunk
            if len(self.input_buffer) > 16384:
                raise ValueError("control input too large")
            while b"\n" in self.input_buffer:
                line, self.input_buffer = self.input_buffer.split(b"\n", 1)
                self.pending.append(json.loads(line))
        return self.pending.pop(0) if self.pending else None

    def tick(self):
        if self.first_signal is None or self.drain_inventory is not None:
            return
        owned = protocol.close_admission(self.session, self.args.generation, self.args.owner)
        inventory = []
        reconciled = []
        for row in owned:
            # Reconcile from durable ownership even if the signal interrupted the
            # local post-claim bookkeeping. No claim is hidden by a local list.
            state = {**row, "job": row["id"], "deadline": row["deadline"].isoformat()}
            if row["id"] not in self.reserved:
                reconciled.append(row["id"])
            self.reserved[row["id"]] = state
            inventory.append({"job": row["id"], "epoch": row["epoch"], "checkpoint": row["checkpoint"],
                              "kind": "active" if row["id"] == self.active else "prefetched"})
        self.drain_inventory = inventory
        emit("drain_started", inventory=inventory, admission=False,
             reconciled_committed_claims=reconciled,
             first_signal_monotonic=self.first_signal, drain_deadline_monotonic=self.session.deadline)

    def status(self):
        emit("status", admission=self.first_signal is None, reserved=sorted(self.reserved),
             signal_count=self.signal_count, first_signal_monotonic=self.first_signal,
             drain_deadline_monotonic=self.session.deadline)

    def reserve(self, command):
        job = command["job"]
        if self.first_signal is not None:
            emit("claim", job=job, accepted=False, reason="local-admission-closed")
            return
        if job in self.reserved:
            raise ValueError("already reserved")
        state = protocol.claim(self.session, job, self.args.owner, self.args.generation, self.supported)
        if state["accepted"]:
            if command.get("pause_before_publish"):
                emit("claim_committed", job=job, epoch=state["epoch"])
                if not self.wait(seam="before_claim_publish"):
                    self.shutdown("drain-budget-exhausted")
                    return
            self.reserved[job] = state
        emit("claim", **{**state, "job": job})
        if state["accepted"] and state["checkpoint"] == len(state["manifest"]):
            # Recovery can observe all effects checkpointed but no terminal
            # completion (a separate transaction). Finalize without indexing.
            result = protocol.finish(*self.args_for(job))
            emit("completion", job=job, result=result)
            if result["accepted"]:
                self.reserved.pop(job)
                self.terminal[job] = "completed"

    def ancillary(self, command):
        operation = command["operation"]
        if operation == "reserve":
            self.reserve(command)
        elif operation == "status":
            self.status()
        else:
            raise ValueError("only admission/status/continue accepted during a slice")

    def wait(self, seconds=0, *, seam=None):
        until = time.monotonic() + seconds
        if seam:
            emit(seam, job=self.active)
        while seam or time.monotonic() < until:
            self.tick()
            if self.session.deadline is not None and time.monotonic() >= self.session.deadline:
                return False
            command = self.poll()
            if command:
                if command["operation"] == "continue" and seam:
                    return True
                self.ancillary(command)
        self.tick()
        return self.session.deadline is None or time.monotonic() < self.session.deadline

    def args_for(self, job):
        state = self.reserved[job]
        return (self.session, job, self.args.owner, state["epoch"], state["input_hash"])

    def slice(self, command):
        job = command["job"]
        if self.first_signal is not None:
            raise ValueError("cannot begin a new slice while draining")
        self.active = job
        state = self.reserved[job]
        step = state["checkpoint"]
        duration = float(command.get("seconds", 0.02))
        if not 0 <= duration <= 2:
            raise ValueError("fixture slices must be between zero and two seconds")
        emit("slice_started", job=job, step=step, version=self.version)
        if not self.wait(duration) or (command.get("pause_before_effect") and not self.wait(seam="before_effect")):
            self.shutdown("drain-budget-exhausted")
            return
        result = protocol.effect(*self.args_for(job), step, self.amount(state, step))
        emit("effect", job=job, result=result)
        if result["accepted"]:
            if command.get("pause_after_effect") and not self.wait(seam="after_effect"):
                self.shutdown("drain-budget-exhausted")
                return
            progress = protocol.checkpoint(*self.args_for(job), step)
            emit("checkpoint", job=job, result=progress)
            if progress["accepted"]:
                state["checkpoint"] = progress["checkpoint"]
                if state["checkpoint"] == len(state["manifest"]):
                    if command.get("pause_after_final_checkpoint") and not self.wait(seam="after_final_checkpoint"):
                        self.shutdown("drain-budget-exhausted")
                        return
                    completion = protocol.finish(*self.args_for(job))
                    emit("completion", job=job, result=completion)
                    if completion["accepted"]:
                        self.reserved.pop(job)
                        self.terminal[job] = "completed"
        elif result["reason"] == "deadline-exceeded":
            self.reserved.pop(job)
            self.terminal[job] = "deadline-exceeded"
        emit("slice_done", job=job, effect=result)
        if self.first_signal is not None:
            self.shutdown("current-slice-finished")
        else:
            self.active = None

    def mutate(self, command):
        job, operation = command["job"], command["mutation"]
        state = self.reserved[job]
        if operation == "effect":
            result = protocol.effect(*self.args_for(job), state["checkpoint"], self.amount(state, state["checkpoint"]))
        elif operation == "checkpoint":
            result = protocol.checkpoint(*self.args_for(job), state["checkpoint"])
        elif operation == "release":
            result = protocol.release(*self.args_for(job), "maintenance")
            self.reserved.pop(job)
        else:
            raise ValueError("unknown protected mutation")
        emit("mutation", mutation=operation, job=job, result=result)

    def close(self):
        if self.listener:
            self.listener.close()
        if self.session:
            self.session.close()
        self.closed = True

    def shutdown(self, reason):
        dispositions = []
        for item in self.drain_inventory or []:
            job = item["job"]
            if job not in self.reserved:
                dispositions.append({**item, "disposition": self.terminal.get(job, "unresolved")})
                continue
            try:
                classification = "business-failure" if self.args.policy == "harmful" else "maintenance"
                result = protocol.release(*self.args_for(job), classification)
                dispositions.append({**item, "disposition": "released" if result["accepted"] else result["reason"], "result": result})
            except protocol.DrainBudgetExceeded:
                dispositions.append({**item, "disposition": "lease-recovery-required"})
        first, deadline = self.first_signal, self.session.deadline
        self.close()
        emit("shutdown", reason=reason, dispositions=dispositions, signal_count=self.signal_count,
             first_signal_monotonic=first, drain_deadline_monotonic=deadline,
             drain_elapsed_seconds=time.monotonic() - first,
             readiness_socket_closed=True, database_connection_closed=True)

    def run(self):
        self.start()
        try:
            while not self.closed:
                self.tick()
                if self.first_signal is not None:
                    self.shutdown("idle-drain")
                    break
                command = self.poll()
                if not command:
                    continue
                operation = command["operation"]
                if operation == "reserve":
                    self.reserve(command)
                elif operation == "slice":
                    self.slice(command)
                elif operation == "status":
                    self.status()
                elif operation == "mutate":
                    self.mutate(command)
                elif operation == "stop":
                    if self.reserved:
                        raise ValueError("cannot stop with retained owned work")
                    self.close()
                    emit("stopped", readiness_socket_closed=True, database_connection_closed=True)
                else:
                    raise ValueError("unknown command")
        except protocol.DrainBudgetExceeded:
            # If the budget ends while entering SQL, close without an unbounded
            # release. A successor must wait for the durable lease and fence.
            self.shutdown("drain-budget-exhausted")
        finally:
            self.close()


def main(version, supported, amount):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--owner", required=True)
    parser.add_argument("--generation", required=True)
    parser.add_argument("--policy", choices=("protected", "harmful"), default="protected")
    parser.add_argument("--drain-budget", type=float, default=1)
    args = parser.parse_args()
    if not 0.2 <= args.drain_budget <= 5:
        parser.error("drain budget must be between 0.2 and 5 seconds")
    try:
        Runtime(args, version, supported, amount).run()
    except Exception as error:
        emit("error", type=type(error).__name__, message=str(error).replace(os.environ.get("WORKER_ROLLOUT_DSN", ""), "[redacted]"))
        raise SystemExit(1)
