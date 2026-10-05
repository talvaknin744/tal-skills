# Cloud setup phase procedures

Read only the phase being entered. The [entrypoint](../SKILL.md) defines authorization, script results, secret handling, and the requested stopping point; [output format](output-format.md) supplies the presentation.

```text
Phase 1 — Get set up:            choose SDK · install CLI · sign in · choose region
Phase 2 — App & API key:         create namespace + clone sample + install deps (parallel) · create API key · write config TOML
Phase 3 — Run your first Workflow: start the Worker · run the Workflow (success)
Phase 4 — See Durable Execution: inject a failure · watch Temporal retry & recover  ──► then END
```

<phases>

## Phase 1 — Get set up

*Intent: get the tools on your machine, sign you in, and capture your choices — everything the rest of the run needs.*

Step checklist: `SDK chosen` · `Tools detected` · `CLI installed` · `Signed in` · `Region chosen`.

**Step — Choose your SDK** (genuine input, not a checkpoint): present the six as a **numbered list** (numbered list, runtime-agnostic) — Python, Go, TypeScript, Java, .NET, Ruby — and take a typed name/number. This selects which repo is cloned and the language of the local app. Echo the resolved profile line (`Setting up for: macOS · Python SDK`) once answered.

Right after the SDK pick, the **preflight** check (DISCLOSE — render, then run): render its gate from the `preflight` template ([gate templates](gate-templates.md)), then run `scripts/provision.sh preflight --sdk <sdk>`. Read `cli_installed`, `cli_compatible`, `cli_action`, and `cli_reason`; presence alone does not prove the required commands are usable. If its `stray_env` lists any `TEMPORAL_*` vars, tell the user they override the saved profile and ask them to unset them before continuing; surface other `warnings` (e.g. `brew-missing`, `no-json-parser`) only if they block a later step.

**Step — Detect local tools + choose your package manager** (DISCLOSE — render, then run). Render its gate from the `detect-tools` template ([gate templates](gate-templates.md)), then run `scripts/provision.sh detect-tools --sdk <sdk>` and read its RESULT. This adapts the setup to the user's machine, and it surfaces tooling problems **early** (here in Phase 1) instead of deep in Phase 2/3.

- **Package manager (Python & TypeScript only).** `managers` is the set of package managers **this sample supports** for the chosen SDK. When it lists more than one, ask **which of the sample-supported managers to use** — frame it that way ("the sample supports these — which should we use?"), **not** as "here's what's installed on your machine." Present them as a **numbered list** (runtime-agnostic) with the `default` marked — e.g. Python `1. pip (default)` / `2. uv`; TypeScript `1. npm (default)` / `2. pnpm` / `3. yarn`. The user confirms the default or overrides; carry the choice into Phase 2 as `scaffold --manager <m>`. **This is a question — ask it alone and wait for the answer; do not disclose install-cli or sign-in in the same message** (see "One step at a time"). For **Go / Java / .NET / Ruby** the sample has a single toolchain — state it (`Using: maven`) and **skip the prompt**.
- **Surface `discrepancies` HERE (fail-early), plain language:**
  - `version-too-old:<tool>@<have>(min<min>)` — an **advisory** warning with remediation (e.g. *"Node 16 detected; 18+ recommended — consider upgrading, but I can proceed"*). Not a hard stop.
  - `tool-missing:<runtime>` / `manager-not-found:<m>` — the runtime or chosen manager isn't installed. Offer another **sample-supported** manager from `managers`, or ask the user to install the tool, then re-run `detect-tools`.
- The default proposal is **deterministic** — the same machine yields the same default every run; nothing is persisted (no state file).

**Step — Verify/install the Temporal CLI** (DISCLOSE, then run `scripts/provision.sh install-cli`). Choose the [gate branch](gate-templates.md) from preflight `cli_action`; if tools changed, refresh it with read-only `preview install-cli`.

- `skip`: compatible commands/flags are present. Report `update=skipped`, `reason=compatible`; do not upgrade.
- `install` / `upgrade`: macOS with Homebrew can install/update `temporalio/brew/temporal-cloud`. The script rechecks the exact required subcommands and flags before returning success.
- `manual`: relay the missing-capability and platform/Homebrew error; do not auto-install Homebrew or continue to provisioning with an incompatible CLI.
- Record `version` (core CLI) and `cloud_version` (extension) separately. An unknown development version may be usable if capability checks pass. The extension is Public Preview; see [current CLI guidance](unified-cli.md).

This CLI is separate from any local `temporal server start-dev`. The Cloud path does not start a local server.

**Step — Sign in** (**GO-AHEAD** — a browser opens; use the user's existing readiness confirmation or collect it now). Render its gate from the `login` template ([gate templates](gate-templates.md)), then present `1. Sign in / 2. Chat about this` and wait if readiness is not already confirmed. On `2`, answer the question and re-present. On `1`, run `scripts/provision.sh login` — it runs `temporal cloud login` (which opens a browser on the user's machine and blocks until they finish) and then confirms with `whoami`. **Do not ask the user to run the command themselves** (no `! temporal cloud login` hand-off); you run the script, the user just completes the browser prompt. Tell them to complete the sign-in in the browser. On success the result block carries `identity`; on `error_code=login-failed`/`not-authenticated`, ask them to finish the browser login and re-run. If they're not part of a Cloud account yet, point them to https://temporal.io/get-cloud and pause.

**Step — Choose your region** (DISCLOSE — render, then run): render its gate from the `regions` template ([gate templates](gate-templates.md)), then run `scripts/provision.sh regions` (you're authenticated now). It prints the live region list; present it as a **numbered list** (runtime-agnostic), then apply these picking rules:

- **Recommend the nearest** — infer it from the system timezone/locale (e.g. `America/New_York` → suggest `aws-us-east-1`) and mark it `(recommended)`, but the user still picks.
- **Never accept a region from memory and never auto-select** — a valid-but-wrong region creates a persistent, billable namespace in the wrong place (and has set off internal alerts). Use the exact identifier the user picks (shape `<provider>-<region>`); it's passed to the create step next.
- **Fail fast — only accept a region that appears in the `regions` output** (it reflects what your account can actually use). If the user names one that isn't listed, don't pass it to create (a region your account lacks access to is the classic "it spun for minutes" trap) — re-show the list and have them pick a listed value.
- **Steer away from `unsupported_regions`** — the `regions` RESULT may list `unsupported_regions` (regions whose provider reads `UNKNOWN`, e.g. `azure-centralus`). On such accounts those **accept a namespace create but never provision it** — a phantom that stalls the next phase. Mark any listed there as `(may not be available on your account)`, **don't recommend it**, and steer to an AWS/GCP region. If the user insists, warn it may never provision (you'll catch it fast — see `namespace-not-provisioning`).
- **If the create is still rejected** for the region, see Failure Handling (`create-rejected`) — re-list and re-pick, never silently retry the same region.

**If the user asks at the checkpoint, explain (plain language):** installed the Temporal CLI, signed you in, and recorded your SDK + region. Your namespace itself gets created in the next phase — in parallel with setting up your app. (Docs: https://docs.temporal.io/cli)

## Phase 2 — App & API key

*Intent: create your Cloud namespace and download the sample app (clone + dependencies) in parallel, then mint your API key and save the connection config — everything needed to run Workflows on Cloud.*

Step checklist: `Namespace active` · `Sample cloned` · `Dependencies installed` · `API key created` · `Config saved`.

The namespace and the app are set up as **three separate, individually-gated steps** — so the **billable** namespace gets its own explicit approval, distinct from the benign clone. The namespace provisions on Temporal's servers (`--async`) **while** the app is cloned, so the parallelism is preserved without any background process having to survive across steps (identical on Claude Code, Codex, Cursor).

**Step — Start your namespace** (`start-namespace`, DISCLOSE — its own gate, then run; the established scope must authorize this **billable** create — make the `description` say so):

- **Fire-and-forget:** submits the create with `--async`, returns immediately, and provisions server-side while you download the sample app.
- **Read `namespace_name`** from the result — you pass it to `await-namespace` below. The handle isn't known yet (it resolves once provisioning completes).
- **Errors:** `create-rejected` (region/name).

**Step — Ask where to clone** (genuine input — **always ask, don't silently default**). Present a two-option numbered choice where **option 1 is the default clone path itself** (so the user sees and confirms the real path) and **option 2 is "Somewhere else"**:

```
Where should I clone the sample app?
1. ./money-transfer-project-template-python
2. Somewhere else
```

- **1** → clone to that path (omit `--dir`, or pass it explicitly — same result).
- **2 (Somewhere else)** → ask for the path, then pass it as `--dir`.

Show the concrete default for the chosen SDK in option 1 (e.g. `./money-transfer-project-template-ts` for TypeScript, `./money-transfer-project-template-go` for Go). Pass the chosen path as `--dir` to `scaffold` below.

**Step — Download the sample app** (`scaffold`, DISCLOSE — its own gate, then run, separate from the namespace):

- **Clones the cloud-ready sample + installs dependencies** — runs **while the namespace provisions**, threading the Phase 1 manager choice and the clone dir just chosen.
- **`--manager`/`--dir` are validated fail-fast before the clone** — a bad/uninstalled manager errors immediately (`manager-not-found` / `unsupported-manager`).
- **Read `repo_path` + `manager`.** Other errors: `clone-failed`, `unknown-sdk`.
- The cloned branch ships wired for Cloud — **no connection code to edit.**

**Step — Wait for the namespace** (`await-namespace --name <namespace_name>`, DISCLOSE — render, then run): render its gate from the `await-namespace` template ([gate templates](gate-templates.md)), then run `scripts/provision.sh await-namespace --name <namespace_name>`. Polls (via the exact `namespace list --name` filter) until the namespace is **ACTIVE**, then reads the handle + endpoint from that result. Read **`namespace_handle`** + **`address`**; carry both into the key step below. Errors: `namespace-timeout` (appeared but slow — re-run), `namespace-not-provisioning` (never appeared — bad region, re-run `start-namespace` elsewhere), `handle-not-found`.

For reference, the per-SDK repo mapping (the script selects the right one):

| SDK        | Repository (branch `money-transfer-project-cloud-setup`) |
|------------|------------|
| Python     | `https://github.com/temporalio/money-transfer-project-template-python` |
| Go         | `https://github.com/temporalio/money-transfer-project-template-go` |
| TypeScript | `https://github.com/temporalio/money-transfer-project-template-ts` |
| Java       | `https://github.com/temporalio/money-transfer-project-java` |
| .NET       | `https://github.com/temporalio/money-transfer-project-template-dotnet` |
| Ruby       | `https://github.com/temporalio/money-transfer-project-template-ruby` |

**How it connects (no edit needed):** all six SDKs load the **`cloud-setup`** profile from `temporal.toml` (env-config). The key step below writes it; nothing else is needed at run time.

**After `await-namespace` returns, go straight to the `create-key` step — no *phase checkpoint* between them, and don't re-print the checklist or tracker. But `create-key` still gets its own gate — its command is disclosed, then run within the established credential/setup authorization; it mints your key *and* writes/replaces the `cloud-setup` profile in `temporal.toml`. The next checklist render is the completed one at the end of the phase.**

**Step — Create the key and save the config** (`create-key --handle <namespace-handle> --address <address>`, DISCLOSE — render, then run, using the values from the `await-namespace` step above). In one deterministic, secret-safe operation the script:

- **re-verifies auth** (`whoami`, re-prompting login if expired);
- **mints the key** with the pinned flags;
- **captures it via `-o json` into a `0600` temp file** so the `eyJ…` token never reaches stdout, your context, or a rendered diff;
- **writes a named `cloud-setup` profile** into the shared `temporal.toml` (address, namespace, api_key) **without touching `[profile.default]`** or its login session;
- **`chmod 600`s the file** and deletes the temp capture.

It returns only the **non-secret** `key_id` and the `config_path` — never the token. Then verify the profile (DISCLOSE — render, then run): render its gate from the `verify-config` template ([gate templates](gate-templates.md)), then run `scripts/provision.sh verify-config` to confirm the profile loads (it never prints the api_key value).

This is the [secret-handling carve-out](../SKILL.md#secret-handling-carve-out-overrides-command-disclosure): render the action's label without the token; never reprint, log, argv-pass, or commit it.

- On `error_code=key-empty`/`not-authenticated`: an expired login — let the script re-prompt and retry once; don't switch output formats or poll.
- On `error_code=key-limit-reached`: the account is at its API-key cap — the mint was rejected at create time. Have the user delete stale keys (`temporal cloud apikey list`, then `temporal cloud apikey delete --key-id <id>` on old `money-transfer-cloud-setup-*` keys), then re-run `create-key`. Don't re-run login.
- On `error_code=no-json-parser`: install `jq` or `python3`, then re-run (the safe capture needs one).
- On `error_code=manual-key-needed`: automatic capture failed and there was no terminal to paste into. Ask the **user** to paste the one-time key and re-run `create-key` from a context with a terminal — the script reads the paste *hidden*, straight into the locked file. **Never** have the user paste the key into the chat, and never paste it yourself.
- The secret is shown only once and cannot be retrieved later; if it's truly lost, mint a new key (re-run this step) — don't try to recover the old value.

**KeyId vs. secret — not the same thing.** The `key_id` the script returns (e.g. `JW4LO…`) is a non-secret *identifier* — the handle used to revoke the key later (`temporal cloud apikey delete --key-id <KeyId>`); fine to show. **Only the `eyJ…` token is the credential** — never reprint, log, or commit it.

**When you check off "API key created," label the `key_id` so a newcomer can't mistake it for the secret.** A bare 32-char `key_id` on its own reads like a leaked key and alarms people. Render it with an explicit non-secret tag, and make the config line state the secret was stored (not shown) — e.g.:

```
- [x] API key created — key id JW4LO… (non-secret identifier; used to revoke the key)
- [x] Config saved — ~/Library/Application Support/temporalio/temporal.toml (chmod 600; secret stored, not shown)
```

Never render the `key_id` bare and unlabeled, and never put the `eyJ…` token on either line.

**Env vars override the profile.** Env-config gives `TEMPORAL_*` env vars **higher precedence** than the TOML profile — the Phase 1 preflight flags any stray `TEMPORAL_ADDRESS`/`TEMPORAL_NAMESPACE`/`TEMPORAL_API_KEY`. If `stray_env` was non-empty, make sure they're unset in the run shell or they'll override the saved profile at run time.

**If the user asks at the checkpoint, explain (plain language):** created your Cloud namespace and, in parallel, cloned a small money-transfer app in your language and installed its dependencies. Then minted an API key for your namespace (`<namespace-handle>`) and saved the connection — address, namespace, key — into a locked `cloud-setup` profile your app reads at run time. (Docs: https://docs.temporal.io/develop · https://docs.temporal.io/cloud/api-keys)

## Phase 3 — Run your first Workflow

*Intent: prove the whole setup works by running a real Workflow on Temporal Cloud.*

Step checklist: `Worker running` · `Workflow completed`.

The app connects from config and Phase 2 supplied the credentials — this phase is **run-only**. All SDKs read the `cloud-setup` profile from `temporal.toml`; confirm it's present with `scripts/provision.sh verify-config` if you haven't already.

**Connect-readiness is handled for you — do not hand-roll the Worker.** The Worker start, the wait-until-it's-polling, the starter, and the Worker teardown all live in **one deterministic call** (`run-workflow`), so you never launch `nohup … &` / `ps` / `pgrep` yourself — that is exactly the flaky, noisy step this replaces. Two things still matter:

1. A freshly-minted API key isn't accepted by the data plane *immediately* — wait on `await-auth` first.
2. The generated API-key-only Namespace should use its Namespace Endpoint (`<handle>.tmprl.cloud:7233`). After bounded readiness retries, classify the actual credential, auth-mode, profile, and network evidence. Do not switch endpoints or mint another key without a diagnosed cause; continued failure alone does not prove a provider fault.

Run two script calls, both using `repo_path` from Phase 2 (the script handles per-SDK run commands and Python venv activation internally — you don't):

1. **Wait for auth** (`await-auth`, DISCLOSE — render, then run): render its gate from the `await-auth` template ([gate templates](gate-templates.md)), then run `scripts/provision.sh await-auth` and wait for `auth_ready=true`. On `error_code=key-expired`, the key is permanently rejected (commonly a next-day re-test against a key that auto-expired in ~25h) — re-run `create-key` (see [failure handling](failure-handling.md)); on `auth-timeout`, read the appended redacted CLI stderr, wait, and re-run.
2. **Run the Workflow** (`run-workflow --sdk <sdk> --dir <repo_path>`, **GO-AHEAD** — the deliberate moment): render its gate from the `run-workflow` (clean run) template ([gate templates](gate-templates.md)), collect `1. Run it / 2. Chat about this` only if readiness is missing (on `2`, answer, then re-present); with `Run it` already confirmed, one synchronous call starts the Worker, waits until it's polling (Temporal's API, not the OS process table), runs the starter, and stops the Worker. Wait for `workflow_status=COMPLETED`; it emits the run's **`workflow_id`** + **`run_id`** (don't run `workflow list` yourself). On `worker-unauthorized`, re-run `await-auth` then `run-workflow` (see [failure handling](failure-handling.md)).
3. **Show the success link, then confirm the win.** `run-workflow` already verified `COMPLETED`. Surface the run's **timeline** page on its own bare line (bare URL so the terminal auto-linkifies it — no backticks/fence), using the `workflow_id` and `run_id` from the RESULT block:

   **View your completed Workflow on Temporal Cloud:**

   https://cloud.temporal.io/namespaces/<namespace-handle>/workflows/<workflow-id>/<run-id>/timeline

   That's your first Workflow on the Cloud — no separate `workflow describe` needed.

   *Fallback — only if `run_id` came back `unknown` (the data plane was briefly lagging): show the Workflow **detail** page instead, rendered exactly like the link above — bold lead-in, then a bare URL alone on its own line (no backticks) so it auto-linkifies:*

   **View your completed Workflow on Temporal Cloud:**

   https://cloud.temporal.io/namespaces/<namespace-handle>/workflows/<workflow-id>

   *Never fall back to the bare `…/workflows` namespace list.*

At the **Phase 3 checkpoint**, lead with the win — `**Phase 3 complete ✅ — your first Workflow ran clean.**` — then the standard numbered prompt (`1. Continue` / `2. I have a question about this phase`). Phase 4 itself frames and triggers the failure injection, so this checkpoint stays a plain **Continue**.

**If the user asks at the checkpoint, explain (plain language):** started a Worker that polls your Cloud namespace, ran the money-transfer Workflow against Temporal Cloud, and confirmed it reached `COMPLETED` — your first Workflow on the Cloud. (Docs: https://docs.temporal.io/workflows)

## Phase 4 — See Durable Execution (inject a failure)

*Intent: break the transfer on purpose and watch Temporal retry and recover it — the durable-execution payoff. Run this phase only when the requested scope includes the failure demonstration; reuse the user's readiness confirmation or collect it before injection.*

Step checklist: `Failure injected` · `Recovered & completed`.

**Open by framing the break, then let the user trigger it.** After the tracker + intent + unchecked checklist, explain in one or two plain sentences what's about to happen — *we'll run the same transfer again, but force the deposit to fail on its first attempts, then watch Temporal automatically retry until it succeeds* — then present a numbered prompt so the user actively triggers it:

```
1. Inject the failure
2. Chat about this
```

On `1`, run the inject step below; on `2`, answer the question and re-present. This is a genuine engagement point (genuine input, not a checkpoint), not a checkpoint.

> The `DEMO_FAILURE` toggle is shipped on the `money-transfer-project-cloud-setup` branches (the deposit activity reads it), verified end-to-end on real Cloud for all six supported SDKs.

**Step — Inject the failure.** The `1. Inject the failure` choice above is this step's go-ahead — so disclose, then run (don't add a second go-ahead prompt):

- **Disclose:** render its gate from the `run-workflow` (inject + recover) template ([gate templates](gate-templates.md)).
- **Run:** `scripts/provision.sh run-workflow --sdk <sdk> --dir <repo_path> --demo-failure transient`. Starts the Worker with `DEMO_FAILURE=transient` (the deposit activity fails its first attempts, then succeeds), runs **the same starter command — the sample's source is never edited** (it reads its Workflow ID from the environment), and stops the Worker when done.
- **Distinct Workflow ID:** this run is named `money-transfer-demo-recovery` (vs the clean run's `money-transfer-demo`), so it appears as a **separate Workflow** in Cloud whose history shows the failure-and-recovery.
- **Wait for `workflow_status=COMPLETED`** — the retry recovered it. **Keep this call's `workflow_id` + `run_id`**; they identify the recovery run the Ending link points at.

**Step — Show the recovery.** Keep it to **one line**: the deposit failed on purpose, Temporal retried it automatically, and the Workflow still reached `COMPLETED` (the withdrawal never re-ran) — then send them to the dashboard to see it. Don't walk through the worker logs or event history line-by-line; the dashboard CTA carries the detail.

*(Variant — advanced, manual.)* `DEMO_FAILURE=permanent` makes the deposit fail **non-retryably**, so the **`refund`** compensation runs — the saga/rollback story. Two caveats:

- **Run it by hand, not through `run-workflow`** — `run-workflow` expects `COMPLETED` and would report a non-zero starter as `workflow-failed`.
- **Terminal state differs by SDK** — narrate what the history actually shows, don't assert one outcome:
  - Python / Go / TypeScript / .NET → **`FAILED`** (the original error propagates after the refund).
  - Java / Ruby → **`COMPLETED`** (their saga returns after compensating).

There is **no checkpoint after Phase 4** — go straight to the Ending, whose Cloud-UI link is the recovered run's timeline page (`money-transfer-demo-recovery`).

**If the user asks (plain language):** we made the deposit fail on purpose; Temporal retried it automatically and the Workflow still finished correctly — no lost state, no manual recovery. (Docs: https://docs.temporal.io/encyclopedia/retry-policies)

</phases>

## Ending the Skill

Once Phase 4 has shown the recovery, the setup is done. **Close with a short summary and the recovery link — keep it tight, no big recap table.** Do exactly this:

1. **No Worker should still be running** — `run-workflow` stops its Worker when it returns, so Phases 3 and 4 leave nothing polling Cloud. Only stop a process by hand if you ran the advanced manual `DEMO_FAILURE=permanent` variant.
2. **Show the recovered Workflow, then close with the summary.** First the Cloud UI link (bold lead-in, bare URL alone on its own line, no backticks) — the **recovery run's timeline** page, using the `workflow_id`/`run_id` Phase 4 emitted:

   **View your recovered Workflow on Temporal Cloud:**

   https://cloud.temporal.io/namespaces/<namespace-handle>/workflows/<workflow-id>/<run-id>/timeline

   *Fallback — only if `run_id` is `unknown`: show the Workflow **detail** page the same way — bold lead-in, bare URL on its own line:*

   **View your recovered Workflow on Temporal Cloud:**

   https://cloud.temporal.io/namespaces/<namespace-handle>/workflows/<workflow-id>

   *— never the bare `…/workflows` list.*

   Then close with a short summary (a few plain sentences, no table) that makes the durable-execution payoff concrete — for example:

   > 🎉 You're set up on Temporal Cloud — and you just watched **Durable Execution** in action. Your money-transfer Workflow ran on real Cloud infrastructure, and when the deposit failed on purpose, Temporal automatically retried it until it succeeded — the transfer still completed, with no lost state and not a line of retry code from you. That's the whole idea: you write the business logic; Temporal makes it survive failures and run to completion.

3. **One-line note:** the API key is saved in `temporal.toml` (give the path, `chmod 600`) and **auto-expires in ~25 hours** — don't share raw terminal logs and never commit the TOML.

The summary above is the payoff — keep it to that one short recap. The only calls-to-action are the **two Workflow timeline links** — the completed run (Phase 3) and the recovered run (here at the end). Don't loop back, re-run, keep teaching, offer teardown, or suggest other next steps — a successful completion is the terminal state.
