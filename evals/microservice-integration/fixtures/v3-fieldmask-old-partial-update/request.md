# Campaign update review

This is a synthetic API review with no running service. Campaigns v2 added a
spending limit after the desktop client v1 was released. That supported client
knows only name, display_name and description. It must still be able to rename
a campaign without changing its description or spending limit. Its owner also
needs an intentional description reset operation. The target resource already
exists, and permission and concurrent update handling are outside this scenario.

The custom provider follows the Protobuf FieldMask update convention documented
in contract.json. The captured rename request omitted the mask. The supplied
before and after resources come from the incident record, not a test executed
for this review. Client v1 remains supported for six months. A proposed fix
rejects every v1 request without a mask immediately, with no adapter or migration.

Review the proposed fix and give a safe rename request and resulting resource
using this actual contract. Also give an intentional reset request and its
result, starting independently from the original before state. Explain the
compatibility and verification needed for supported old and new clients. This
request is for findings and unrun validation, not implementation or execution.
