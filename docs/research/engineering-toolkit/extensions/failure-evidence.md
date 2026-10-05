# Failure and recovery evidence: article extension

Research checked 29 September 2026. Three new primary articles were read in
full, with six supporting maintainer/documentation checks. The [source
record](failure-evidence.json) contains exact dates, access and reading scope,
practice cards, local source hashes, and proposed cases. The two selected testing
branches were subsequently added to the existing references; the hashes describe
the inspected pre-addition files. No experiment or model evaluation was executed.

## Selected evidence

| Article | Why it changes the review |
| --- | --- |
| TigerBeetle, [Simulation Testing For Liveness](https://tigerbeetle.com/blog/2023-07-06-simulation-testing-for-liveness/), 6 July 2023 | Random restarts could conceal a repair stall; the stable phase exposed it. |
| GitLab, [Postmortem of database outage of January 31](https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/), 10 February 2017 | Failure emails were configured but rejected. The staging database had deliberately removed webhooks. |
| Antithesis, [When did the bug start?](https://antithesis.com/blog/2026/causality_analysis/), 11 May 2026 | Exploring earlier timeline prefixes helped isolate an etcd stale-read history involving a hang and delay. |

These are concrete engineering accounts, not comparative benchmarks. None shows
that a race detector passed the relevant bug. Antithesis's discovery rates remain
vendor-reported observations; its linked underlying reports and talk were not read.

## Recommended additions, in order

**1. Add a conditional stable recovery experiment.** The existing
[fault-history reference](../../../../skills/engineering/failure-oriented-testing/references/fault-histories.md)
already requires bounded schedules, replay, and a known-bad control. Its gap is an
explicit switch from fault exploration to measuring progress under declared
recovery conditions. Record the required healthy participants, retained data,
permitted remaining faults, progress counter, and deadline. Classify a missing
precondition separately from a failure to progress.

This qualification matters: TigerBeetle's [pinned historical simulator](https://github.com/tigerbeetle/tigerbeetle/blob/9ff5f4a470ed6d66b4be535e689c39eee9f24993/src/simulator.zig)
distinguishes unavailable quorum, missing primary, and unavailable log entries.
Its [repair fix](https://github.com/tigerbeetle/tigerbeetle/pull/934) does not justify
prescribing randomization to every repair algorithm. The [reported
seed](https://github.com/tigerbeetle/tigerbeetle/issues/913) was inspected, not run.

**2. Separate response correlation from logical operation identity.** Extend the
same reference and link the existing
[delayed-work branch](../../../../skills/engineering/concurrency-correctness/references/delayed-work.md).
The intended discriminator is a pair: reject evidence that no longer establishes
the current operation's authority, and accept a legitimately delayed response
that still does. A business idempotency key continues to identify the logical
effect; a transport attempt identifier serves a different purpose.

The maintainer record qualifies the simplified article account. [etcd PR
21375](https://github.com/etcd-io/etcd/pull/21375) was later acknowledged not to fix
stale reads. [PR 21399](https://github.com/etcd-io/etcd/pull/21399) retains earlier
valid response IDs for the same read; discarding them had introduced a
slow-network regression. Clean elapsed simulation time is therefore supporting
evidence, while the specific failure and adjacent valid behavior need retained
regressions. These are proposed application/testing transfers, not a new etcd
compatibility guarantee.

**3. Trace recovery inputs and failure evidence.** The
[recovery skill](../../../../skills/engineering/recovery-validation/SKILL.md)
already covers external oracles, tool versions, application authorization, and
measured loss/time. Add conditional checks for artifact freshness, delivery of a
deliberate backup failure signal, and transformations between an original source
and a proposed restore input. A legitimate sanitization step can invalidate that
input for a different recovery contract. This does not recommend staging-to-
production copying or require a monitoring redesign for every restore.

Do not preserve the historical postmortem's broad major-version rule: the current
[PostgreSQL 18 pg_dump contract](https://www.postgresql.org/docs/18/app-pgdump.html)
supports selected older servers and rejects servers newer than the client's own
major version. Validate the actual tool/source/target combination.

## Proposed verification scope

The JSON defines three unexecuted cases: `FAILURE-PROGRESS-01`,
`FAILURE-CORRELATION-01`, and `RECOVERY-INPUT-01`. Each needs a failing control and a
permitted control at its stated boundary. A deterministic local model can test
its transition rules; it cannot certify real broker, network, disk, paging, or
mail behavior. Integration claims require the selected deployed dependency and
authorized environment. These proposals add no passing checks or model-evaluation
results to the published evidence.

Keep the existing skill names and short entrypoints. Add these branches only
when the observed risk requires them; independent oracles, stable effect identity,
ordinary restore validation, and finite testing budgets are already covered.
