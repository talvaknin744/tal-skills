# Temporal Cloud extension and client config reference

The executor is the package's `scripts/provision.sh`. This reference explains its command contracts for maintenance; do not hand-run key-creation or config-read commands during a setup. Verify exact installed command help before changing the script.

## Status and installation

The Cloud extension is **Public Preview**, separately versioned from the core Temporal CLI. Reviewed against [Cloud CLI v0.1.1](https://github.com/temporalio/cloud-cli/tree/9575d18f0a4588b51382886655a30742c094baac) and [official CLI documentation](https://docs.temporal.io/cli/cloud) on 2026-09-29. Preview APIs can change; record the versions actually used.

Current macOS installation uses the supported tap:

```bash
brew install temporalio/brew/temporal-cloud
```

The older `temporalio/prerelease` tap has a migration path; its appearance in an existing setup is not proof that installation failed. Other platforms can use the [release archives](https://github.com/temporalio/cloud-cli/releases), with both the core `temporal` binary and the `temporal-cloud` extension on PATH. The setup script does not install Homebrew or download arbitrary binaries automatically.

Local inspection:

```bash
temporal --version           # core CLI
temporal cloud --version     # Cloud extension; not a 'cloud version' subcommand
temporal cloud --help
```

The script checks exact subcommand usage paths and required flags for Namespace creation/listing, key creation, login/identity/regions, config inspection, and Workflow/Task Queue verification. A compatible installation returns `update=skipped`, `reason=compatible`; an unknown development version can still be compatible. Missing capabilities cause install/update only on the supported Homebrew path, followed by revalidation. Package failure or still-missing capabilities is a structured error, not permission to continue. Preview and execution use the same decision function. `version` and `cloud_version` identify different binaries.

These local checks establish command shape, not Cloud account eligibility or live response semantics. Verify Namespace activation, key authentication, Worker polling, and Workflow completion separately.

## Authentication and regions

`temporal cloud login` starts browser authentication; `whoami` identifies the cached login. Neither proves Cloud API reachability. Fresh OAuth still requires identity-provider access despite using a loopback callback; see the [v0.1.1 login implementation](https://github.com/temporalio/cloud-cli/blob/9575d18f0a4588b51382886655a30742c094baac/temporalcloudcli/oauth.go). The subsequent `region list` is a live request. Select an exact provider-prefixed region from that account's result, reusing the user's already-stated region when it is present in the list.

Management commands use the browser identity, without `--profile cloud-setup`. Data-plane commands explicitly use the named `cloud-setup` profile. Do not infer that `tcld` and the Cloud extension use identical flags or credential environment variables.

## Namespace creation

The main flow uses `start-namespace` to submit the following shape, then clones/installs the sample while provisioning proceeds:

```bash
temporal cloud namespace create \
  --name <bare-name> \
  --region <provider-region-from-list> \
  --api-key-auth-enabled \
  --retention-days 30 \
  --auto-confirm \
  --async
```

`await-namespace --name <bare-name>` polls the exact name via `namespace list --name ... -o json`, waits for ACTIVE, and resolves the full `<name>.<account-id>` handle. Async submission is not readiness. A local interruption or failed clone does not cancel the submitted create; inspect that name before submitting another.

The legacy `provision-and-scaffold` fallback deliberately runs synchronous create in a background subprocess, joins it, and checks readiness. Its lack of `--async` is a fallback contract, not a claim that async is unsupported. Historical preview guidance saying async was unusable predates the current start/await flow.

The generated Namespace is API-key-only, so its Namespace Endpoint (`<handle>.tmprl.cloud:7233`) is appropriate. For an existing mixed-auth/private Namespace, use the actual configured endpoint and current [Namespace access guidance](https://docs.temporal.io/cloud/namespaces); do not generalize the setup assumption to all Namespaces.

## API-key capture

The current user command is `apikey create-for-me`, with required `--display-name` and the supported `--description`, `--expiry-duration`, `--auto-confirm`, and structured-output flags. The script uses a 25-hour key. A version check cannot establish whether a specific account permits creation.

Invoke only `scripts/provision.sh create-key`: it captures both streams into restricted temporary files, writes the token directly into a mode-0600 config, returns only non-secret identifiers, and removes capture files. Never show a token, pass it through argv, or read the saved TOML into agent context. Use `verify-config` for redacted verification.

The current structured response uses `token` and `keyId`. Legacy prerelease captures included empty/non-JSON output and TTY behavior; those observations explain defensive parsing and the hidden local-input fallback, but are not a universal claim about current v0.1.1. Failure to capture a token is an error, not evidence of a usable key. Reconcile the attempted creation and account limits before repeating it.

## Client config TOML

Temporal SDKs and the CLI share a client-config TOML with named profiles.

Default file locations:

| OS      | Path |
|---------|------|
| macOS   | `$HOME/Library/Application Support/temporalio/temporal.toml` |
| Linux   | `~/.config/temporalio/temporal.toml` |
| Windows | `%AppData%\temporalio\temporal.toml` |

Override with the `TEMPORAL_CONFIG_FILE` environment variable.

**Use a named `cloud-setup` profile — never write to `[profile.default]`.** The user may already have a `default` profile (local dev, another Cloud namespace) that this would silently overwrite. A named profile lives alongside it and is selected explicitly.

**Auth-override gotcha:** a profile that carries an `api_key` becomes the CLI's auth source for any command that loads it, **overriding the `temporal cloud login` (browser) session**. Implications:
- Run management commands (`login`, `whoami`, `namespace …`, `apikey …`) **without** `--profile`, so they keep using the login session. Use `--profile cloud-setup` only for data-plane `workflow` commands (which need the key). This is why writing the key to `default` is harmful — it would hijack every command.
- After the key is deleted or expires, any command that loads that profile fails auth against a namespace that may no longer exist. Remove the `[profile.cloud-setup]` block to clean up, or pass `--disable-config-file` to bypass the profile and fall back to the login session.

Profile structure:

```toml
[profile.cloud-setup]
address = "<namespace-handle>.tmprl.cloud:7233"   # namespace endpoint
namespace = "<namespace-handle>"
api_key = "<the-one-time-key>"

[profile.cloud-setup.tls]
disabled = false   # TLS is REQUIRED for Temporal Cloud — set it explicitly.
# An empty [profile.cloud-setup.tls] section left TLS ambiguous and caused
# "unable to connect / tls not set to true" failures; `disabled = false` is unambiguous.
```

**Let `provision.sh create-key` write the named profile.** Historical preview runs observed shared-file rewrites dropping unrelated OAuth configuration; the script preserves other profiles and never passes the key via `config set --value` (argv and history can expose it). It sets file permissions to 0600. The permission shape below is illustrative; use the script's resolved config path, not a hard-coded macOS path:

```bash
chmod 600 "$HOME/Library/Application Support/temporalio/temporal.toml"
```

For verification, invoke `scripts/provision.sh verify-config`. In [core CLI v1.9.1](https://github.com/temporalio/cli/blob/v1.9.1/internal/temporalcli/commands.config.go), `config list` enumerates all profile names and does not validate the selected profile. The script uses `--profile cloud-setup config get --prop address`, which requires that profile to exist, and discards both streams. It does not establish credential validity or network readiness; `await-auth` does that separately. Never read an entire secret-bearing profile into agent context.

Once the `cloud-setup` profile is set, `temporal --profile cloud-setup workflow list` / `workflow describe` operate against the Cloud namespace. Plain commands without the flag still use the user's `default` — so always pass `--profile cloud-setup`.

## Cloud UI deeplink

To send the user to their **specific Workflow run** in the browser (preferred — lands them on the run's history so they can watch it / see the failure-and-recovery), use the run URL:

```
https://cloud.temporal.io/namespaces/<namespace-handle>/workflows/<workflow-id>/<run-id>
```

The bare list URL (`…/workflows`) is a fallback only — surface the run-specific URL when you have the Workflow ID + Run ID (from the starter output or `workflow describe -o json`). `<namespace-handle>` is the namespace's full handle from `namespace create` — `<name>.<account-id>`, e.g. `quickstartai-go-20260617-143205.fmrip`.
## Historical auth-error observations

Older prerelease runs returned JWT-filter messages such as `Jwt is missing`, `Jwt issuer is not configured`, or `Jwt is expired`. These are examples, not guaranteed current wording. The script treats an expired/invalid/revoked/disabled key or token as permanent when the qualifier is anchored to credential context; other failures remain bounded retries and end with redacted evidence. Authentication readiness is not proven by a cached identity or exit code without a successful authorized call.

A wrong issuer or a TLS certificate requirement may indicate configuration, not propagation. Read the actual error and Namespace auth mode before retrying, changing endpoints, or minting another key. Update the parser and its tests together if current runtime evidence differs.
