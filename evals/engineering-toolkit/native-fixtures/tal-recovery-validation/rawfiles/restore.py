"""Copy and parse only; application acceptance is a separate caller responsibility."""

import argparse
import json
import shutil
from pathlib import Path


parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("target", type=Path)
args = parser.parse_args()
source = args.source.resolve()
target = args.target.resolve()
if target.exists():
    raise SystemExit("target must be new")
target.mkdir(parents=True)
destination = target / "ledger.json"
shutil.copyfile(source, destination)
ledger = json.loads(destination.read_text())
print(json.dumps({"imported_orders": len(ledger["orders"]), "destination": str(destination)}))
