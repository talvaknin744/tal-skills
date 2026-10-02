# Runtime validation

Define accepted values at the untrusted boundary before constructing an internal command. Decoding into a Go struct proves neither required-field presence nor semantic validity: absent fields can become zero values, and null handling can also erase a distinction the contract needs.

Choose a boundary representation that retains required-field presence and rejects disallowed null values. Apply unknown-field rejection when the API defines a closed command shape, and verify that one JSON value exhausts the input. Bound the body before parsing when requests can be large. Keep trusted tenant or authorization scope separate from client-supplied fields.

## Numeric semantics across implementations

Match the contract's numeric meaning rather than Go's convenient target type. For a contract accepting any finite integral JSON number, `1`, `1.0`, and `1e0` mean the same value. Direct decoding into `int` rejects the latter spellings; decoding everything through `float64` can lose integer precision.

Retain numeric tokens where needed, for example with `json.Number` and `Decoder.UseNumber`, then explicitly check the required numeric form, integrality, and bounds before conversion. Reject booleans and numeric strings where the contract requires a JSON number. Validate native-call inputs as well if they bypass JSON. A type assertion, cast, or successful decode is not the validator.

For the inventory teaching contract, `sku` and `quantity` are the only command fields; both are required. Keys and SKUs contain 1–128 visible ASCII characters, and quantity is an integral numeric value from 1 through 1,000,000. These are example-specific limits, not defaults to impose on another service. Compare validated semantic fields on replay instead of inventing a cross-language JSON hash.

## Boundary evidence

Exercise missing fields, null, unknown fields when prohibited, booleans, fractions, numeric strings, numeric bounds, and trailing input. Include valid equivalent numeric spellings when the contract accepts them. For persisted operations, show rejected input produces no mutation. Keep validation failures distinguishable from database failures and native cancellation.
