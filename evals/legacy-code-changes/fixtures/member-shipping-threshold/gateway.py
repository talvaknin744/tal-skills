import json
from pathlib import Path
from urllib.request import Request, urlopen


class CarrierAudit:
    def __init__(self):
        self.config = json.loads(
            Path("/etc/fulfillment/carrier-audit.json").read_text()
        )

    def record(self, line):
        request = Request(
            self.config["endpoint"],
            data=line.encode("utf-8"),
            headers={"Authorization": self.config["authorization"]},
            method="POST",
        )
        with urlopen(request, timeout=5) as response:
            response.read()
