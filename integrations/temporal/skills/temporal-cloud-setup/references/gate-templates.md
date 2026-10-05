# Cloud setup gate templates


Use the selected template to disclose the real action before calling the script. Fill slots from the sources below. These templates describe the same actions as `preview`; the script remains the source of truth for command flags. Formatting is not required to be byte-identical. For a dynamic installation branch or utility step, `scripts/provision.sh preview <sub> [args]` is a read-only way to resolve its gate before the effectful call. Never execute a raw key-creation command from a displayed gate.

### Filling the slots

| Slot | Source |
|------|--------|
| `‹sdk›` | the user's SDK pick (Phase 1) |
| `‹region›` | the user's region pick (Phase 1, from the `regions` list) |
| `‹manager›` | `detect-tools` RESULT `default`, or the user's override when they pick a non-default manager |
| `‹clone-dir›` | the user's clone-dir pick (Phase 2); default = the repo basename for `‹sdk›` (see SDK command reference) |
| `‹namespace-name›` | `start-namespace` RESULT `namespace_name` |
| `‹namespace-handle›` | `await-namespace` RESULT `namespace_handle` |
| `‹address›` | `await-namespace` RESULT `address` |
| `‹repo-url›` | SDK command reference, keyed by `‹sdk›` |
| `‹install-cmd›` | SDK command reference, keyed by `‹sdk›`/`‹manager›` |
| `‹worker-cmd›` | SDK command reference, keyed by `‹sdk›` |
| `‹starter-cmd›` | SDK command reference, keyed by `‹sdk›` |
| `‹task-queue›` | SDK command reference, keyed by `‹sdk›` |
| `‹runtime›` | SDK command reference, keyed by `‹sdk›` (the version-probe binary) |
| `‹probe-bins›` | SDK command reference, keyed by `‹sdk›` (the manager binaries to look for) |

`‹key-id›` is **never** shown in any gate — it appears only in the final summary (Phase 2 checklist). There is **no token slot**: the `eyJ…` token never appears in a template.

### SDK command reference

Source of truth = `scripts/provision.sh`. Keyed by `‹sdk›` (and `‹manager›` where it varies):

| `‹sdk›` | `‹repo-url›` | `‹runtime›` | `‹task-queue›` |
|---------|-------------|-------------|----------------|
| python | https://github.com/temporalio/money-transfer-project-template-python | python3 | TRANSFER_MONEY_TASK_QUEUE |
| go | https://github.com/temporalio/money-transfer-project-template-go | go | TRANSFER_MONEY_TASK_QUEUE |
| ts | https://github.com/temporalio/money-transfer-project-template-ts | node | money-transfer |
| java | https://github.com/temporalio/money-transfer-project-java | java | MONEY_TRANSFER_TASK_QUEUE |
| dotnet | https://github.com/temporalio/money-transfer-project-template-dotnet | dotnet | MONEY_TRANSFER_TASK_QUEUE |
| ruby | https://github.com/temporalio/money-transfer-project-template-ruby | ruby | money-transfer |

`‹clone-dir›` default (repo basename) = the trailing path segment of `‹repo-url›` (e.g. python → `money-transfer-project-template-python`, java → `money-transfer-project-java`).

**Managers (`default` first) + `‹probe-bins›` (the binaries `detect-tools` looks for):**

| `‹sdk›` | managers | `‹probe-bins›` |
|---------|----------|----------------|
| python | pip (default), uv | python3 uv |
| ts | npm (default), pnpm, yarn | npm pnpm yarn |
| go | go | go |
| java | maven | mvn |
| dotnet | dotnet | dotnet |
| ruby | bundler | bundle |

(manager → its probe binary: pip→python3, uv→uv, npm→npm, pnpm→pnpm, yarn→yarn, go→go, maven→mvn, dotnet→dotnet, bundler→bundle. `‹probe-bins›` for an SDK is the space-joined probe binaries of all its managers, in the order above.)

**`‹install-cmd›`** (keyed by `‹sdk›`/`‹manager›`):

| `‹sdk›`/`‹manager›` | `‹install-cmd›` |
|---------------------|-----------------|
| python/pip | `python3 -m venv env && . env/bin/activate && python -m pip install -q temporalio` |
| python/uv | `uv venv env && . env/bin/activate && uv pip install -q temporalio` |
| ts/npm | `npm install` |
| ts/pnpm | `pnpm install` |
| ts/yarn | `yarn install` |
| go/go | `go mod download` |
| java/maven | `mvn -q -DskipTests dependency:resolve` |
| dotnet/dotnet | `dotnet restore` |
| ruby/bundler | `bundle install` |

**`‹worker-cmd›` / `‹starter-cmd›`** (keyed by `‹sdk›`):

| `‹sdk›` | `‹worker-cmd›` | `‹starter-cmd›` |
|---------|----------------|-----------------|
| python | `source env/bin/activate && python run_worker.py` | `source env/bin/activate && python run_workflow.py` |
| go | `go run worker/main.go` | `go run start/main.go` |
| ts | `npm run worker` | `npm run client` |
| java | `mvn -q compile exec:java -Dexec.mainClass=moneytransferapp.MoneyTransferWorker -Dorg.slf4j.simpleLogger.defaultLogLevel=warn` | `mvn -q compile exec:java -Dexec.mainClass=moneytransferapp.TransferApp -Dorg.slf4j.simpleLogger.defaultLogLevel=warn` |
| dotnet | `dotnet run --project MoneyTransferWorker` | `dotnet run --project MoneyTransferClient` |
| ruby | `ruby worker.rb` | `ruby starter.rb` |

The scaffold install-comment also varies by where deps land — keep the comment exactly as the template shows for that `‹sdk›`/`‹manager›` (python/ts say "inside the repo"; go/java/dotnet/ruby say "GLOBAL, outside the repo …"). The worked example and templates below carry the right wording per SDK; for non-python SDKs use the install comment from `scripts/provision.sh preview scaffold --sdk ‹sdk›` if you ever need to re-verify it (read-only preview).

### Templates

**Phase 1 — `preflight`** (static):

````
**Checking your environment**

```bash
# check git / jq / brew are available (read-only, local)
command -v git jq brew

# check the Temporal config directory is writable (so temporal.toml can be saved)
# provision.sh creates and removes its own temporary write probe under the resolved config directory

# list TEMPORAL_* variable names only; never show values
compgen -e | grep '^TEMPORAL_' || true
```
````

**Phase 1 — `detect-tools`:**

````
**Detecting your local tools**

```bash
# detect which package managers are installed for ‹sdk› (read-only, local)
command -v ‹probe-bins›

# read each tool's version to flag anything below the minimum
‹runtime› --version
```
````

**Phase 1 — `install-cli`:**

Choose the branch from the preflight `cli_action` / `cli_reason`. If local tools changed since preflight, obtain a fresh `preview install-cli` before disclosure. Preview checks local command help only.

| `cli_action` | Disclosed action | Expected result |
| --- | --- | --- |
| `skip` | Compatible CLI already installed; no software changes | `update=skipped`, `reason=compatible` |
| `install` | `brew install temporalio/brew/temporal-cloud` (adds software, then checks capabilities) | `installed_via=brew` or structured error |
| `upgrade` | `brew upgrade temporalio/brew/temporal-cloud` (missing capabilities; update and recheck) | `update=updated` or structured error |
| `manual` | No package operation; explain `brew-missing` or `unsupported-os` and the [release download](https://github.com/temporalio/cloud-cli/releases) | Stop before provisioning until capabilities are available |

For example, the compatible branch is:

````
**Checking the Temporal CLI**

```bash
# required local command/flag capabilities are present; no software changes
# compatible Temporal CLI already installed; skip installation
```
````

**Phase 1 — `login`** (static):

````
**Sign in to Temporal Cloud**

```bash
# open a browser to sign in (blocks until you finish)
temporal cloud login

# confirm the signed-in identity
temporal cloud whoami
```
````

**Phase 1 — `regions`** (static):

````
**Listing your Cloud regions**

```bash
# list the regions your account can use
temporal cloud region list
```
````

**Phase 2 — `start-namespace`:**

````
**Creating your Cloud namespace**

```bash
# create your Cloud namespace - billable; submits async, provisions server-side (~a few min)
temporal cloud namespace create --name <name> --region ‹region› --api-key-auth-enabled --retention-days 30 --auto-confirm --async
```
````

**Phase 2 — `create-namespace`** (the synchronous variant — rare; the flow uses `start-namespace` + `await-namespace`):

````
**Creating your Cloud namespace**

```bash
# create your Cloud namespace - billable; provisions server-side (~a few min)
temporal cloud namespace create --name <name> --region ‹region› --api-key-auth-enabled --retention-days 30 --auto-confirm
```
````

**Phase 2 — `scaffold` (clone + deps):**

````
**Downloading the sample app (clone + dependencies)**

```bash
# clone the Cloud-ready sample
git clone --branch money-transfer-project-cloud-setup --single-branch ‹repo-url› ‹clone-dir›

# install dependencies with ‹manager› ‹install-location-note›
(cd ‹clone-dir› && ‹install-cmd›)
```
````

`‹install-location-note›` per SDK (keep verbatim): python = `into a local venv (env/) inside the repo` · ts = `into node_modules inside the repo` · go = `into the shared Go module cache - GLOBAL, outside the repo (~/go/pkg/mod)` · java = `into the shared Maven cache - GLOBAL, outside the repo (~/.m2)` · dotnet = `into the global NuGet cache - GLOBAL, outside the repo (~/.nuget/packages)` · ruby = `into globally-installed gems - GLOBAL, outside the repo`.

**Phase 2 — `await-namespace`** (static):

````
**Waiting for the namespace to provision**

```bash
# poll until the namespace is ACTIVE — provisioning usually takes ~a few minutes (bounded)
temporal cloud namespace list --name <namespace-name> -o json
```
````

**Phase 2 — `create-key`** (secret carve-out — the token is captured to a 0600 file, never shown; **never** add a token slot):

````
**Creating your API key and saving the config**

```bash
# mint the key + write the cloud-setup profile to temporal.toml (token captured to a 0600 file, never printed)
temporal cloud apikey create-for-me --display-name money-transfer-cloud-setup-<random> --expiry-duration 25h --auto-confirm -o json
```
````

**Phase 2 — `verify-config`** (static):

````
**Verifying the saved config**

```bash
# verify the selected profile exists by reading its address; discard both output streams
temporal --profile cloud-setup config get --prop address >/dev/null 2>&1
```
````

**Phase 3 — `await-auth`** (static):

````
**Waiting for the API key to be accepted**

```bash
# poll an authorized call until the new key is accepted (bounded ~90s)
temporal --profile cloud-setup workflow list --limit 1
```
````

**Phase 3 — `run-workflow` (clean run):**

````
**Run your first Workflow**

```bash
# Worker - runs in the background, polls the task queue, stopped when done
(cd ‹clone-dir› && ‹worker-cmd›)

# starter - submits the Workflow, waits for COMPLETED, exits (the run can take a minute or two)
(cd ‹clone-dir› && WORKFLOW_ID=money-transfer-demo ‹starter-cmd›)
```
````

**Phase 4 — `run-workflow … --demo-failure transient` (inject + recover):**

````
**Run the recovery Workflow (inject a failure)**

```bash
# Worker - runs in the background, polls the task queue, stopped when done
(cd ‹clone-dir› && DEMO_FAILURE=transient ‹worker-cmd›)

# starter - submits the Workflow, waits for COMPLETED, exits (the run can take a minute or two)
(cd ‹clone-dir› && WORKFLOW_ID=money-transfer-demo-recovery ‹starter-cmd›)
```
````

(Utility subcommands — `clone`, `install-deps`, `provision-and-scaffold`, `repair-config` — are **rare** and have no dedicated template; derive their gate from the `scaffold`/`install-cmd` shapes above if you ever invoke one.)

### Worked example — the `scaffold` gate for Java, fully filled

`‹sdk›` = java → `‹repo-url›` = `https://github.com/temporalio/money-transfer-project-java`, `‹clone-dir›` (default) = `money-transfer-project-java`, `‹manager›` = `maven`, `‹install-cmd›` = `mvn -q -DskipTests dependency:resolve`, `‹install-location-note›` = `into the shared Maven cache - GLOBAL, outside the repo (~/.m2)`. The rendered gate:

````
**Downloading the sample app (clone + dependencies)**

```bash
# clone the Cloud-ready sample
git clone --branch money-transfer-project-cloud-setup --single-branch https://github.com/temporalio/money-transfer-project-java money-transfer-project-java

# install dependencies with maven into the shared Maven cache - GLOBAL, outside the repo (~/.m2)
(cd money-transfer-project-java && mvn -q -DskipTests dependency:resolve)
```
````
