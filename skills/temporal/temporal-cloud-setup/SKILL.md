---
name: temporal-cloud-setup
description: Set up Temporal Cloud and run a sample Workflow on it for the user, doing the work end to end. Use when the user wants to set up Temporal Cloud, get started on Temporal Cloud, install the unified Temporal CLI (Public Preview Cloud extension), create a Cloud namespace or API key, clone a money-transfer sample app, write the client config TOML, or connect a local Worker to Temporal Cloud and run a sample Workflow. This is the Cloud setup path, not the local learning path (see temporal-developer). Covers Python, TypeScript, Go, Java, .NET, and Ruby SDKs.
version: 0.8.3
disable-model-invocation: true
---

Adapted from Temporal's official MIT-licensed skill. For the pinned source and local changes, see [UPSTREAM.md](UPSTREAM.md).

# Temporal Cloud Setup

## Role

You are an operator running the Temporal Cloud setup **for** the user. Do the work; do not turn this into a lecture. Ask a question only when you genuinely cannot proceed without the user's input (SDK choice, picking a region, browser login). Everything else — installing, cloning, creating the namespace + key, writing the TOML, starting the Worker, starting the Workflow — you perform yourself.

This is the **Cloud** path. It is distinct from `temporal-developer`, which teaches Temporal locally with `temporal server start-dev`. If the user wants to learn concepts locally, hand off to that skill instead.

**Environment:** a local shell with outbound access to the Cloud API. Browser OAuth and the Cloud gRPC API use different paths: successful login or cached `whoami` does not prove API reachability. A fresh login still needs the identity provider; the loopback callback does not make it offline. After login, inspect the live `regions` result. A `cloud-unreachable` error means that probe did not produce the expected result; classify the captured error before assuming a network or authentication cause. See [failure handling](references/failure-handling.md).

## Authorization and portability

Work within the setup scope the user actually requested: target account and region, billable Namespace creation, credential creation, local sample/dependency installation, and the sample run. Reuse explicit authorization already given for the same scope in this session; resolve missing scope before its dependent mutation. Tool-permission prompts vary by host and may be absent, so never treat an assumed prompt as authorization. Apply the browser login, sample run, and failure-injection readiness checkpoints only when the user has not already given the corresponding go-ahead. Resolve `scripts/provision.sh` from this installed skill's directory; run project commands in the chosen project directory.

This package supplies the script, not the Cloud account, CLI, SDK, or sample application. The script needs Bash, Git, outbound network access, a compatible Temporal CLI and Public Preview Cloud extension, `jq` or Python for key capture, and the chosen SDK/package manager. Its sample branches and package downloads are external dependencies. After scaffolding, verify the Worker polls and the Workflow completes; a cloned folder alone is not completion.

## Workflow

Read the [output format](references/output-format.md) when starting a walkthrough. Complete the requested phases in order, disclosing the selected [gate](references/gate-templates.md) before each action. Reuse authorization already supplied; ask only for missing scope or readiness. Keep the installed script unchanged during use.

## Steps — the flow (the spine)

<steps>

The whole run in order. Tier legend (see [output format](references/output-format.md)): **DISCLOSE** = render the gate, then run within the established authorization; **GO-AHEAD** = render, then collect `1. <action> / 2. Chat about this` only if readiness is still missing; **INPUT** = a numbered question (no script). Each step is one `scripts/provision.sh` subcommand unless noted. "On-error" lists the `error_code`s to map via Failure Handling.

| # | Phase | Step | Tier | Subcommand | Emits | On-error |
|---|-------|------|------|------------|-------|----------|
| 1 | 1 | Choose SDK | INPUT | — (numbered list) | sdk | — |
| 2 | 1 | Preflight | DISCLOSE | `preflight --sdk` | `config_path`,`cli_installed`,`cli_compatible`,`cli_action`,`cli_reason`,`warnings`,`stray_env` | `config-dir-unwritable` |
| 3 | 1 | Detect tools + pick manager | DISCLOSE (+ INPUT if >1 manager) | `detect-tools --sdk` | `default`,`managers`,`discrepancies` | `version-too-old` (advisory) |
| 4 | 1 | Install / update CLI | DISCLOSE | `install-cli` | `status`,`version`,`cloud_version`; `update=skipped` + `reason=compatible`, `update=updated`, or `installed_via=brew` | `brew-missing`,`manual-install`,`install-failed`,`install-verify-failed` |
| 5 | 1 | Sign in | **GO-AHEAD** | `login` | `identity` | `login-failed`,`not-authenticated` |
| 6 | 1 | List + pick region | DISCLOSE + INPUT | `regions` | region list | `cloud-unreachable` |
| 7 | 2 | Start namespace (async) | DISCLOSE | `start-namespace --sdk --region` | `namespace_name` | `create-rejected` |
| 8 | 2 | Choose clone dir | INPUT | — (1=default / 2=Edit) | dir | — |
| 9 | 2 | Scaffold the app | DISCLOSE | `scaffold --sdk [--manager] [--dir]` | `repo_path`,`manager` | `clone-failed`,`unknown-sdk`,`manager-not-found`,`unsupported-manager`,`dependency-install-failed` |
| 10 | 2 | Await namespace (join) | DISCLOSE | `await-namespace --name` | `namespace_handle`,`address` | `namespace-timeout`,`namespace-not-provisioning`,`handle-not-found` |
| 11 | 2 | Create key + save config | DISCLOSE | `create-key --handle --address` | `key_id` (token never printed) | `key-empty`,`key-limit-reached`,`no-json-parser`,`manual-key-needed` |
| 12 | 2 | Verify config | DISCLOSE | `verify-config` | — | `profile-missing` |
| 13 | 3 | Await auth | DISCLOSE | `await-auth` | `auth_ready` | `auth-timeout`,`key-expired` |
| 14 | 3 | Run the Workflow | **GO-AHEAD** | `run-workflow --sdk --dir` | `workflow_status`,`workflow_id`,`run_id` | `worker-unauthorized`,`worker-not-polling`,`worker-start-failed`,`workflow-failed`,`workflow-not-submitted`,`workflow-timeout`,`precompile-failed` |
| 15 | 4 | Inject failure + recover | **GO-AHEAD** | `run-workflow … --demo-failure transient` | same as 14 | same as 14 |

Read the selected [phase procedure](references/phases.md) for region selection, KeyId handling, and result links. Disclose the action using [gate templates](references/gate-templates.md) before invoking the script.

</steps>

### Secret-handling carve-out (overrides command disclosure)

The output contract says disclose the real command. **The API-key steps are the exception.** The `eyJ…` token must never be reprinted, logged, rendered in a diff, or passed as an argv. For the key-capture and TOML-write actions:

- Show the friendly label and a **redacted** form of the command — e.g. `api_key = "eyJ…(captured, not shown)"`.
- Never let the real token appear in the expandable block, in chat, or in a file-edit diff.
- The **KeyId** (e.g. `JW4LO…`) is *not* secret and may be shown. See [Phase 2](references/phases.md#phase-2--app--api-key) for the KeyId-vs-secret distinction.
- **Never read, `cat`, `grep`, or open `temporal.toml` (or any key-capture file) with the Read/Edit/Update tool.** The file holds the `eyJ…` token, so *any* read of it surfaces the secret into this transcript — this is the most common accidental leak. To confirm the profile, use **only** `scripts/provision.sh verify-config` (it checks the selected profile through a non-secret property and discards both output streams).
- **Never run `temporal cloud apikey create-for-me` (or any `apikey`/`config` command that emits the key) yourself.** Only `scripts/provision.sh create-key` mints and stores the token — it redirects the one-time secret straight into the locked file. Run the raw CLI by hand and it prints the token to the terminal, into this output.

## Execution and completion

Resolve [scripts/provision.sh](scripts/provision.sh) from this installed package. Invoke its subcommands with explicit working directories; do not reassemble raw Cloud commands or edit the installed script during a setup. The script owns retries, secret capture, the `cloud-setup` profile, and the per-SDK command matrix.

Each operation emits one block on stdout:

```text
=== RESULT ===
status=ok
<key>=<value>
=== END ===
```

`status` is `ok`, `error`, or `skipped`. Errors include `error_code` and `message`; read [failure handling](references/failure-handling.md) only when one occurs. Progress goes to stderr. Preserve uncertain outcomes: a local failure does not roll back a submitted Namespace creation.

- Preflight separates `cli_installed` from `cli_compatible` and returns `cli_action` / `cli_reason`. A compatible installation is skipped. Missing capabilities require install/update and revalidation; failure blocks provisioning. `version` identifies the core CLI; `cloud_version` identifies the extension.
- `start-namespace` returns `namespace_name`; `scaffold` returns `repo_path` / `manager`; `await-namespace` returns `namespace_handle` / `address`. Carry these values forward rather than reconstructing them.
- `create-key` returns the non-secret `key_id`; `verify-config` checks selected-profile existence without displaying config output; `await-auth` returns `auth_ready`. Never inspect the saved token in agent context.
- `run-workflow` must return `workflow_status=COMPLETED`, `workflow_id`, and `run_id`. A cloned project or live process alone is insufficient. For a requested failure demonstration, verify the recovered run separately.
- `preview <sub> [args]` is read-only (local help probes allowed), returns command fields and `=== GATE ===` / `=== END GATE ===` markers. Use it to resolve dynamic gates without performing the action. The script's automatic gate echo is an after-call record, not a substitute for pre-action disclosure.
- Utility commands remain available: `provision-and-scaffold` (legacy parallel fallback), `install-deps`, `clone`, `repair-config`, and `cleanup-info`. Inspect their help/preview before use; cleanup information does not authorize deletion.

Finish at the requested stopping point with completed resources, sample path, non-secret IDs and Workflow links, executed verification, and any remaining limitation. Do not force the failure demonstration or an extra checkpoint.

## Conditional references

- Starting or presenting a walkthrough: [output format](references/output-format.md).
- Before a command: the selected [gate template](references/gate-templates.md), including its SDK row only when needed.
- Entering a phase: [Phase 1 — setup](references/phases.md#phase-1--get-set-up), [Phase 2 — app/key](references/phases.md#phase-2--app--api-key), [Phase 3 — run](references/phases.md#phase-3--run-your-first-workflow), or [Phase 4 — recover](references/phases.md#phase-4--see-durable-execution-inject-a-failure).
- CLI/config compatibility or maintenance: [unified CLI](references/unified-cli.md). If installed flags have drifted, report the specific incompatibility rather than modifying the installed script mid-run.
- SDK sample commands and connection profile: [SDK Cloud reference](references/sdk-cloud.md).
- Script error: [failure handling](references/failure-handling.md).
