**Do not approve the October package as written.** A revised advisory announcement and migration preparation can proceed. Bulk conversion, withdrawal of legacy tooling, and declaring migration complete are blocked by compatibility defects, incomplete consumer evidence, and the support commitment through **2026-12-31**.

This assessment uses the supplied evidence as of September 29 at 12:00 UTC.

| Proposed stage | Recommendation | Required changes or evidence |
|---|---|---|
| **1 — Announce, October 1** | Proceed only as an advisory deprecation. | Preserve supported kits and editing paths. Explain the optional transition, remaining support, compatibility constraints, accountable owner, and evidence-based milestones. Do not describe the replacement as ready or treat silence as agreement. |
| **2 — Migrate, October 8** | Reject the fleet-wide conversion. Prepare a bounded, opt-in pilot after fixing the converter. | Require behavioral equivalence, a verified running compatible executable, current local configuration, controlled delivery, successful activation, and rehearsed recovery. Expand by cohort only after those checks pass. |
| **3 — Complete, October 15** | Reject global retirement and closure. | An optional 3.9 rollout may proceed for individually verified installations after migration gates pass. Keep legacy support available. Reassess retirement after the support commitment ends; the date alone does not establish readiness. |

The material findings are as follows.

**The proposal withdraws promised support.** Relay 3.6 and 3.8, including their documented legacy keys, remain supported through December 31; upgrades are optional. Editor 10.0-rc1 emits files that 3.6 cannot read, while editor 9.2 cannot edit replacement-format files. An October kit containing only 10.0 therefore cannot serve all supported installations. Removing console legacy-key handling also removes a supported configuration path. Customer-held old kits do not substitute for supported downloads and compatible editing tools. [Contract](/tmp/tal-deprecation-trials-20260929/02-positive/workspace/project/contract.md:7)

Retain legacy-key handling, compatible configuration delivery, and editor 9.2/supporting kits—or a verified equivalent that can emit legacy format—for installations entitled to that behavior. Replacement-only 3.9 can coexist with these obligations as an optional upgrade.

**The dashboard establishes neither migration nor absence of legacy use.** Its 70/70 denominator includes only online installations reporting 3.8, excluding 50 of the 120 registered installations. Both legacy and replacement console writes were zero. Those counters observe submissions, not startup reads or local editing. The September 23 samples actually show legacy files on 90 installations; current files for the other 30 are unknown. No completed migration is established by the supplied evidence. [Dashboard definitions](/tmp/tal-deprecation-trials-20260929/02-positive/workspace/project/inventory.json:85), [cohort evidence](/tmp/tal-deprecation-trials-20260929/02-positive/workspace/project/inventory.json:8)

Each cohort needs its own transition:

| Cohort | Established evidence | Next permitted transition |
|---|---|---|
| **70 centrally managed, 3.8** | Recent version reports and startup signals; all sampled files were legacy. | First pilot candidates after converter and recovery fixes. Refresh actual local files and verify results per installation. |
| **20 online, 3.6** | Recent version reports; sampled files were legacy. | Offer an optional 3.8 upgrade. Keep files legacy until 3.8 is confirmed running successfully; then consider conversion. |
| **18 offline** | Last reported 3.6 on September 4; local files unknown; expected return October 19. | Hold replacement-file delivery. On reconnection, reconcile local edits and queued updates, then verify executable readiness. Their scheduled absence already extends beyond proposed closure. |
| **12 locally administered** | August audit recorded eight on 3.8 and four on 3.6; telemetry and central delivery unavailable. | Obtain administrator-supported evidence of executable, editor, active configuration, startup, and recovery. Sending instructions is not migration completion. |

All four cohort migration assignments are currently unset.

**The converter changes documented behavior.** Its falsy-value fallback loses explicit `false` and `0`; writing policy defaults explicitly also destroys future inheritance. Applying the documented rule to the supplied examples yields:

| Example | Proposed result | Required replacement result |
|---|---|---|
| `sample-03`: disabled, unlimited; policy enabled/128 | `{"prefetch":{"enabled":true,"max_items":128}}` | `{"prefetch":{"enabled":false,"max_items":0}}` |
| `sample-28`: enabled omitted, explicit limit 256 | Explicit `enabled:false`, freezing today’s policy | `{"prefetch":{"max_items":256}}`, leaving enabled inherited |
| `sample-46`: enabled, unlimited | Explicit limit 128 | `{"prefetch":{"enabled":true,"max_items":0}}` |

These are deductions from the supplied conversion rule, not executed converter tests. [Rule and examples](/tmp/tal-deprecation-trials-20260929/02-positive/workspace/project/inventory.json:56)

The sample contains nine explicit false values, six zero limits, ten omitted enabled fields, and fourteen omitted limits. These categories overlap and must not be summed into a unique affected-installation count.

The repair must use **field presence**, preserve omissions and stored limits while disabled, and respect 3.8’s field-by-field replacement precedence for mixed documents. Explicit replacement `false` and `0` take precedence; an absent replacement field falls back to legacy, then policy. Invalid values such as `null` must remain errors. [Value and precedence contract](/tmp/tal-deprecation-trials-20260929/02-positive/workspace/project/contract.md:11)

Before a pilot, require checks covering those cases, policy changes between startups, later re-enabling of disabled read-ahead, mixed-format inputs, and editor read/write behavior. The single successful `true`/128 startup demonstrates only one straightforward case. Final 3.9 and 10.0 release readiness also remains unproven; the evidence concerns release candidates.

**Delivery and rollback are unsafe as proposed.** Download acknowledgement does not prove the selected executable is running. Configuration delivery ignores executable version, and bundling separately delivered artifacts creates no transaction. A `prefetch` file reaching 3.6 causes startup failure—even if legacy keys are also present—and the process exits before connecting to its queue. A later queued correction is therefore not a dependable rescue. Conversely, 3.9-rc1 rejects any remaining legacy keys. [Delivery contract](/tmp/tal-deprecation-trials-20260929/02-positive/workspace/project/contract.md:3), [parser compatibility](/tmp/tal-deprecation-trials-20260929/02-positive/workspace/project/contract.md:21)

Use 3.8 as the compatibility bridge:

1. Preserve the current file and verify a healthy, running 3.8 executable.
2. Reconcile pending deliveries and check that the source configuration has not changed locally.
3. Deliver the corrected conversion; separately confirm receipt, activation on restart, and effective behavior.
4. Only then consider optional 3.9 activation with a compatible editor and recovery kit.

The rollback rehearsal restored a legacy fixture as well as replacing the binary. Production binary rollback restores neither files nor queues, and the proposed target can be 3.6, which rejects the converted file. Even rollback to 3.8 would leave semantic damage from the faulty converter intact. [Rollback evidence](/tmp/tal-deprecation-trials-20260929/02-positive/workspace/project/inventory.json:96)

Require a rehearsal that restores a compatible **binary, configuration, and editor**, neutralizes incompatible queued updates, and verifies startup and behavior. Include failure before queue connection, interrupted delivery, offline reconnection, and local administration. Seven-day central retention cannot cover the October 8–19 gap or the permitted 45-day disconnection; local edits have no central revisions at all. Preserve recoverable originals beyond those exposure periods and through each installation’s agreed recovery window.

For rollout decisions, replace the current completion definition with a per-installation record: accountable assignee, evidence timestamps, running executable, editor/kit compatibility, source and target file revisions, inheritance-preserving comparison, delivery and activation status, startup/behavior result, pending queues, and verified recovery. Keep unknown, awaiting reconnection, declined optional upgrade, and failed migration distinct from success.

A later removal decision needs all of the following:

- The support commitment has ended or an explicitly authorized policy change permits withdrawal.
- All 120 registered installations are reconciled, including local administration, with additional discovered consumers investigated.
- Legacy dependencies in active files, queued updates, saved revisions, editors, retained kits, and recovery procedures are migrated or explicitly resolved.
- Observation covers relevant usage cycles, including permitted disconnection; telemetry silence cannot resolve the locally administered cohort.
- An isolated rehearsal at the actual console and packaging boundaries demonstrates successful supported workflows and detection of a deliberate legacy dependency.
- A retirement owner explicitly accepts any unresolved residual risk and defines recovery and stop conditions.

The responsibility register names functional groups but appoints neither a migration owner nor a retirement owner; no exception requests means only that none were submitted. [Responsibility register](/tmp/tal-deprecation-trials-20260929/02-positive/workspace/project/inventory.json:107) Proposed assignments are Fleet Systems for central delivery and tracking, Relay Runtime for executable compatibility and startup verification, and Customer Packaging for editor/kit and local recovery paths. Converter ownership, cohort assignees, overall migration accountability, and retirement authority still require explicit assignment.

No files were changed, runtime checks performed, external services used, or communications sent.
