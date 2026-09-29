import json
from pathlib import Path

from consumer import ConflictingEvent, Consumer


def same(actual, expected):
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True), (actual, expected)


def main():
    consumer = Consumer()
    events = json.loads(Path(__file__).with_name("events.json").read_text())
    outcomes = [consumer.apply(event) for event in events]
    same(outcomes, ["applied", "duplicate", "stale", "applied", "duplicate", "applied"])
    expected = {"accounts": {"a": {"revision": 13, "balance": 130}, "b": {"revision": 1, "balance": 7}},
                "effects": [["a", 12, 120], ["b", 1, 7], ["a", 13, 130]]}
    same(consumer.snapshot(), expected)
    for event in [{"message_id": "m12", "account_id": "a", "revision": 12, "balance": 999},
                  {"message_id": "m13", "account_id": "a", "revision": 13, "balance": 999},
                  {"message_id": "collision", "account_id": "a", "revision": 13, "balance": 999}]:
        try:
            consumer.apply(event)
        except ConflictingEvent:
            pass
        else:
            raise AssertionError("conflicting event accepted")
        same(consumer.snapshot(), expected)
    for event in [None, {}, {"message_id": "bad", "account_id": "a", "revision": True, "balance": 2},
                  {"message_id": "bad", "account_id": "a", "revision": 14, "balance": "2"}]:
        try:
            consumer.apply(event)
        except ValueError:
            pass
        else:
            raise AssertionError("malformed event accepted")
        same(consumer.snapshot(), expected)
    print(json.dumps({"status": "pass", "outcomes": outcomes, "state": consumer.snapshot()}))


if __name__ == "__main__":
    main()
