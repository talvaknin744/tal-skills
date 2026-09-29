# Temporal skills from official sources

These eight installable packages are adapted from Temporal's official MIT-licensed skills, reviewed on September 29, 2026. They retain the upstream reference libraries and licenses. They are maintained here as tal-skills adaptations; Temporal has not endorsed the changes.

Each package includes `UPSTREAM.md` with its exact source commit, license, and local changes. [upstream-lock.json](upstream-lock.json) is the machine-readable inventory. Customer-story-derived skills are documented in the repository's main catalog separately from these upstream packages.

## Choose a skill

| Skill | Use it for | Invocation |
| --- | --- | --- |
| [temporal-developer](../../skills/temporal/temporal-developer/SKILL.md) | SDK implementation, debugging, determinism, retries, tests, versioning, and integrations | Automatic or explicit |
| [temporal-workflow-design-critic](../../skills/temporal/temporal-workflow-design-critic/SKILL.md) | Design reviews, Temporal fit, production readiness, and missing architecture decisions | Automatic or explicit |
| [temporal-workertuning](../../skills/temporal/temporal-workertuning/SKILL.md) | Slot suppliers, pollers, caches, worker capacity, and bottlenecks | Automatic or explicit |
| [temporal-observability](../../skills/temporal/temporal-observability/SKILL.md) | Metrics collection, queries, alerts, and diagnosis based on observed metrics | Automatic or explicit |
| [temporal-cloud](../../skills/temporal/temporal-cloud/SKILL.md) | Cloud connectivity, authentication, endpoints, and configuration | Automatic or explicit |
| [temporal-ops](../../skills/temporal/temporal-ops/SKILL.md) | Cloud/self-hosted administration and environment diagnosis | Explicit |
| [temporal-serverless](../../skills/temporal/temporal-serverless/SKILL.md) | AWS Lambda Worker deployment and troubleshooting | Explicit |
| [temporal-cloud-setup](../../skills/temporal/temporal-cloud-setup/SKILL.md) | Cloud provisioning, local sample setup, and a verified first Workflow | Explicit |

Invocation controls depend on the host's skill support. For the three operational packages, both upstream frontmatter and Codex metadata preserve explicit invocation. Installing a package does not run its commands or configure a Temporal account.

```bash
npx skills@latest add talvaknin744/tal-skills --skill temporal-developer
npx skills@latest add talvaknin744/tal-skills --skill temporal-workflow-design-critic
```

Select another name from the table with the same `--skill` option. Installing an individual package includes its bundled resources; sibling skill recommendations are optional and can instead be followed through current Temporal documentation.

## Corrections to the pinned upstream sources

- **Effect identity:** Activity retry keys retain one logical-operation identity. Attempt number is diagnostic metadata. Workflow replay uses recorded Activity results; it is distinct from retrying an Activity whose effect may already have happened. Receiver-side deduplication and local atomic effects replace the unsafe check/send/mark example. See Temporal's [idempotency tutorial](https://learn.temporal.io/tutorials/python/standalone-activities/).
- **Compensation:** Registration precedes an action with an uncertain outcome; compensation handles absent/already-compensated effects. Late attempts need resource-side coordination. See Temporal's [compensation ordering guidance](https://temporal.io/blog/compensating-actions-part-of-a-complete-breakfast-with-sagas).
- **Portability:** Documentation links resolve independently of the Temporal website; unavailable sibling names route to bundled skills or installed CLI help. Version-sensitive APIs require checking the actual SDK/server capabilities.
- **Authorization:** Operational skills use the target and scope already authorized in the session and collect only missing authorization or readiness. A host permission dialog is not assumed to exist.
- **Provisioning failures:** Cloud Setup propagates failed dependency installation. A partial dependency directory no longer counts as success. If parallel Namespace creation was already submitted, recovery inspects that Namespace before another provisioning attempt.

The remaining upstream instructions and examples are a pinned reference library, not a claim that every sample was tested against every supported SDK. Read only the references required for the current task.

## Runtime requirements

Most packages contain guidance only. CLI operations need the relevant installed `temporal`/`tcld` commands, authenticated access, and the intended environment. Serverless additionally needs the selected cloud/SDK tooling; its two CloudFormation assets are bundled.

Cloud Setup includes a Bash script and needs Git, network access, the prerelease unified Temporal CLI, `jq` or Python for secret capture, and the chosen SDK/package manager. macOS CLI installation uses Homebrew; other systems require the documented installation path. Its sample repositories, branches, package downloads, and Cloud account remain external dependencies. No Cloud resources or credentials were created while preparing these packages.

## Refresh an upstream package

1. Fetch the official repository and compare the proposed commit with the lock entry.
2. Review changed instructions, scripts, licensing, and runtime prerequisites. Carry forward or retire each local correction explicitly.
3. Update the package, its `UPSTREAM.md`, and the lock together. Preserve the upstream copyright and license.
4. Run repository validation, shell syntax checks for affected scripts, and relevant isolated behavioral evaluations. Live provisioning requires a separately authorized target and scope.

The official [Develop with AI](https://docs.temporal.io/with-ai) page also documents Temporal's upstream plugins. At review time its standalone Cloud Setup repository link returned 404; this package therefore comes from the licensed `plugins/temporal/skills/temporal-cloud-setup` subtree of the official Codex plugin.
