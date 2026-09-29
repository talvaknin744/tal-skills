# Focused native workflow extension inputs

Five additional cases exercise gaps found in the article/source review. They use
existing workflow IDs with the native runner's `--fixtures` option. The original
eight cases and their scoring records remain separate. These inputs and author
calibrations are not model observations or native execution results.

For a trial, copy only the selected `rawfiles/` tree and `prompt.md` into a fresh
disposable workspace and install that workflow's native dependency closure. Prefix
the prompt with `$<workflow>` for Codex or `/<workflow>` for Claude. Keep this README,
`case-index.json`, and all calibration files outside the candidate workspace.
Candidate authors cannot independently score their own fixtures.

The index contains private evaluation criteria and the exact edit/runtime allowlist.
Protected contracts and verifiers are ordinary user-visible task inputs. A review
probe exits zero when it prints an observation; that is not a release recommendation
or protocol conformance result. Review cases authorize no source edits. Optional
candidate test files are explicitly listed for the two implementation cases.

| Workflow | Candidate task | Local command |
| --- | --- | --- |
| `tal-backend-delivery` | Repair owned TypeScript stream export backpressure, completion and cleanup | `node verify.mjs` |
| `tal-consistency-diagnosis` | Repair Python cache snapshot/live DELETE handoff and serialized restart | `python3 -B verify.py` |
| `tal-worker-rollout` | Review successful ECS deployment with protected old tasks still draining | No command; review supplied evidence |
| `tal-messaging-evolution` | Review regional aggregate-log offset translation and conservative replay | `python3 -B observe.py` |
| `tal-mcp-integration` | Review authorized-tool composition and required-gateway bypass | `python3 -B probe.py` |

Commands run from the copied project root using standard libraries only. Node's
built-in TypeScript stripping is calibrated on Node25.9.0; Python checks use `-B`
to avoid bytecode output. No fixture requires packages, paid services, real private
files, credentials, network, cloud changes, live brokers, or model calls. Review
facts name sources and distinguish application contracts from platform guarantees.

The Node and cache baselines intentionally fail. `calibration-node.json` and the
cache case's `calibration.json` record baseline results and separate temporary
positive controls; corrected control code must not enter candidate input. The
review probes are deterministic observations, not acceptance verifiers. ECS has
no execution claim. Local cache restart is JSON serialization, not crash-atomic
durability; Kafka arithmetic is not a broker experiment; MCP tool calls are fixed
by the probe and do not measure model resistance.

Use the original common acceptance for actual native loading/role selection,
ownership and independent review, scope, and evidence limits. In particular, the
current runner's broad filesystem reads and post-run per-file write audit do not
establish the intended strict isolation. Record `case_compliant` and capability
deviations honestly; a successful local verifier cannot remove that limitation.
Preparing files or reading a workflow alone is not a successful native observation.
