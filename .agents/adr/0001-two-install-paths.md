# Two install paths

The project serves both plugin installation and direct skill installation. Keep the plugin's canonical, broadly useful skills under the root `skills/` bucket and preserve each direct-install package as a self-contained unit; this keeps plugin discovery useful without breaking standalone installation.

## Consequences

Bucket placement is part of the plugin documentation and UI surface. Cross-skill reuse must invoke a sibling skill as a tool rather than depend on links that may break when packages are installed separately.
