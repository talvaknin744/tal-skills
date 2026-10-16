# Profile field rename

This is a synthetic existing Protobuf RPC contract, not a new Google API design.
The provider has a deployed update_mask whose paths are Protobuf descriptor
names relative to Profile. Unknown update paths return INVALID_ARGUMENT before
any mutation. It accepts supported clients v1 and v2, both of which use Protobuf
binary resource payloads. No ProtoJSON resource conversion is involved here.

Provider v2 renamed display_name to display_label and retained binary field
number 7. The two descriptors and a retained request are supplied. The new
provider reads the binary resource value successfully, but its validator rejects
the old client's textual mask path. The release owner calls the rename harmless
because the field number did not change. Old clients remain supported for six
months, and their mask paths cannot be regenerated remotely.

Review the release claim and propose an explicit compatibility strategy. State
what should happen to the retained old request, an equivalent new path request
and a genuinely unknown path, including resulting profile values or unchanged
state on rejection. Keep all technical schedules proposed rather than executed.
