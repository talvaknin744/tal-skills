# Actual tools and results

All shell commands ran in `<trial-root>/cache-fill-invalidation/project` through `functions.exec` and `exec_command`.

- `cat` read the trial's `skill/SKILL.md`, its `references/cache-coherence.md` and `references/sources.md`, and the project's `service.mjs`, `requirements.md`, `model.mjs`, and `verify.mjs`.
- `rg --files -g '!node_modules' -g '!package-lock.json' .` listed the four supplied project files.
- First `node verify.mjs`: exit 1; 2/5 checks passed. Delayed-fill, eviction, and older-notification checks failed with stale revision 1.
- `shasum -a 256 model.mjs verify.mjs requirements.md` ran before and after the service edit. Both runs returned identical hashes for all three files. Both exited 0 with a locale fallback warning.
- `apply_patch` changed only the two cache operations and added explanatory comments in `service.mjs`: `set` became `publishIfFresh`; `delete` became `advanceFloor(id, record.revision)`.
- Second `node verify.mjs`: exit 0; 5/5 checks passed.
- `apply_patch` wrote the requested `answer.md` and `tools.md` reports.
- `cat service.mjs answer.md tools.md` confirmed the saved service and report contents (exit 0).

No packages were installed, no web or live services were accessed, and no subagents were used.
