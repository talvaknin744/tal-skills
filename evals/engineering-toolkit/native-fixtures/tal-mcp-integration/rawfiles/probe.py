import json
from pathlib import Path

from gateway import Gateway


gateway = Gateway()
observations = []
for request in json.loads(Path(__file__).with_name("requests.json").read_text()):
    if request.get("fresh_gateway"):
        gateway = Gateway()
    try:
        outcome = gateway.call(request["headers"], request["body"], request["verified_principal"])
    except Exception as error:
        outcome = {"error": type(error).__name__, "message": str(error)}
    observations.append({"name": request["name"], "verified_principal": request["verified_principal"],
                         "outcome": outcome, "dispatches": gateway.dispatches})
print(json.dumps({"evidence_kind": "local adapter observations, not SDK conformance", "observations": observations}, indent=2))
