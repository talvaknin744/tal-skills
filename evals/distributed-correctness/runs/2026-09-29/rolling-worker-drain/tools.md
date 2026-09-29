Actual local commands and results (all project commands ran in `<trial-root>/rolling-worker-drain/project`):

- `cat <trial-root>/rolling-worker-drain/skill/SKILL.md` — exit 0; read the graceful-draining review/design workflow.
- `rg --files -g '!node_modules' -g '!vendor' .` — exit 0; project contains `incident.md` and `worker.pseudo`.
- `cat incident.md worker.pseudo` — exit 0; read incident, custom queue contract, supervisor behavior, and worker pseudocode.
- `cat <trial-root>/rolling-worker-drain/skill/references/durable-handoff.md <trial-root>/rolling-worker-drain/skill/references/platform-shutdown.md <trial-root>/rolling-worker-drain/skill/references/sources.md` — exit 0; read the supplied handoff, platform, and source-scope references. Did not follow external links.
- `nl -ba incident.md` and `nl -ba worker.pseudo` — each exit 0; established source line references.
- `shasum -a 256 incident.md worker.pseudo` — exit 0; hashes below. Perl emitted a locale warning and fell back to the standard locale.

```
8d761d11d1f90a40136a56b5858daa1a41b08ed6064aa5b4af7224ac2f29cc8b  incident.md
479ac51834614363eba6c4f415048dd274bba9c5bc0bb6981d86b8ae0e7ff528  worker.pseudo
```

Used `apply_patch` only to create the requested `answer.md` and `tools.md` outside the project directory. No project files were edited. No tests, simulations, live-service calls, deployments, redrives, installs, web access, or subagents were used. Verification scenarios in the answer are proposed observations, not executed results.

Repeated `shasum -a 256 incident.md worker.pseudo` after writing the outputs — exit 0, same benign locale warning, both hashes unchanged.
