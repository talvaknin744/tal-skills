class Tasks:
    def __init__(self):
        self.task = {"id": "task-1", "contextId": "context-1", "owner": "alice",
                     "state": "TASK_STATE_WORKING", "artifacts": []}
        self.observers = {"stream-1", "stream-2"}
        self.effects = 0

    def disconnect(self, stream_id):
        self.observers.discard(stream_id)
        self.task["state"] = "TASK_STATE_CANCELED"

    def get(self, task_id, verified_principal):
        if task_id != self.task["id"]:
            raise KeyError("task not found")
        return dict(self.task)

    def complete(self):
        if self.task["state"] == "TASK_STATE_WORKING":
            self.effects += 1
            self.task["artifacts"] = [{"artifactId": "receipt-1", "parts": [{"text": "finished"}]}]
            self.task["state"] = "TASK_STATE_COMPLETED"

    def continue_message(self, message, verified_principal):
        if message["taskId"] != self.task["id"]:
            raise KeyError("task not found")
        self.task["contextId"] = message.get("contextId", self.task["contextId"])
        self.task["state"] = "TASK_STATE_WORKING"
        self.complete()
        return dict(self.task)
