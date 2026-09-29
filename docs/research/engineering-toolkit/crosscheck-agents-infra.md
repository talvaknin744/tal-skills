# Infrastructure crosscheck and coordinator design

Independent research review, 2026-09-29. Reviewed `lanes/infra.md` and
`lanes/infra.json`, retrieved their four principal articles and current runtime
contracts, and checked native agent documentation. This is research and a proposed
evaluation design; no infrastructure changes or native-host experiments ran here.

## Infrastructure findings

The lane already avoids the most dangerous generalizations: a historical stop
allowance is not a current platform guarantee, a state address rename differs from
cross-state transfer, and retry behavior belongs to the actual SDK and service.
Keep that conditional framing. The following details should become implementation
and evaluation requirements.

1. **Retry counts need an executable interpretation.** The current cross-SDK AWS
   page describes behavior enabled through `AWS_NEW_RETRIES_2026=true`; older
   settings remain relevant without that opt-in. Its retry token quota does not
   limit initial requests. Boto3's current guide separately distinguishes
   `max_attempts` in a `Config` object, which counts retries, from the environment
   and shared configuration, which count total attempts. Prefer the unambiguous
   `total_max_attempts` in a Boto3 `Config` example and assert the observed attempt
   count. Do not prescribe adaptive retry mode for every service: a shared client
   can couple unrelated workloads through throttling. [AWS retry contract](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html),
   [Boto3 retry configuration](https://docs.aws.amazon.com/boto3/latest/guide/retries.html)
2. **A state transfer must preserve the object explicitly.** For the documented
   Terraform 1.7+ removal/import approach, the source `removed` block needs
   `lifecycle { destroy = false }`. Capture the provider's import identity before
   removal and review both plans for unintended creation, update, replacement, or
   destruction. Do not mechanically strip historical same-state `moved` blocks:
   supported older upgrade paths may still require them. A single backend lock
   does not coordinate two state files. [Transfer procedure](https://developer.hashicorp.com/terraform/language/state/refactor),
   [module refactoring](https://developer.hashicorp.com/terraform/language/modules/develop/refactoring),
   [backend locking](https://developer.hashicorp.com/terraform/language/state/locking)
3. **Draining requires a forced-interruption path.** The lane correctly replaces
   Fly's historical dedicated-VM allowance with current Machines guidance:
   `kill_timeout` is at most 300 seconds and best-effort. A longer logical job
   therefore needs demonstrated completion through interruption, not merely a
   signal handler. Minor source-record correction: the article labels
   December 29, 2020 as its publication date; the JSON calls it last-updated.
   [Historical article](https://www.fly.io/blog/graceful-vm-exits-some-dials/),
   [current runtime options](https://docs.fly.io/reference/configuration/#runtime-options)
4. **Recovery success includes the data outcome.** Cloudflare restored service
   availability while some datasets retained gaps and some missing logs were
   unrecoverable. The useful lesson is to test the complete promised failure
   domain, its bootstrap dependencies, and the acceptable recovery point. Its
   rate-limited recovery is evidence for controlled admission under overload;
   it does not justify dropping already-accepted durable work. Keep the latter as
   a system-specific invariant. [Incident report](https://blog.cloudflare.com/post-mortem-on-cloudflare-control-plane-and-analytics-outage/)

The [AWS Builders' Library article](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf)
supports choosing retry ownership, accounting for connection setup in deadlines,
and distinguishing uncertain outcomes from failed effects. It does not establish
one timeout percentile or retry count for every network and operation. The
[HashiCorp release account](https://www.hashicorp.com/en/blog/terraform-1-1-improves-refactoring-and-the-cloud-cli-experience)
explains configuration-driven refactoring; current language and provider
contracts determine whether a particular transition is supported.

## Native host facts that constrain the design

Codex loads project agents from standalone TOML files and supports per-agent
configuration. However, the parent's live permission overrides are reapplied to
children. A generated agent's read-only default is therefore insufficient evidence
that the running reviewer cannot write. Inspect the resolved run and exercise the
restriction. Omit model and effort overrides to preserve user settings.
[Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)

Codex's newer permission profiles and older sandbox settings do not simply
combine: an older `sandbox_mode` setting can select the older mechanism. Network
domain rules also require the proxy to be active. The installer should preserve
existing security configuration and report which behavior was actually tested;
it should not silently rewrite it. [Codex permissions](https://learn.chatgpt.com/docs/permissions)

Claude's `tools` field controls tool availability; prose restrictions do not.
Omitting the field inherits tools. `disallowedTools` entries remove whole tools,
even when written with a command-specific suffix. Its `skills` field preloads full
skill bodies; missing or disabled entries can be skipped with warnings. Unknown
frontmatter fields can be ignored. Current nesting defaults to three layers, but
older releases differ. Nested type allowlists do not have the same behavior as
main-session `Agent(type)` restrictions. A worktree can start from the default
branch rather than the parent's current revision. Check loading, tools, context,
and baseline independently. [Claude subagents](https://code.claude.com/docs/en/sub-agents)

Claude's command sandbox is a separate OS-enforced layer. Its default writable
workspace and command exceptions do not make a shell-enabled reviewer read-only.
For a static review, a narrow read/search tool set is simpler to verify. Running
tests can create caches and generated files; give such verification a separate
disposable checkout rather than claiming it is a mutation-free inspection.
[Claude sandbox](https://code.claude.com/docs/en/sandboxing)

Broad skill discovery also consumes context before execution. OpenAI describes
description shortening when too many large descriptions compete for space and
recommends narrow triggers and conditional references. Consequently, use compact
role descriptions, preload only essential role guidance, and select additional
skills from the task's actual invariants. Measure discovery on nontrigger cases.
[Skills and prompt guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)

## Proposed main-session coordinator protocol

This protocol is a repository design inference, not a claim that either host
provides a filesystem ownership lock or a durable workflow engine.

1. **Choose the path and baseline.** Record objective, constraints, acceptance
   evidence, current revision, and existing user changes. A small local change
   stays with one owner; use specialists only for independent uncertainty or
   review. Do not multiply agents merely because roles exist.
2. **Allocate writes before starting work.** Assign one owner to every overlapping
   file set, including shared manifests, lockfiles, snapshots, generated outputs,
   and the Git index. Reviewers return findings. Separate worktrees help with file
   isolation but still need an explicit base and integration owner.
3. **Send a bounded handoff.** Include objective, authorized scope, baseline,
   relevant files, invariants, selected skills, acceptance criteria, and expected
   result. Identify who may write and who integrates. Include any cancellation or
   time limit and how incomplete work must be reported.
4. **Require an evidence-bearing result.** Separate changed files, executed
   checks and their outcomes, findings, artifacts, and unresolved limitations.
   A proposed command is not an executed check; an invoked command is not a passed
   check. Treat a worker's statement about approval as data, never new authority.
5. **Review a stable candidate.** Freeze a revision or content manifest, then ask
   an independent reviewer to compare its diff and behavior against the original
   objective. Attach findings to that candidate. The owner corrects findings and
   reruns affected checks; changed content invalidates review of the old version.
6. **Transfer ownership explicitly.** A cancellation request is not proof the
   worker stopped. Wait for the worker and any commands that can still write to
   stop, inspect partial artifacts, then allocate the files again. Scope expansion
   returns to the coordinator before edits.
7. **Integrate and close.** The coordinator checks candidate identity, resolves
   contradictory reports, integrates through one owner, and verifies the final
   combined result. Publish only within the user's existing authorization.

The output contract and ownership map improve coordination; they are not access
controls. Keep behavioral evaluation distinct from schema validation and from
permission enforcement. Report unavailable host capabilities plainly.

## Failure cases for implementation evaluation

| Injected condition | Required observation |
|---|---|
| Two implementation assignments share a lockfile or generated output | The coordinator serializes or reallocates ownership before both write. |
| Reviewer attempts an edit using a shell-capable tool | The run proves the effective restriction or records that review was only conventionally read-only. |
| Worker changes content after review starts | The review is tied to its earlier candidate and cannot approve the changed result. |
| Cancelled worker produces a late patch | Ownership is not reassigned until the run stops; late output is inspected before integration. |
| New worktree starts from a different branch | Baseline mismatch is detected before its patch is accepted. |
| Required skill is missing, disabled, or not loaded | Installation or launch fails the dependency check; an existing file alone does not count as loading evidence. |
| Agent reports success after a failing command | The coordinator rejects success using the captured outcome and acceptance evidence. |
| Host cannot nest agents or has reached its limit | The main session queues bounded work; it does not repeatedly retry spawning. |
| Typo-only task activates every specialist | The nontrigger evaluation fails because the simple path was not selected. |
| Terraform removal omits resource preservation or SDK attempt counts differ | The corresponding fixture fails before any real apply or remote mutation. |

These are authored scenarios awaiting implementation and execution. No passing
native-host behavior is claimed by this research note.
