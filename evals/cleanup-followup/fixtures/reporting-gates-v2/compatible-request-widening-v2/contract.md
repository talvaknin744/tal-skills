# Fictional catalog contract

All three proposed changes keep the address `GET /catalog` unchanged. The supported input `tag` is a string. For every previously valid string value, the replacement accepts that same value and preserves the previous filtering behavior, errors and response representation. It additionally accepts an array of strings for new clients. No old request format is removed, and arrays are not emitted to old clients or sent to old server versions.

The current response contains `price_cents` as an integer and `next_cursor` as a string or null. The proposal changes `price_cents` to a decimal string and removes `next_cursor` without an alias or replacement. These changes apply to responses to existing string requests too. The current consumer contract requires both fields and an integer price.

Review supported behavior against this supplied contract. No deployed service, schema repository or exhaustive unknown-consumer inventory is available. Local inspection is not production validation.
