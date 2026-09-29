# Local infrastructure change verification

Run five Terraform lifecycle probes in an isolated temporary project: partial apply, recovery preserving completed work, stale saved plans, same-state moves, and retained state removal. The script always chooses its own project; it cannot target your current Terraform workspace.

Requires Python 3.9+ and macOS/Linux. The default run downloads Terraform **1.16.4** for amd64/arm64, checks the archive against both the committed pin and HashiCorp's current checksum file, and removes the temporary binary afterward. No global install, cloud account, external provider or production resource is involved.

```sh
python3 examples/infrastructure/verify.py --report /tmp/tal-infrastructure-report.json
```

For an offline run, supply a trusted 1.16.4 executable and its independently established SHA-256. The script checks the digest before copying/executing it and verifies the reported version. A caller-provided digest is an identity pin, not publisher authentication.

```sh
python3 examples/infrastructure/verify.py \
  --terraform /absolute/path/to/terraform \
  --terraform-sha256 <expected-executable-sha256> \
  --report /tmp/tal-infrastructure-report.json
```

The supplied executable is copied into the temporary directory; the original is unchanged. Downloaded archives are verified against the official HTTPS checksum and the committed archive digest; this script does not verify release signatures. Review a release before updating [the pin](terraform.lock.json).

## Expected evidence

| Probe | Required observation |
| --- | --- |
| Dependent provisioner deliberately exits 23 | Terraform apply exits 1, the first operation/effect survives, and the failed resource is tainted. |
| Reconcile from current state | The first resource keeps its ID and one creation event; only the failed resource is replaced. No state backup is restored. |
| Apply an intervening change after saving a plan | The old plan is rejected as stale and does not overwrite the intervening value. |
| Rename through `moved` | The JSON plan records the previous address and a no-op; ID is preserved. |
| Use `removed` with `destroy=false` | The plan records `forget`, ownership disappears from state, and the destroy provisioner does not run. |

Exit 0 means every check and normal cleanup passed. Exit 1 means a setup, command, evidence or cleanup failure; inspect the JSON error and command outputs. SIGTERM stops the owned process group, removes the temporary project, records the interrupted command, and exits 143. A command's expected exit 1 or a changed plan's exit 2 is part of the probe, not a verifier failure. The report includes exact argument arrays, runtime version, fixture/runner hashes, outputs and cleanup results. Expected failures remain in the record.

Normal completion destroys the remaining built-in test resource and checks that state is empty. The temporary directory is removed on success and handled failures, including the local files deliberately retained by `forget`. Since `terraform_data` owns no external object, removing the scratch directory also removes this example's resources after an early failure. Command timeouts terminate the owned process group before directory cleanup. As with any local program, an uncatchable process kill or machine failure may leave temporary files for manual cleanup.

Exercise verifier termination separately with a checksum-pinned synthetic wait executable. The harness observes its child startup before sending TERM, then checks process-group absence, scratch removal and the interruption report. This tests the verifier's lifecycle, not Terraform behavior.

```sh
python3 examples/infrastructure/verify_signals.py --report /tmp/tal-infrastructure-signals.json
```

## Boundaries

`terraform_data` stores lifecycle state; it is not a cloud service. The shell provisioners are deterministic fault/effect markers. Their use here does not recommend provisioning through shell commands, and preserving a marker does not establish database durability.

Saved-plan staleness is tested after a **Terraform state update**. Out-of-band cloud drift, provider-specific imports, cross-state transfer, real resource identity and remote locking are outside this example. A source-side `forget` is not proof that another state has adopted the object. Production plans/state can contain secrets; these fixtures contain synthetic values only. Keep real evidence under appropriate access controls and never paste production state into this report.

The verifier is explicit and is not discovered by `npm test`. [Official built-in resource](https://developer.hashicorp.com/terraform/language/resources/terraform-data), [apply behavior](https://developer.hashicorp.com/terraform/cli/commands/apply), [retained removal](https://developer.hashicorp.com/terraform/language/block/removed).

The committed [verification record](verification.json) is an observed macOS arm64 run. [Signal verification](signal-verification.json) records actual verifier termination. The [earlier lifecycle result](history/verification-before-sigterm-fix.json) and [reproduced TERM failure](history/sigterm-before-fix.json) remain historical evidence for the corrected cleanup defect. Records include candidate hashes; they do not replace running the current candidate. Linux download pins are supplied but Linux execution was not observed in these records.
