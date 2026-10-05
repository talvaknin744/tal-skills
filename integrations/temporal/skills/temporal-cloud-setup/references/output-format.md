# Cloud setup presentation

Use the user's chosen scope. Explain material side effects before actions, then show a short phase checklist and the selected [command gate](gate-templates.md). Keep ordinary transitions concise; answer questions and report real errors directly. Never insert credential values into a template.

## Opening

For a complete walkthrough, adapt this roadmap to the authorized stopping point:

> This creates a Namespace and API key in your selected Temporal Cloud account and may incur cost. The Cloud CLI extension is Public Preview.
>
> 1. Set up — select SDK, verify tools, sign in, and select a listed region.
> 2. App and API key — provision the Namespace while cloning the sample, then save the key securely.
> 3. Run — start the Worker and verify the sample Workflow completes.
> 4. Recover — if requested, inject a transient failure and verify recovery.
>
> Setting up for: **<OS> · <SDK or pending>**

Use [phase procedures](phases.md) for the actual command sequence. The notice is disclosure, not an extra approval requirement.

## Per-step loop

1. Render the selected gate before the effectful call, including billable resources and software installation. Resolve values from script results or confirmed selections. Read-only `preview` can supply dynamic gates.
2. Invoke the bundled script with a plain-language tool description and explicit working directory. Parse its single RESULT block.
3. On error, read [failure handling](failure-handling.md), fix the named cause, and rerun only the appropriate step. Report uncertainty about a submitted Cloud create before considering another create.
4. Show observed completion, not a checkmark based only on issuing a command. Reuse existing scope authorization and readiness confirmation.

For browser login, sample execution, or deliberate failure injection, collect only missing readiness. Numbered choices work across hosts:

```
1. <Sign in / Run it / Inject the failure>
2. I have a question
```

An input handoff must include its relevant context in the final response, since intermediate output may collapse. Do not repeat a question already pending. SDK/manager/region questions are needed only when the choice cannot be resolved from the request and evidence.

## Phase progress and checkpoints

At phase entry, show its intent and checklist. At completion, mark only verified steps and include useful non-secret identifiers. An optional progress tracker is:

```
✅ Set up · 🔵 App & API key · ⚪ Run · ⚪ Recover
```

For an interactive learning walkthrough, offer a phase checkpoint when the user wants to pause:

```
1. Continue
2. I have a question about this phase
```

Do not force another approval for steps already authorized. Respect a narrowed stopping point. Phase 4 ends with the [completion summary](phases.md#ending-the-skill), rather than another loop.
