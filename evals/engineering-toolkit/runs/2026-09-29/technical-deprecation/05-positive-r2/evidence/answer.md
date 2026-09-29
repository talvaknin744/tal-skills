**Do not approve the October package as written.** Advisory deprecation and migration preparation can proceed; bulk conversion, withdrawal of supported tools, and declaring retirement complete cannot. The supplied evidence establishes parser capability for one cohort, not completed migration.

| Proposed stage | Recommendation | Required evidence |
|---|---|---|
| **1 — Announce, October 1** | Proceed only with a revised advisory notice. Retain compatible installation kits and editors. | State the optional migration path, continued support through December 31, accountable owner, and evidence-based removal gates. Silence from customers is not acceptance. |
| **2 — Migrate, October 8** | Reject the all-108 conversion. Prepare a corrected converter and a bounded pilot. An optional 3.8 upgrade can proceed separately while retaining legacy configuration. | Semantic preservation, a compatible **running** executable and editing path, current configuration capture, proven recovery, and an assigned batch owner. |
| **3 — Complete, October 15** | Reject global removal and closure. Optional 3.9 rollout may follow successful cohort migration and validation of the release artifacts. | Verified configuration activation and healthy startup, compatible editors and recovery kits, resolved offline/local consumers, and satisfaction of support commitments. A deployment flag is insufficient. |

These recommendations address the [proposed stages](/tmp/tal-deprecation-trials-20260929/05-positive-r2/workspace/project/proposal.md:7).

**Existing support commitments rule out October withdrawal.** Relay 3.6 and 3.8, including their documented legacy keys, remain supported through **2026-12-31**; upgrading is optional. Preserve legacy console submissions and the documented 9.2 editor/kit path, or provide a demonstrated compatible substitute. Editor 10.0-rc1 cannot be that substitute for 3.6 because it emits `prefetch`, which 3.6 rejects. Merely including both spellings also fails on 3.6. January 1 is the earliest possible policy-based removal point under the supplied commitment, **not automatic removal approval**. See the [support and format contract](/tmp/tal-deprecation-trials-20260929/05-positive-r2/workspace/project/contract.md:7).

The inventory requires four separate transition decisions:

| Cohort | Established evidence | Next permissible transition |
|---|---|---|
| **70 centrally managed, 3.8** | Executable evidence dated September 28; all 70 sampled files used legacy fields on September 23. | Best pilot candidates after refreshing actual files, correcting conversion, and validating editing and recovery. Capability alone does not establish migration. |
| **20 centrally managed, 3.6** | September 28 executable evidence; legacy files sampled September 23. | Optional upgrade to 3.8 using legacy files; confirm actual activation and startup before any replacement-format delivery. |
| **18 offline** | Last seen September 4 on 3.6; current files and health unknown; expected return October 19. | Keep the legacy path. Reconcile executable, local file, editor, and queued updates on return before migration. They cannot support an October 15 completion claim. |
| **12 locally administered** | August 18 audit: eight on 3.8, four on 3.6; no telemetry or central delivery; current files unknown. | Obtain a local migration record with version, file, editor, startup, and recovery evidence. Instructions sent through a bulletin would establish none of these outcomes. |

All four cohort assignees are unset in the [installation inventory](/tmp/tal-deprecation-trials-20260929/05-positive-r2/workspace/project/inventory.json:5).

**The dashboard supplies narrowly covered absence, not absence of dependency.** It recorded zero console submissions in either format during September 22–29. It observes neither startup reads nor local edits. Its 70/70 denominator excludes 3.6 installations and those without current telemetry. Meanwhile, the September 23 samples establish legacy use in 90 files; the other 30 installations’ current files are unknown. The supplied evidence verifies no completed configuration migrations. See the [metric definitions](/tmp/tal-deprecation-trials-20260929/05-positive-r2/workspace/project/inventory.json:85).

**The converter changes supported behavior.** Applying its documented rule to the supplied examples produces these results; these are deductions from the rule, not executed converter tests:

| Sample | Proposed output | Required output |
|---|---|---|
| `sample-03`: explicit `false`, limit `0`; policy `true`/`128` | `{"prefetch":{"enabled":true,"max_items":128}}` — enables previously disabled read-ahead and replaces unlimited with a cap | `{"prefetch":{"enabled":false,"max_items":0}}` |
| `sample-28`: enabled omitted, explicit limit `256`; policy enabled `false` | Writes explicit `enabled:false`, losing future policy inheritance | `{"prefetch":{"max_items":256}}` |
| `sample-46`: explicit `true`, limit `0`; policy limit `128` | Replaces unlimited with a cap of `128` | `{"prefetch":{"enabled":true,"max_items":0}}` |

The sample contains nine explicit `false` values, six zero limits, ten omitted enabled fields, and fourteen omitted limits. These are actual migration cases, not hypothetical edge cases. The single successful `true`/`128` fixture does not cover them. See the [sample records](/tmp/tal-deprecation-trials-20260929/05-positive-r2/workspace/project/inventory.json:56) and [converter evidence](/tmp/tal-deprecation-trials-20260929/05-positive-r2/workspace/project/inventory.json:96).

Before a pilot, require presence-based conversion that preserves `false`, `0`, omission, and stored limits while disabled. For mixed documents, preserve 3.8’s per-field replacement precedence and legacy fallback. Checks must cover policy changes across restarts, disabling then re-enabling, partial replacement objects, invalid types and `null`, and repeated conversion. Verify effective behavior and editing round trips on the relevant executable/editor combinations—not just key names or startup acceptance.

**Delivery must be gated per installation.** The safe transition is: capture the current file and pending updates; activate 3.8 with legacy configuration; verify startup; establish a compatible editor and recovery path; convert and deliver; verify the received file, restart, and effective behavior; then consider 3.9. Refresh stale samples and detect intervening local edits before overwriting files.

Download acknowledgements do not prove that 3.8 is running. Configuration delivery does not inspect executable versions, and bundling independent channels creates no transaction. A prematurely delivered `prefetch` file makes 3.6 exit before connecting to its queue. These are explicit [delivery and activation constraints](/tmp/tal-deprecation-trials-20260929/05-positive-r2/workspace/project/contract.md:3).

Maintain a record for **all 120 installations**, separating running binary, actual configuration revision/format, receipt, activation, startup health, editor/kit compatibility, queued changes, recovery readiness, owner, and unresolved status. Local installations need equivalent offline evidence. Migration completion requires all applicable evidence, not a percentage among reporting installations.

Once a cohort is ready, switch its templates and producers to replacement output. Any enforcement should target explicitly migrated workflows while preserving entitled legacy use. Demonstrate both a prohibited new legacy submission in the scoped workflow and a permitted supported legacy submission.

**Recovery is unproven and cannot be binary-only.** The reported rehearsal restored the original legacy fixture as well as the binary; production rollback does neither file restoration nor queue cleanup. Returning to 3.6 with a replacement file fails startup, and editor 9.2 cannot edit that file. Returning to 3.8 may parse it but does not repair semantic corruption.

Require an isolated rehearsal using actual deployment behavior: restore the intended executable/configuration pair, neutralize incompatible pending updates, restart, verify semantics, and exercise the retained recovery kit. Cover rollback to both 3.6 and 3.8, delayed delivery, and interrupted transitions. Queue cancellation or replacement mechanisms must be demonstrated rather than assumed. Preserve recoverable original files through the permitted 45-day disconnection period **and** the subsequent verification/recovery interval; seven-day central retention and absent local revision history are insufficient. See the [rollback contract](/tmp/tal-deprecation-trials-20260929/05-positive-r2/workspace/project/contract.md:25).

Ownership remains a decision gap. Fleet Systems is proposed as coordinator, but the approved migration and retirement owners are both unset; an empty exception list explicitly does not record customer agreement. A workable proposed split is Fleet Systems for configuration delivery and queues, Relay Runtime for activation and runtime checks, and Customer Packaging for editors, kits, and local instructions. Those groups’ acceptance, cohort assignees, and a retirement decision-maker remain **unresolved assignments**, not existing approvals. See the [responsibility register](/tmp/tal-deprecation-trials-20260929/05-positive-r2/workspace/project/inventory.json:107).

Require a readiness checkpoint before October 8 and before each subsequent batch. Missing ownership or evidence holds the batch. The assigned migration owner should stop progression on semantic drift, incompatible versions, startup failure, unexpected legacy use, or failed recovery and escalate before rescheduling.

Final removal additionally requires reconciliation of consumers, queued and retained files, local editors, templates, and recovery kits; fulfillment of support obligations; and explicit resolution of remaining unknowns by the accountable decision-maker. Rehearse removal at the console and kit boundaries with a deliberate legacy-use control and a working replacement control. After removal, verify the shipped boundaries before calling the contract retired.

This was a read-only review of the supplied documents. No implementation tests, migration, deployment, external access, communication, or file changes were performed.
