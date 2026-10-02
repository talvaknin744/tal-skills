"""Protected finite formatting checks; no service or concurrency semantics."""
if not __debug__:
    raise RuntimeError("Run checks without Python optimization")

import json
from labels import format_label


if __name__ == "__main__":
    examples = [("Ada", 7, "Ada (v7)"), ("", 0, " (v0)"),
                ("Málaga", 12, "Málaga (v12)")]
    failures = []
    for name, revision, expected in examples:
        actual = format_label(name, revision)
        if actual != expected:
            failures.append({"name": name, "revision": revision,
                             "actual": actual, "required_format": expected})
    print(json.dumps({"checks": len(examples), "passed": len(examples) - len(failures),
                      "failures": failures}, sort_keys=True))
    raise SystemExit(bool(failures))
