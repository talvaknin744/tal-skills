Actual inspection commands, all exit status 0:

1. `cat <trial-root>/handoff-ack-loss/skill/SKILL.md` — read the graceful-draining review workflow.
2. `cat <trial-root>/handoff-ack-loss/prompt.txt` — request is a read-only review of replay/ownership traces and the progress-read/ACK-retry patch.
3. `rg --files <trial-root>/handoff-ack-loss/project` — found only `observations.md` and `worker.pseudo`.
4. `cat <trial-root>/handoff-ack-loss/project/observations.md` — read queue ambiguity, SQL fencing contract, stable offsets, completed replay, and stale-owner corruption traces.
5. `cat <trial-root>/handoff-ack-loss/project/worker.pseudo` — confirmed unconditional row/progress/finalization writes, cursor-only read, three ACK retries, and heartbeat logging.
6. `cat <trial-root>/handoff-ack-loss/skill/references/durable-handoff.md` — read atomic checkpoints, terminal-before-ACK, fencing, and recovery-budget guidance.
7. `cat <trial-root>/handoff-ack-loss/skill/references/platform-shutdown.md` — read queue/runtime verification guidance; no particular runtime is established by the project files.
8. `nl -ba <trial-root>/handoff-ack-loss/project/observations.md` — obtained evidence line locations.
9. `nl -ba <trial-root>/handoff-ack-loss/project/worker.pseudo` — obtained code line locations.
10. `shasum -a 256 <trial-root>/handoff-ack-loss/project/observations.md <trial-root>/handoff-ack-loss/project/worker.pseudo` — returned these hashes; emitted a harmless unsupported-locale warning and fell back to locale C:

```text
7d67d40bc1ef40ddd33447fb340c3c6d5dad2b57c9faa9c4046ca06720010566  observations.md
a95272d5d007e2ddc3a8a578d10f6efa7f593d6c1646a64ac6ef494d1283d11e  worker.pseudo
```

11. `LC_ALL=C shasum -a 256 <trial-root>/handoff-ack-loss/project/observations.md <trial-root>/handoff-ack-loss/project/worker.pseudo` — repeated after writing the artifacts; exit 0, no warning, both hashes identical to the values above.

Used `apply_patch` only to create the requested `answer.md` and `tools.md`, and to record the final hash verification in `tools.md`, outside the project. No project files were modified. No tests, simulations, installs, web requests, subagents, or live-service operations were run. All failure schedules in the answer are proposed verification, not observed execution results.
