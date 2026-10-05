# Temporal audit: implementation contract

Prepared 2026-09-29, before implementation authorization. This maps the 20 findings in [the audit](audit-temporal-productivity.json) to a bounded maintenance change. It does not refresh the vendored libraries wholesale or claim live Temporal/AWS validation.

## Observed behavior and tests

Research scratch: `/tmp/tal-temporal-audit-20260929`. The harness strips only the final `main "$@"` line from a temporary copy of `provision.sh`, loads its real functions, and replaces provider/package commands with shell functions. Child environments contain an explicit minimal PATH, a synthetic API key, and a scratch `TEMPORAL_CONFIG_FILE`; no real credential values or config files are read. Only scratch files are created. `observations.json` and `safe-probe.json` contain the outcomes.

| Check | Observed result |
| --- | --- |
| Execute the published ops environment probe | Synthetic key value printed |
| Execute the published setup environment probe | Synthetic key value printed |
| Real `cmd_preview preflight` | Does not interpolate the key; emits the unsafe literal command |
| Real `cmd_preflight` | Reports the variable name, never the synthetic value |
| Present legacy CLI with only `cloud --help` and base `--version` supported | `install-cli` invokes the prerelease Homebrew upgrade and reports `status=ok`, `version=temporal version 1.9.1` |
| Darwin preview with Homebrew absent | Promises a Homebrew upgrade |
| Same Darwin environment, actual installation function | Skips the upgrade with `reason=brew-missing` |
| Proposed Bash name-only probe, `compgen -e` filtered by prefix | Lists names without the synthetic value |

The preview itself is **not** a demonstrated credential disclosure. Its published command becomes a disclosure when executed or copied. Preserve this distinction in the change description.

Existing tests run: `node --test tests/temporal/provision.test.mjs tests/temporal/sources.test.mjs` — **11 passed**. Seven cover dependency failure/success and repair; four cover the source ledger and provenance. There are currently **no checked-in gate-parity, preflight-secret, or CLI-installation tests**, despite the entrypoint's reference to a drift guard. Existing passing tests therefore do not resolve these findings.

## Contracts to preserve

- `provision.sh` targets macOS Bash 3.2/BSD tools as well as other Bash hosts. Avoid associative arrays, Bash-4-only substitutions, GNU-only flags, and a new mandatory runtime.
- Keep command names and argument forms, including `start-namespace`, `scaffold`, `await-namespace`, and the older `provision-and-scaffold` fallback. Do not replace the fallback's synchronous create with async without separately testing its join/recovery semantics.
- Keep the final `main "$@"` line: `tests/temporal/provision.test.mjs:10` explicitly strips it to load functions safely.
- Preserve one operation result between exact `=== RESULT ===` and `=== END ===` markers on stdout. Keep `status`, `error_code`, and `message` failure shape and existing success keys. Human progress remains on stderr.
- Preserve `=== GATE ===` / `=== END GATE ===` preview markers, `cmd_N` fields, and `announce_gate` extraction. Preview may inspect local help/capabilities, but must not install software, authenticate, create resources, or disclose values.
- Preserve `TCLOUD_DISCLOSE=0` and the distinction between pre-action disclosure and the script's after-call tool record. Neither implies authorization; reuse the authorized target/scope and collect only missing readiness.
- Keep secret capture inside the script, the named `cloud-setup` profile, file mode `0600`, unrelated profile preservation, redacted errors, and cleanup of temporary capture files. Do not print the TOML during verification.
- Preserve explicit invocation in Cloud Setup/Ops/Serverless frontmatter and Codex metadata, public package names, and all retained MIT licenses.

## CLI capability maintenance

The tagged Cloud extension source was inspected at [v0.1.1 / `9575d18f0a4588b51382886655a30742c094baac`](https://github.com/temporalio/cloud-cli/tree/9575d18f0a4588b51382886655a30742c094baac), cloned only into scratch. [Current installation](https://github.com/temporalio/cloud-cli/blob/9575d18f0a4588b51382886655a30742c094baac/README.md) uses `temporalio/brew/temporal-cloud`; [current documentation](https://docs.temporal.io/cli/cloud) labels the extension Public Preview. This is distinct from the core `temporal` CLI.

[Extension command initialization](https://github.com/temporalio/cloud-cli/blob/9575d18f0a4588b51382886655a30742c094baac/temporalcloudcli/commands.go#L519) sets a real version, and recognizes `--version`. The script's current `cli_version()` calls `temporal --version`, which identifies the base CLI. Record both separately, using extension `temporal cloud --version` or direct `temporal-cloud --version` as supported by the installed command; do not invent a `cloud version` subcommand. A development build's unknown version need not force an upgrade if required capabilities are demonstrably present.

Minimum safe logic for `TP-SETUP-02`:

1. Separate **present** (`cloud --help` works) from **usable for this setup**. Inspect exact subcommand help and required flags without credentials/provider calls. At minimum cover `namespace create` (`--name`, `--region`, `--api-key-auth-enabled`, `--retention-days`, `--async`), `namespace list` (`--name`, structured output), `apikey create-for-me` (`--display-name`, `--expiry-duration`), inherited `--auto-confirm`, and the relevant base-CLI commands. A root help page alone is not proof of a subcommand.
2. A compatible existing CLI should return success without a package mutation. Preserve `version` as base-version metadata and add an explicit extension-version field rather than silently changing its meaning. If using `update=skipped, reason=compatible`, document that additive reason everywhere the result contract is described.
3. For an absent or incompatible extension, choose the supported installation/update path within the user's setup authorization, then recheck capabilities. If it remains incompatible, return a structured error; do not report success merely because the top-level group exists.
4. Preview and execution must share the same decision logic: compatible/no-op, install, required update, or manual path. A missing Homebrew executable cannot produce a promised Homebrew action.
5. Update the help text, entrypoint, extracted gates, `references/unified-cli.md`, and `references/failure-handling.md` together. Add any new error code to the failure map and step table.

Source inspection confirms the current generated flags still include the script's namespace-create and API-key-create options; it does **not** prove live account eligibility or every response parser. `unified-cli.md` mixes legacy claims with the present script: it still calls `--async` unusable, while the current main flow uses `start-namespace --async`. Label historical observations explicitly or replace them with the current supported flow. Do not carry that contradiction into extracted references. The old [Homebrew tap migration](https://raw.githubusercontent.com/temporalio/homebrew-prerelease/main/tap_migrations.json) means old-tap installation is not necessarily broken.

## Observability applicability check

`TP-OBS-01` is not solely a stale-documentation issue: the [current service-health page](https://docs.temporal.io/cloud/service-health) repeats universal-looking ratio thresholds, while [current SDK error handling](https://docs.temporal.io/develop/python/best-practices/error-handling) explicitly demonstrates legitimate business failures. Our correction is a reasoned applicability limit. Update `service-health-monitoring.md:93–96`, `ops-diagnostics-reference.md:54,148–159`, and `diagnosis-examples.md:139,157,171` together with the entrypoint. Do not make a ratio target the acceptance test for correctness. Match metric semantics (attempt failures versus terminal failures), labels, denominator, time window, and business outcomes first. An endless-retry fixture should explicitly supply SDK attempt-failure telemetry plus pending age; a permanent business rejection is a counterexample to treating every failed Workflow as defective error handling.

## Entry-point extraction

Prefer a maintenance extraction, followed by targeted wording fixes, over rewriting execution semantics. Current sections provide clear boundaries:

| Existing content | Proposed package-local destination | Activation |
| --- | --- | --- |
| Gate slots, SDK command matrix, templates and worked example, lines 199–498 | `references/gate-templates.md` | Before rendering the selected command's disclosure; read only its template and needed SDK row |
| Detailed output rules, lines 26–68 and 138–198; roadmap/envelope/checkpoint templates, lines 499–561 | `references/output-format.md` | When starting the setup or rendering a phase/checkpoint |
| Phase-specific procedures, lines 562–797 | `references/phases.md`, with stable anchors for phases 1–4 and ending | On entry to the selected phase; skip phases beyond the authorized stopping point |

Keep activation, authorization/portability, the step table, secret handling, RESULT grammar, terminal criteria, and conditional reference pointers in `SKILL.md`. Retain a short disclosure-before-action rule there so the main contract remains visible. Replace every `§Gate templates`, “above/below,” and bare section pointer with a working package-local Markdown link/anchor. If retaining `<steps>` markers, keep the whole table inside them. These markers are instructional; the shell script does not parse SKILL.md.

The current gate promises are stronger than existing checks: `preflight`'s entrypoint gate includes a writable-config probe that its script preview omits. Decide explicitly whether to maintain byte-identical templates or only semantic parity. For minimal maintenance, align the changed templates and add real parity checks before retaining a claim that every gate is byte-identical. Do not replace required disclosure with an unconditional new approval step.

## File ownership for implementation

One writer should own all paths below so overlapping corrections and provenance remain coherent. Other agents can review read-only.

| Findings | Primary files under `skills/temporal/` |
| --- | --- |
| `TP-CLOUD-01/02` | `temporal-cloud/SKILL.md`; `temporal-cloud/references/common-scenarios.md` |
| `TP-SETUP-01/02/03` | `temporal-cloud-setup/SKILL.md`; `scripts/provision.sh`; `references/unified-cli.md`; `references/failure-handling.md`; the three proposed extracted references |
| `TP-DEV-01/02` | `temporal-developer/references/core/job-queue.md`; `references/core/standalone-activities.md` |
| `TP-OBS-01/02` | `temporal-observability/SKILL.md`; `references/service-health-monitoring.md`; `references/ops-diagnostics-reference.md`; `references/diagnosis-examples.md` |
| `TP-OPS-01/02/03/04` | `temporal-ops/SKILL.md`; `references/triage/authentication.md`; `references/triage/workflow-stuck.md` |
| `TP-SERVERLESS-01/02/03/04` | `temporal-serverless/SKILL.md`; `references/concepts.md`; `references/aws-lambda/diagnostics.md`; `references/aws-lambda/iam.md` |
| `TP-TUNING-01/02` | `temporal-workertuning/SKILL.md`; `references/core/configuration-defaults.md` |
| `TP-OPS-05`, shared routing | Four affected entrypoints: Ops, Observability, Worker Tuning, Serverless; reference list below |

Bare backtick sibling aliases also occur in: Observability `references/diagnosis-examples.md`; Ops `references/triage/{sdk-snippet-review,ha-failover,recipes,blob-size-limits,certificates,performance-bottlenecks,schedule-missed}.md`; Serverless `references/aws-lambda/setup.md`. Normalize those prose identifiers only. **Do not globally rename `skill-temporal-*` inside valid upstream repository URLs.** `skill-temporal-deploy` has no matching public package: route the relevant rollout to `temporal-safe-deployments`, after checking the sentence's intent.

The same writer should own `tests/temporal/provision.test.mjs` (or a dedicated adjacent CLI/gate test file), the seven affected packages' `UPSTREAM.md`, `integrations/temporal/upstream-lock.json`, and `integrations/temporal/README.md`. Keep upstream commit hashes unchanged for local adaptations. Append accurate `modifications` and every touched/new package-relative file to each lock entry's `modified_files`; replace the Cloud package's “operational reference content is unchanged” statement. Add a concise correction summary and Public Preview runtime wording to the integration README. Root owns the top-level catalog/README and broader validation scripts; coordinate any corresponding summary changes instead of editing those concurrently.

## Required targeted checks

- Retain the seven existing provisioning tests and four source tests. They already exercise recovery after partial dependency installation and protect attribution.
- Use a synthetic value to test both emitted streams for preflight, verify-config/redaction, changed previews, and auto-disclosure. Execute only the safe name-only probe; inspect raw key-creation gates as text, never execute them.
- Stub compatible, missing, incompatible, unknown-version-but-capable, failed-install, missing-Homebrew, and non-macOS branches. Assert exact package-call traces, revalidation after installation, structured errors, and truthful preview/execution decisions. No provider/network/package installation is needed.
- Verify extracted reference links and anchors; `check-skills.mjs` checks local file existence and package containment but currently skips anchors. Add a narrow extracted-anchor check or manually resolve each moved pointer. Test the package copied alone into a temporary project, including a path with spaces.
- If preserving template parity claims, render changed templates with fixed slots and compare their gate block with real `cmd_preview` output. Cover all six SDKs for the moved matrix without running their package managers.
- Use the audit's diagnosis cases for retries, deduplication, endpoint exceptions, timeout/old-attempt overlap, namespace-version behavior, and simulator uncertainty. Structural text matching is not an observed agent-behavior evaluation.
- Run `bash -n skills/temporal/temporal-cloud-setup/scripts/provision.sh`, the focused Node tests, `npm run check`, then the repository's full required validation once integrated. No live setup is implied by passing these checks.
