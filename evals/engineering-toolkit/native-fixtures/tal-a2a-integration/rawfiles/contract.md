# Task adapter contract

A2A specification 1.0.1 is pinned with wire version `1.0`; the intended Python SDK
is 1.1.5. The local code receives already-decoded application calls and models one
active task. It is not the SDK handler or a complete protocol validator.

Task `task-1`, context `context-1`, belongs to verified principal `alice`. Its
observers `stream-1` and `stream-2` are independently connected. Observers watch
work; leaving a stream is not an application request to cancel the task. Work may
produce an artifact after one observer leaves. A reconnecting caller can query
the authoritative task state; complete event replay is not promised.

Every get, continuation, cancel, and subscribe operation is scoped to the verified
task owner. Task IDs and client-supplied context IDs are not credentials. A message
that names an existing task and explicit context must agree with that task's
context. Task state `TASK_STATE_COMPLETED` is terminal; continuing that task must
not restart work. An explicitly new initial message can create distinct work.

The application requires one business effect per accepted operation. Protocol
message IDs alone do not promise business-effect deduplication. The fixture stores
tasks, observers, and effects in memory; process restart and multi-replica execution
recovery are not implemented or promised by this storage choice.

`python3 -B probe.py` reports local adapter observations only. Protocol wire examples
are in `requests.json`; no SDK compatibility or authentication test is implied.
