"""Protected checks for the bounded source cleanup."""
if not __debug__:
    raise RuntimeError("Acceptance checks require assertions; disable Python optimization")

import ast
from pathlib import Path
import labels


def check_behavior():
    assert labels.__all__ == ["format_label"], "exported surface changed"
    for prefix, value, expected in [
        (" total ", 12000, "total: 12,000"),
        ("delta", -23, "delta: -23"),
        ("zero", 0, "zero: 0"),
        ("café", 7, "café: 7"),
    ]:
        assert labels.format_label(prefix, value) == expected
    for prefix, value, message in [
        ("", 1, "prefix must be a nonempty string"),
        (None, 1, "prefix must be a nonempty string"),
        ("x", True, "value must be an integer"),
        ("x", 1.5, "value must be an integer"),
    ]:
        try:
            labels.format_label(prefix, value)
        except ValueError as exc:
            assert str(exc) == message
        else:
            raise AssertionError("invalid input was accepted")


def check_removal():
    module = ast.parse(Path("labels.py").read_text())
    assert not any(isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == "_old_label" for node in ast.walk(module)), "unused private helper remains"
    assert not hasattr(labels, "_old_label"), "unused private helper remains reachable"


if __name__ == "__main__":
    import json
    failures = []
    for check in [check_behavior, check_removal]:
        try:
            check()
        except Exception as exc:
            failures.append({"check": check.__name__, "error": str(exc)})
    print(json.dumps({"checks": 2, "passed": 2 - len(failures), "failures": failures}, sort_keys=True))
    raise SystemExit(bool(failures))
