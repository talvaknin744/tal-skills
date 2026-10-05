# Canonical definitions, adapters and project installation contract

Implementation recommendation, 29 September 2026. This contract is grounded in the current [skill checker](../../scripts/check-skills.mjs), [Markdown link extraction](../../scripts/lib/markdown-links.mjs), approved [implementation plan](implementation-plan.md), and observed [native compatibility](native-compatibility.md). It specifies repository tooling; it does not change user configuration or install anything.

## Canonical content and deterministic generation

Use one Markdown file per role at `agents/<concern>/<name>.md`. Frontmatter has exactly these fields; reject unknown keys, duplicate YAML keys and invalid types:

```yaml
schema_version: 1
name: tal-python
description: Implement or review Python backend changes using the project's runtime and conventions.
skills:
  - python-backend
```

The body holds the role's specialist task boundary, specific input needs, implement/review behavior and evidence requirements. Put the shared execution and result contract in `agents/CONTRACT.md`; do not repeat that boilerplate in fifteen roles. Do not repeat the skill's technical guidance. Do not add canonical model, permission, shell-command or arbitrary destination-path fields. Canonical role bodies may contain external source links, but no local Markdown links or images: the corpus validator rejects them. Dependencies are declared by skill name in metadata, not embedded as relative resource paths.

Use one workflow at `workflows/<name>/WORKFLOW.md`, with `schema_version`, `name`, `description`, `agents` and `skills`. Both arrays contain unique IDs; `skills` holds dependencies used directly by the coordinator. Require a nonempty body describing entry conditions, context, conditional specialist selection, ownership, review and stop conditions. A listed agent is an available participant, not a mandatory stage.

Names match the existing lowercase-hyphen pattern and 64-character maximum. Native role and workflow names start with `tal-`; existing skill names remain unchanged. Frontmatter descriptions are 1–1024 characters. Concerns remain folder organization and do not participate in host identity. Reject duplicate names across concerns and across generated workflow entrypoints and installed skill packages.

The recommended IDs are:

| Concern | Native role IDs |
| --- | --- |
| Coordination | `tal-coordinator` |
| Languages | `tal-python`, `tal-typescript`, `tal-go` |
| Correctness | `tal-boundaries`, `tal-idempotency`, `tal-consistency`, `tal-durability` |
| Platform | `tal-messaging`, `tal-infrastructure`, `tal-reliability` |
| Verification | `tal-failure-testing` |
| Protocols | `tal-mcp`, `tal-a2a` |
| Quality | `tal-cleanup` |

Workflow IDs: `tal-backend-delivery`, `tal-consistency-diagnosis`, `tal-messaging-evolution`, `tal-worker-rollout`, `tal-recovery-validation`, `tal-mcp-integration`, `tal-a2a-integration`, and `tal-cleanup-review`. Keep role and workflow names different even when a host puts them in separate directories; that makes user instructions unambiguous.

Treat the Markdown definitions as the only authoring inputs. A pure generation function accepts the catalog and selected IDs and returns a sorted map of relative destination paths to bytes. It does not touch disk, run a shell, inspect credentials or contact a model. Sort IDs and file paths, normalize generated text to LF with a final newline, and exclude timestamps, machine paths and model defaults. Copy skill resources byte-for-byte. Hash bytes, not decoded text.

Check generated native role files and workflow wrapper templates into `adapters/codex/` and `adapters/claude/`, with their eventual target-relative directory layout underneath. The deliberate exception is the workflow entrypoint filename: store `SKILL.md.template` in the source adapter tree and materialize it as `SKILL.md` only in the installation target. Do not check copied dependency skill packages into `adapters/`; the install plan obtains those from the canonical `skills/` tree. A `--check` generation mode recomputes expected adapter bytes and the template-to-installed-path mapping, reports missing/extra/changed artifacts and exits nonzero without rewriting. Generate TOML from the three known string fields with a tested TOML basic-string encoder; never interpolate raw Markdown into an unescaped quoted value. Validate generated TOML and YAML through independent parsers in tests.

### Keep bundle-dependent wrappers out of standalone skill discovery

The Vercel skills discovery implementation at commit `3694740352eeef5cdd689af694c485f1ff62eec3` looks for the exact filename `SKILL.md`. Its recursive fallback includes the adapter layout when `fullDepth` is requested; `adapters` is not an ignored directory. Such a wrapper would appear independently installable even though its `.tal-skills` links require the complete toolkit. `metadata.internal: true` does not fix packaging: explicit inclusion can bypass that filter. [Pinned discovery source](https://github.com/vercel-labs/skills/blob/3694740352eeef5cdd689af694c485f1ff62eec3/src/skills.ts)

**Decision:** use `SKILL.md.template` for committed wrappers. The installer performs a fixed filename mapping, not general template interpolation, and writes genuine `SKILL.md` files into the target host's skill directory. Verify that the generated adapter source tree contains no `SKILL.md`, that installed wrappers have that exact filename, and that their unchanged content resolves against the installed bundle. Do not rely on default scan depth, ignored-folder conventions or internal metadata to hide an incomplete package. The checked source file's SHA-256 is `6ec366e2a4f48767b3532c3dfa09cfb31857c8bb7c94ab109d5dfff0855ab371`.

## Shared execution contract without relative-link rewriting

Use one `agents/CONTRACT.md` for shared scope, authorization, file ownership, evidence and result requirements. The common result distinguishes completed changes, executed checks, findings and unresolved limits. Keep role-specific output requirements in each role body. `agents/CONTRACT.md` is a reserved common document, not a role definition, and is explicitly excluded from role-frontmatter discovery.

Every installation with at least one role includes this document at `.tal-skills/agents/CONTRACT.md`, including agent-only selections. Copy selected canonical role definitions under `.tal-skills/agents/` preserving their concern-relative paths. The bundle retains a readable canonical record; the native role remains the actual host entrypoint.

The native generator appends exactly one common-contract pointer to every role's generated instructions, using the fixed installed map. For both current host layouts, the link from `.codex/agents/<name>.toml` or `.claude/agents/<name>.md` is `../../.tal-skills/agents/CONTRACT.md`. State that this link resolves relative to the installed agent definition file, and name that project-relative definition path in the instructions. This keeps the artifact portable when the project moves. Validate the pointer in the assembled target tree.

Do not implement general Markdown URL rewriting for role bodies. Reject undeclared local role links at authoring time, while generating known dependency links and the common pointer mechanically. An existing remote URL is preserved, not interpreted as an instruction or downloaded during installation.

Workflow handoff guidance lives in `workflows/_shared/handoff.md` and is copied only when workflows are selected. It may link to the bundled common contract using its preserved relative location. Workflow documents are copied with their source-relative layout, so their local links must resolve to selected bundled workflow/agent documents; reject missing, unselected or escaping targets. Refer to skills by their declared public names rather than linking from the bundle to a host-specific skill tree. Agent-only installation must neither require the handoff guide nor pull in an unrelated workflow.

## Dependencies and native adapters

Resolve the closure as selected workflows → declared agents → each agent's declared skills, plus each workflow's direct skills. There are no implicit role-to-role dependencies. Missing IDs are errors before generation. Selecting all toolkit workflows must not install unrelated productivity skills merely because they exist in the repository.

Keep role dependency lists narrow:

| Role | Default skill dependencies |
| --- | --- |
| Coordinator | None; the chosen workflow supplies coordination instructions |
| Python / TypeScript / Go | Matching language backend skill only |
| Boundaries | `microservice-boundaries` |
| Idempotency | `idempotency` |
| Consistency | `concurrency-correctness` |
| Durability | `graceful-draining`, `recovery-validation` |
| Messaging | `messaging-reliability` |
| Infrastructure | `infrastructure-change-safety` |
| Reliability | `microservice-operations`, `recovery-validation` |
| Failure testing | `failure-oriented-testing` |
| MCP / A2A | Matching protocol engineering skill only |
| Cleanup | `code-and-docs-cleanup` |

A workflow can add `architecture` or another existing skill when its coordinator actually uses it. These lists limit injected or explicitly requested content; they are not security restrictions on skills a host can discover.

**Codex:** native role files go to `.codex/agents/<name>.toml`. Emit `name`, `description`, and `developer_instructions`; omit model and reasoning fields. Append the generated common-contract pointer and dependency instructions naming only that role's declared skill entrypoints, with paths relative to the native role file. Full packages go to `.agents/skills/<public-skill-name>/`. Do not generate or merge `.codex/config.toml`. Report project trust and executable-version problems separately from installation success.

**Claude:** native role files go to `.claude/agents/<name>.md`. Emit `name`, `description`, `model: inherit`, and `skills` containing that role's declared skill names, followed by the role body and generated common-contract pointer. Omit tools and permission fields so the user's existing policy remains effective. Full packages go to `.claude/skills/<public-skill-name>/`. The coordinator runs as the main session or through an inline workflow; do not require a nested coordinator subagent. Do not generate or merge Claude settings or authentication files.

Install the selected canonical workflows and role definitions under `.tal-skills/`, preserving their source-relative layout. Include `agents/CONTRACT.md` whenever roles are installed, and `workflows/_shared/handoff.md` only when a workflow is selected. Installed native workflow wrappers use `SKILL.md` in the corresponding host skills directory and link, using generated relative Markdown paths, to `.tal-skills/workflows/<name>/WORKFLOW.md`. Their committed `SKILL.md.template` source artifacts must not be copied under that template filename. Use the public invocation forms `$<name>` for Codex and `/<name>` for Claude. Keep wrappers inline: no Claude `context: fork`, model selection, automatically executed shell context, permission grants or hooks.

These wrappers are adapter artifacts, **not** new independently installable packages under `skills/`. The current skill checker must continue forbidding links outside individual skill directories. Add a distinct adapter/bundle checker that resolves wrapper links within the assembled target project. Native roles and bundle documents may reference declared installed dependencies; a standalone skill may not depend on a sibling skill or `.tal-skills`.

Copy every selected skill's whole package, including references, scripts, license, attribution and metadata. Do not rewrite its public name or resource links. No symlinks point back to the source checkout. In a dual-host installation each host gets its own complete package copy. This modest duplication keeps native discovery and independent removal straightforward.

## Installer interface and ownership

Provide a Node.js 22+ entrypoint with this interface:

```text
node scripts/install-toolkit.mjs --target <existing-project-directory>
  --host codex|claude|both
  [--workflow <id> ...] [--agent <id> ...]
  [--dry-run] [--json]
```

`--target` and `--host` are required. Unknown flags and IDs fail. On first installation, omitted selectors mean all eight workflows and all fifteen roles. On an existing installation, omitted selectors retain its recorded component selection; explicit selectors replace that selection. `--host` defines the desired host set, so changing `both` to `codex` removes only unmodified, installer-owned Claude artifacts. Dry-run must display that removal. There is no global mode, force-overwrite, implicit adoption, dependency download or source-code execution.

Dry-run computes the same complete plan as apply, including `create`, `update`, `remove`, `unchanged` and `conflict`, sorted by relative path. It creates no files, locks or directories. Human output names conflicts and the tested/native-check status; `--json` returns a versioned record with target, requested hosts, selected IDs, operations and conflicts. Exit 0 means a conflict-free plan or successful application; nonzero means an invalid request, conflict, filesystem failure or incomplete prior transaction. Native model execution is a separate optional smoke command, not an installation side effect.

Store ownership in `.tal-skills/manifest.json`:

- `schema_version: 1`, `toolkit: "tal-skills"`, `generator_version: 1`.
- `source_digest`: SHA-256 over sorted selected canonical paths and bytes, skill resources and generator source bytes, using length-delimited records to prevent concatenation ambiguity.
- Sorted `hosts`, `selection.agents` and `selection.workflows`.
- Sorted `files`: project-relative POSIX `path`, `sha256`, numeric `mode`, `kind` and logical `source` for every managed regular file, excluding the manifest itself. Track ordinary read/write permissions and executable bits on supported filesystems; native Windows mode tracking is normalized because Unix executable bits are unavailable there.
- Sorted `package_roots` and `created_directories`; record only directories the installer actually created.

Do not store absolute source paths, credentials, account identities, model settings or dates in the manifest. Validate manifest structure and destinations before trusting it. It cannot authorize writes to `.git`, global directories, `.codex/config.toml`, Claude settings, authentication files or unrelated project content. Reject an unknown manifest schema or generator major version rather than guessing at migration.

First installation refuses an existing unowned package root, role file, wrapper or `.tal-skills` directory, even if bytes happen to match. Existing shared parent directories such as `.claude/skills` are allowed. Users can resolve the reported collision explicitly; the installer must not claim ownership of another installation. Read existing skill frontmatter in the target host tree to detect a conflicting public name at another path as well as a same-path collision. Report a duplicate discovered in known ancestor/user skill locations as an external discovery conflict without editing it; never promise that a target-only scan covered every plugin or admin source.

On upgrades, replace an owned file only when its current hash and tracked mode equal the previous manifest record. Missing owned files may be recreated. A changed owned file blocks the entire plan; preserve user edits. Remove obsolete owned files only if their hashes and tracked modes still match. Preserve unowned files and nonempty directories; never recursively delete a package directory. Repeated installation with identical inputs and unmodified files is a byte-for-byte no-op, including the manifest.

## Filesystem safety and interrupted installation

Resolve the explicitly supplied target with `realpath` once. A user-selected alias such as macOS `/tmp` may resolve normally; then treat that canonical directory as the boundary. Require it to exist and be a directory. Use `path.resolve`, `path.relative` and `path.isAbsolute` containment checks, not string-prefix checks. A valid child cannot have `..` as its first relative component or be an absolute relative result. Apply equivalent tests with Windows drive and UNC paths.

Manifest paths are relative POSIX paths. Reject empty segments, `.`/`..`, backslashes, drive prefixes, NUL/control characters, trailing dots/spaces, and Windows reserved device names in every segment. Reject case-folded/NFC-equivalent destination collisions on every platform, so a package accepted on Linux does not overwrite a distinct entry on default macOS or Windows filesystems. Convert separators only after validation. Never shell-expand target paths.

Use `lstat` on every source entry and on existing destination components below the canonical target. Reject source symlinks, destination symlinks/junctions and nonregular payload files. In particular, refuse a symlinked `.codex`, `.claude`, `.agents`, `.tal-skills`, skill package, or nested resource. Preserve existing root/parent permissions; use ordinary restrictive creation permissions and preserve a copied script's executable bit where the filesystem supports it. No chmod of user-owned parent directories.

Application uses an exclusive project-local lock and a staging directory on the target filesystem. Preflight the entire plan before the first managed mutation, stage and verify all new bytes, record original hashes and backups in an installation journal, then apply files and write the new manifest last. Use exclusive creation for absent destinations and recheck type/hash immediately before replacing or deleting owned files. Publish each file through a same-filesystem operation; do not claim that the whole multi-directory installation is atomic.

On a caught failure, restore this transaction's changes only while their bytes and tracked modes still match what it wrote. An interrupted transaction leaves the journal, backups and lock for diagnosis. A subsequent ordinary installation refuses to proceed. Provide `--recover` as a separate mode requiring only `--target`: under the recorded journal, roll back files whose state is either the known preimage or transaction postimage, preserve any third-party change, and stop with a conflict if safe recovery cannot finish. Validate staging contents before cleanup and preserve unexpected files or directories. Remove the journal and lock only after the old manifest/state is restored. An unknown or malformed journal is not permission to delete paths.

This protects cooperating installs and detects ordinary concurrent edits. A hostile process swapping filesystem components between checks is outside the portable Node installer guarantee; do not describe path validation as an operating-system sandbox. Users should not run two different installers or edit managed files during an apply operation.

## Acceptance scenarios

1. Generation is stable across filesystem enumeration order and LF/CRLF canonical input handling; copied resource hashes remain exact. Missing/duplicate IDs, malformed metadata, undeclared dependencies and escaping references fail before output. Adapter source trees contain no exact `SKILL.md` filenames or duplicate dependency packages; assembly converts only the declared wrapper templates into host-discoverable `SKILL.md` files.
2. Install each host and both hosts into temporary paths containing spaces and non-ASCII characters. Every role resolves only its declared skills, every workflow resolves its closure, and standalone packages pass the unchanged existing checker. Agent-only installs contain and resolve the common contract without installing a workflow; adding a local role-body link fails validation rather than producing a broken native link.
3. Same inputs produce no writes. An upgrade updates unmodified owned files, recreates missing owned files, removes obsolete owned files, and preserves unrelated files. One edited managed file aborts the complete apply.
4. Same-path and different-path/same-name collisions fail without mutation. Existing identical but unowned content is not adopted. Host-set changes remove only manifest-owned, unchanged artifacts.
5. Reject traversal, absolute/drive/UNC manifest destinations, reserved names, case-equivalent names, source links, destination links/junctions, nested links, nonregular files and attempts to manage protected config paths. Test containment against sibling prefix names such as `project-other`.
6. Inject failure before writes, between two replacements and before the manifest update. Verify recovery restores the old state, preserves a concurrent third-party edit, and never treats a partial installation as success. An active/stale lock or unsupported manifest blocks ordinary apply.
7. Dry-run has no filesystem side effects. JSON output is deterministic apart from the explicitly reported canonical target. Neither install nor generation runs package managers, model calls, authentication, network requests or copied skill scripts.
8. Separately run native discovery/execution smoke tests on recorded host versions. Keep Claude's current OAuth limitation and the Codex scratch trust limitation explicit until those checks actually pass.
