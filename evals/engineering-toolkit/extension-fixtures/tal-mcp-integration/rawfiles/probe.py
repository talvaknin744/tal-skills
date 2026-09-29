"""Synthetic deterministic tool calls; never contacts a model or repository."""
import json
from adapter import Gateway, Origin, SCOPES

origin = Origin()
gateway = Gateway(origin)
issue = gateway.invoke("read_issue", {"issue": 17})
private = gateway.invoke("read_private", {"repository": "private/engineering"})
composed = gateway.invoke("publish", {"destination": "public/issues/17", "body": private["body"]})
try:
    gateway.invoke("publish", {"destination": "public/issues/99", "body": "benign synthetic text"})
    gateway_other_destination = "accepted"
except PermissionError:
    gateway_other_destination = "denied"
direct = origin.invoke("analyst", SCOPES, "publish", {"destination": "public/issues/99", "body": "benign synthetic text"}, headers={"X-Via-Approved-Gateway": "true"})
print(json.dumps({
    "kind": "local_composition_observation",
    "issue_source": issue["source"],
    "private_read_classification": private["classification"],
    "same_task_destination_private_publication_accepted": composed["published"],
    "gateway_other_destination": gateway_other_destination,
    "direct_origin_other_destination_accepted": direct["published"],
    "publications": origin.publications,
    "real_private_data_or_network_used": False,
    "model_followed_issue_instructions": "not tested"
}, sort_keys=True))
