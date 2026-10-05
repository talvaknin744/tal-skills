# Corrections found during implementation review

Research findings were checked again against the implementation and runnable
experiments. These corrections preserve the distinction between an initial
claim, an observed failure, and a verified revision. Per-example evidence retains
failed attempts and candidate hashes.

## Temporal endpoints and CLI configuration

An implementation initially described Regional Endpoints under
`*.api.temporal.io` as legacy and substituted `*.region.tmprl.cloud`. Independent
review corrected that claim: Regional Endpoints remain
`<region>.<cloud_provider>.api.temporal.io:7233`; the latter form is an HA/private
DNS intermediary. Namespace Endpoint recommendations do not make every Regional
Endpoint obsolete. The saved audit recommendation was broader and omitted this
hostname distinction. [Official namespace access documentation](https://docs.temporal.io/cloud/namespaces#access-namespaces).

The initial isolated `verify-config` fixture also modeled the CLI incorrectly.
Core CLI v1.9.1 `config list` lists profile names; adding `--profile` does not
establish that the requested profile exists. The corrected probe queries the
selected profile's `address` property and discards both output streams, so it
does not print configuration values. Source compatibility and stubbed command
tests remain separate from live CLI/account execution.
[Tagged CLI implementation](https://github.com/temporalio/cli/blob/v1.9.1/internal/temporalcli/commands.config.go).

## Protocol boundaries

MCP Origin validation applies to incoming HTTP connections under the deployment's
allowed-origin policy; a present but invalid Origin receives HTTP 403. Loopback
binding and local host checks are an additional branch, not the scope of the
Origin requirement. The example already installed the middleware; the skill's
conditional reference was corrected. [Pinned MCP transport specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http).

Stock Python A2A terminal continuation was observed to return `INVALID_PARAMS`.
When adding an application guard, that observation should not become its target
contract: the pinned specification calls for `UnsupportedOperationError` on
terminal task continuation. The corrected guard and cross-language assertion
use the normative result, while the stock mismatch remains labeled historical
evidence. [Pinned A2A send-message contract](https://a2a-protocol.org/v1.0.1/specification/#311-send-message).

## Runtime evidence

Independent reviews also found and corrected:

- Unbounded connection retirement after a canceled idle TypeScript lease, and
  a new Python rollback wait after the request timer had already fired.
- Python's initial assumption that any SQLSTATE establishes a failed COMMIT;
  completion-unknown and connection-fatal errors require conservative reporting.
- Failure to retain the identity of a delta already covered by its baseline,
  and missing continuity conditions for an integer-revision delta stream.
- A restore duration mislabeled as command-only despite including provisioning.
- Terraform verifier SIGTERM handling that skipped detached-process cleanup.
- Installer recovery and ownership races, plus permission changes not restored
  by the original rollback implementation.

The corrected examples and installer contain corresponding checks. Their scope
and observed results are recorded with the [runnable examples](../../examples/README.md)
and deterministic installer tests; none of these observations establishes a
general production guarantee or a comparative agent-skill improvement.
