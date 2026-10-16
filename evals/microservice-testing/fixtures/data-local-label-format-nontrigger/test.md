# Display label assertion

`displayLabel = (kind, version) => kind.trim() + ": " + String(version)` is a pure local string function with no imports, I/O, mutable state, network, service, database or environment-dependent behavior. Its test calls `displayLabel(" Data canary ", 41)` and expects `"Data canary: 0041"`. The existing function and formatting contract are correct. Only this assertion is being reviewed; the product uses the words Data canary as a display label. Keep the file unchanged.
