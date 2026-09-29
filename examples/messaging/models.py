"""Single-threaded semantic models; these do not simulate broker durability."""

from dataclasses import dataclass, field


class Conflict(ValueError):
    pass


class GapLimit(ValueError):
    pass


@dataclass(frozen=True)
class Event:
    identity: str
    revision: int
    value: int | None


@dataclass
class CompleteState:
    """One aggregate with one revision authority and retained deletion progress."""

    revision: int = 0
    value: int | None = None
    events: dict[str, Event] = field(default_factory=dict)

    def apply(self, event: Event) -> str:
        if event.revision <= 0:
            raise ValueError("revision must be positive")
        previous = self.events.get(event.identity)
        if previous is not None:
            if previous != event:
                raise Conflict("event identity reused with changed intent")
            return "duplicate"
        if event.revision == self.revision and event.value != self.value:
            raise Conflict("same authoritative revision has conflicting state")
        self.events[event.identity] = event
        if event.revision <= self.revision:
            return "stale"
        self.revision, self.value = event.revision, event.value
        return "deleted" if event.value is None else "applied"


@dataclass
class DeltaState:
    """Contiguous per-aggregate revisions, authoritative bootstrap, bounded gaps."""

    revision: int
    quantity: int
    max_pending: int = 2
    max_gap: int = 8
    pending: dict[int, Event] = field(default_factory=dict)
    events: dict[str, Event] = field(default_factory=dict)
    revisions: dict[int, Event] = field(default_factory=dict)

    def _drain(self) -> None:
        while self.revision + 1 in self.pending:
            event = self.pending.pop(self.revision + 1)
            assert event.value is not None
            self.quantity += event.value
            self.revision = event.revision

    def apply(self, event: Event) -> str:
        if event.revision <= 0 or event.value is None:
            raise ValueError("delta requires a positive revision and a value")
        previous = self.events.get(event.identity)
        if previous is not None:
            if previous != event:
                raise Conflict("event identity reused with changed intent")
            return "duplicate"
        previous_revision = self.revisions.get(event.revision)
        if previous_revision is not None and previous_revision.value != event.value:
            raise Conflict("same authoritative revision has conflicting delta")
        if event.revision <= self.revision:
            # A baseline covers the effect, but does not permit reusing its event ID.
            self.events[event.identity] = event
            self.revisions[event.revision] = event
            return "covered-by-baseline-or-progress"
        if event.revision > self.revision + self.max_gap:
            raise GapLimit("gap exceeds replay budget; reconcile from authority")
        if event.revision > self.revision + 1 and event.revision not in self.pending:
            if len(self.pending) >= self.max_pending:
                raise GapLimit("buffer full; keep incoming message recoverable")
        self.events[event.identity] = event
        self.revisions[event.revision] = event
        self.pending[event.revision] = event
        self._drain()
        return "applied" if event.revision <= self.revision else "buffered"

    def reconcile(self, revision: int, quantity: int) -> None:
        """Caller supplies a verified complete snapshot from the revision authority."""
        if revision < self.revision:
            raise Conflict("reconciliation snapshot is older than current progress")
        self.revision, self.quantity = revision, quantity
        self.pending = {r: e for r, e in self.pending.items() if r > revision}
        self._drain()


def checkpoint(delivered: list[int], completed: set[int], next_offset: int) -> int:
    """Traditional partition position: next actual unresolved record, not max(done)."""
    if delivered != sorted(set(delivered)):
        raise ValueError("delivered positions must be strictly increasing")
    if delivered and next_offset <= delivered[-1]:
        raise ValueError("next offset must follow the delivered batch")
    if not completed.issubset(delivered):
        raise ValueError("completion must identify a delivered record")
    return next((offset for offset in delivered if offset not in completed), next_offset)


def verify_semantics() -> list[dict]:
    observations = []
    state = CompleteState()
    assert state.apply(Event("state-3", 3, 30)) == "applied"
    assert state.apply(Event("state-2", 2, 20)) == "stale"
    assert state.apply(Event("state-3", 3, 30)) == "duplicate"
    assert (state.revision, state.value) == (3, 30)
    observations.append({"name": "reordered-complete-state", "status": "passed", "revision": 3, "value": 30})

    assert state.apply(Event("delete-4", 4, None)) == "deleted"
    assert state.apply(Event("republished-state-3", 3, 30)) == "stale"
    assert (state.revision, state.value) == (4, None)
    observations.append({"name": "tombstone-rejects-stale-resurrection", "status": "passed", "revision": 4, "deleted": True})

    delta = DeltaState(revision=1, quantity=10)
    assert delta.apply(Event("delta-3", 3, 5)) == "buffered"
    assert (delta.revision, delta.quantity) == (1, 10)
    assert delta.apply(Event("delta-2", 2, -3)) == "applied"
    assert delta.apply(Event("delta-3", 3, 5)) == "duplicate"
    assert (delta.revision, delta.quantity, delta.pending) == (3, 12, {})
    observations.append({"name": "delta-gap-buffer-and-duplicate", "status": "passed", "revision": 3, "quantity": 12})

    bounded = DeltaState(revision=1, quantity=10)
    bounded.apply(Event("gap-3", 3, 5))
    bounded.apply(Event("gap-4", 4, 2))
    try:
        bounded.apply(Event("gap-5", 5, 7))
        raise AssertionError("full buffer accepted another message")
    except GapLimit:
        pass
    assert (bounded.revision, bounded.quantity, sorted(bounded.pending)) == (1, 10, [3, 4])
    assert "gap-5" not in bounded.events
    bounded.reconcile(2, 7)
    assert (bounded.revision, bounded.quantity) == (4, 14)
    assert bounded.apply(Event("gap-5", 5, 7)) == "applied"
    assert (bounded.revision, bounded.quantity) == (5, 21)
    observations.append({"name": "bounded-gap-preserves-retry-and-reconciles", "status": "passed", "rejected_event_retained_by_caller": True, "final_quantity": 21})

    before = (delta.revision, delta.quantity, dict(delta.pending))
    try:
        delta.apply(Event("delta-3", 3, 500))
        raise AssertionError("changed intent reused an event identity")
    except Conflict:
        pass
    assert (delta.revision, delta.quantity, delta.pending) == before
    observations.append({"name": "changed-event-intent-rejected", "status": "passed"})

    bootstrapped = DeltaState(revision=3, quantity=12)
    assert bootstrapped.apply(Event("covered-id", 2, -3)) == "covered-by-baseline-or-progress"
    try:
        bootstrapped.apply(Event("covered-id", 4, 100))
        raise AssertionError("baseline-covered event identity accepted changed intent")
    except Conflict:
        pass
    assert (bootstrapped.revision, bootstrapped.quantity, bootstrapped.pending) == (3, 12, {})
    observations.append({"name": "baseline-covered-identity-retained", "status": "passed", "quantity": 12})

    assert checkpoint([10, 11, 12], {10, 12}, 13) == 11
    assert checkpoint([10, 11, 12], {10, 11, 12}, 13) == 13
    assert checkpoint([10, 12, 15], {10, 15}, 16) == 12
    observations.append({"name": "completed-prefix-with-numerical-offset-gaps", "status": "passed", "blocked_checkpoint": 11, "finished_checkpoint": 13, "sparse_checkpoint": 12})
    return observations
