#!/usr/bin/env python3
"""Run local semantic checks; opt into a disposable real broker with --broker."""

import argparse
import hashlib
import json
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

from models import verify_semantics


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--broker", action="store_true", help="also run pinned RabbitMQ/Pika integration; needs Docker")
    parser.add_argument("--report", type=Path, help="write JSON evidence here in addition to stdout")
    args = parser.parse_args()
    if not __debug__:
        parser.error("run without -O: this verifier uses assertions")
    root = Path(__file__).resolve().parent
    report = {
        "schema_version": 1,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "python": platform.python_version(),
        "source_sha256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.glob("*.py"))},
        "semantics": {"status": "not-run"},
        "broker": {"status": "not-requested"},
        "limits": ["Single-threaded semantic models do not establish database atomicity, broker failover, or multi-consumer correctness."],
    }
    code = 0
    try:
        report["semantics"] = {"status": "passed", "cases": verify_semantics()}
        if args.broker:
            from rabbitmq import verify_broker

            report["broker"] = verify_broker()
            if report["broker"]["status"] != "passed":
                code = 1
    except Exception as error:
        report["failure"] = {"type": type(error).__name__, "message": str(error)}
        code = 1
    report["status"] = "passed" if code == 0 else "failed"
    report["finished_at"] = datetime.now(timezone.utc).isoformat()
    encoded = json.dumps(report, indent=2) + "\n"
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(encoded)
    sys.stdout.write(encoded)
    return code


if __name__ == "__main__":
    raise SystemExit(main())
