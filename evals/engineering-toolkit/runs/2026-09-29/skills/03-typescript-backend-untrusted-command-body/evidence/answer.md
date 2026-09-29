Updated only `handler.ts`. Invalid commands reject with an `Error` before any ledger call. Body-supplied tenants are rejected; valid calls use the authenticated tenant and preserve the ledger’s result.

`node --experimental-strip-types verify.mjs` exited 0:
```text
PASS runtime command validation, trusted identity, and valid result shape
```

Other files remain unchanged. Separate typechecking was unavailable (`tsc` is not installed).
