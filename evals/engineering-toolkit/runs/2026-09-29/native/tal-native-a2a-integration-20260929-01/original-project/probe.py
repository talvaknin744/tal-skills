import json
from pathlib import Path

from adapter import Tasks


requests = json.loads(Path(__file__).with_name("requests.json").read_text())
observations = {}
tasks = Tasks()
tasks.disconnect("stream-1")
tasks.complete()
observations["one_observer_left"] = {"task": tasks.get("task-1", "alice"), "remaining_observers": sorted(tasks.observers), "effects": tasks.effects}
observations["foreign_get"] = tasks.get("task-1", "bob")
tasks = Tasks()
tasks.complete()
tasks.continue_message(requests["continuation"]["params"]["message"], "alice")
observations["terminal_continuation"] = {"task": tasks.get("task-1", "alice"), "effects": tasks.effects}
tasks = Tasks()
tasks.continue_message(requests["different_context"]["params"]["message"], "alice")
observations["different_context"] = {"task": tasks.get("task-1", "alice"), "effects": tasks.effects}
print(json.dumps({"evidence_kind": "local adapter observations, not SDK conformance", "observations": observations}, indent=2))
