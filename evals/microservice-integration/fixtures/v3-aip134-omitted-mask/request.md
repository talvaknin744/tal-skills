# Books resource API review

This synthetic Books v2 API explicitly follows Google's AIP 134 update contract.
Its update mask is optional. If the mask is omitted, mutable fields populated
with nonempty values are selected. Name identifies the resource and is not
updated. The standard wildcard value selects all mutable fields for replacement.
There are no extra output only fields, repeated fields, missing resources,
permissions or concurrent writes in this scenario.

The supported client v1 knows title and author but does not know the later rating
field. Its captured request sends title New and author as an empty string without
a mask. An incident reviewer says this must reset author and rating because the
general Protobuf reference describes an omitted mask as all fields. They propose
rejecting all omitted masks before this request reaches the update implementation.

Determine the resource after each request in requests.json, each starting from
the same original before state. Assess that proposal against this provider's
contract, including intentional clearing and wildcard replacement. Recommend
verification for the actual client serialization and stored values. These are
unrun schedules to review, not authorization to invoke a service.
