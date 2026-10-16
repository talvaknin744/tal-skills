# FieldMask update compatibility

Use this reference when an integration changes Protobuf FieldMask update semantics or accepted symbolic mask paths. Establish the provider's documented convention and the request emitted by the supported client before choosing a remedy.

## Selection and preservation

Record separately what omitted and empty masks select, how an unselected field is preserved, and how a selected field's explicit default or omitted value is handled. Field presence and generated serialization can change what reaches the provider. A selected but absent value is not a universal deletion instruction.

The [Protobuf FieldMask reference](https://protobuf.dev/reference/protobuf/google.protobuf/#field-mask) describes omission as covering every field, so an older client can reset a later field it did not supply. It permits a provider to require masks. [AIP 134](https://google.aip.dev/134) instead defines omitted masks for Google resource updates as selecting populated fields, and `*` as full replacement. A full replacement can reset new mutable fields unknown to the caller. Follow the actual service dialect. A requirement to reject every omitted mask would change an AIP 134 contract.

For a partial update, preserve stored values outside the intended selection, including fields added after an older client was released. Contrast that request with an intentional reset and an explicitly requested full replacement. For example, changing `display_name` must preserve an existing `budget` that the old client does not know when the provider promises a partial update. Establish the actual reset representation rather than inferring deletion from an absent JSON member.

## Symbolic path evolution

Mask paths name fields, so keeping a Protobuf field number does not preserve a renamed path. Inspect the actual mask encoding: JSON FieldMask uses lower camel case paths, while proto paths use proto field names. Include projection paths when the existing provider exposes them. Keep supported paths, translate documented legacy paths, or coexist interfaces through migration. Changing deployment order alone does not establish compatibility.

Before retiring a supported symbolic path or alias, collect evidence of requested legacy paths or aliases in the actual mask encoding, linked to the supported clients and versions, over a meaningful observation window. Validate that the detector records a known legacy call. API version usage and compatibility of Protobuf field numbers do not establish whether a symbolic path is still used. Keep offline, rare and unobserved clients unresolved. If capture is only proposed, report current path usage as unverified.

[AIP 161](https://google.aip.dev/161) defines paths relative to the resource and differentiates unsupported write paths from permitted deletion behavior. Its single request `read_mask` field is deprecated for Google APIs, so an existing projection example is not a default design for a new Google read API.

## Evidence for the changed contract

Use supported old and new client requests against the actual provider behavior. When a request is affected, validate its original serialized shape under the affected client and provider versions, and state the expected persisted state or rejection. Compare that request with the intended safe request, deliberate reset and explicit full replacement as separate checks. An absent mask requires evidence for that request shape under the provider's convention, even if an explicit mask was checked.

Observe stored values for a later field, an unselected field, a selected reset, a supported old path and deliberate replacement. Record the versions, mask, serialized payload, resulting state and rejection behavior. Keep an unavailable client or runtime as an unverified boundary. A review or design describes these checks without claiming execution.

The [source note](sources.md#fieldmask-update-contracts) distinguishes current contract references from the historical Netflix examples. No mask library or application runtime was executed for this guidance.
