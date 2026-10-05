# Distributed systems follow-up — 1 October 2026

This bounded batch continues after public release
[`fe36680`](https://github.com/talvaknin744/tal-skills/commit/fe3668013d7ae9d59f292c1f4d6101aeb4f44fda).
It adds **ten primary substantive readings: six papers and four engineering or
author articles**, plus **three complete book chapters** from official samples
or public HTML. Current documentation checks are recorded separately. These are
new records in the [deduplicated reading index](selected-readings.json), beyond
the [60-publisher archive pass](../../engineering-toolkit/2026-10-01/README.md),
not a claim to read every archived body or any complete book in this batch.

The result is research and proposed enrichment of existing guidance. **No skill,
agent, workflow or installer changed in this follow-up.** The catalog remains
49 skills, 15 agents and eight workflows. Proposed checks below are distinct from
executed finite arithmetic; company performance and paper experiments have not
been reproduced here.

## Reading paths and decisions

| Work you are doing | Read this | Existing owner and proposed improvement |
| --- | --- | --- |
| Changing a live schema, index or data representation | [Online schema evolution](schema-evolution.md), [source record](schema-evolution.json) | `infrastructure-change-safety`: separate copy, maintenance eligibility, reader publication and post-cutover rollback. Use `background-maintenance` for the backfill itself. |
| Propagating deadlines, comparing event order or enforcing leases | [Clock contracts](time-and-clocks.md), [source record](time-and-clocks.json) | `concurrency-correctness`, `graceful-draining` and `microservice-operations`: declare clock domains, authority, uncertainty and restart/suspend behavior. |
| Sharing workers or machines between tenants and job types | [Scheduling and isolation](scheduling-and-isolation.md), [source record](scheduling-and-isolation.json) | `overload-control` and `distributed-system-patterns`: distinguish feasible placement, resident resource ownership, run opportunities and useful completion. |
| Deciding whether independent updates can safely merge | [Coordination boundaries](coordination-design.md), [source record](coordination-design.json) | `concurrency-correctness`: challenge merge with the business invariant; keep convergence, freshness and irreversible effects separate. |
| Selecting further distributed-systems books | [Access and scope](book-access.md), [source record](book-access.json) | Research candidates with exact editions and chapters; unavailable full text is not promoted to technical advice. |

## Ranked integration proposals

1. **Online evolution:** gate reads on every eligible writer maintaining the new
   representation, plus completed coverage and catch-up. Rehearse shard-specific
   schema caches, delayed old writers, delete/reinsert, and post-switch writes.
   The revision guard must identify the row incarnation as well as its version;
   related representations must be read in one consistent snapshot. A retained
   table or successful DDL response does not by itself establish rollback.
2. **Tenant service:** account for prefetched, blocked, retrying and executing
   ownership. State what reserved capacity can be borrowed and how it is reclaimed.
   A broker's next-delivery preference cannot free a worker already running a long
   nonpreemptible job. An admission quota is not a placement reservation or a
   tenant completion guarantee.
3. **Clock boundaries:** use elapsed time for local budgets and an explicit
   authority for durable expiry. Serialization can remove a Go deadline's
   monotonic component; Python event-loop deadlines have their own clock domain.
   Cancellation request and resource release need separate evidence. Logical
   timestamps preserve known causal edges but do not infer them from numerical order.
4. **Coordination decisions:** write a concrete pair of locally valid states
   whose merge might violate the rule. Test the authority that makes the business
   decision. A merged set can converge perfectly while representing two sales
   against one unit of stock; it also supplies no latest-value read guarantee.

These proposals preserve the existing role boundaries. A separate cluster
scheduler, clock-authority or database-engine schema-protocol skill would need
concrete demand and discriminating cases beyond these references. No new
specialist is warranted merely because a source introduces another technique.

## Observable evidence

| Check | Actual result | Boundary |
| --- | --- | --- |
| [Coordination oracle](coordination-oracle.py) and [output](coordination-oracle-result.json) | Union laws on eight states, 121 finite delivery sequences; stock violation, stale read and duplicate-effect counterexamples reproduced | In-memory Python model; no distributed storage, network, crash-safe receipt or implementation proof |
| Tenant schedule in [structured evidence](scheduling-and-isolation.json) | Quiet completions by deadline: 0 → 2; last long-job finish: 8 → 16; equal total reserved resource cost at a common horizon | Authored fixed-duration, no-failure/no-cancellation, no-borrowing schedule; no SQS or cluster experiment |
| Clock schedules in [structured evidence](time-and-clocks.json) | Backward/forward wall jumps, logical edges, interval predicates and post-takeover fencing matched stated expectations | Arithmetic/predicate models; no OS clock change, runtime deadline calls or real lease/transaction experiment |
| Schema overlap and rollback schedules | Concrete independent oracles and adverse schedules authored | **Unexecuted**; no DDL, migration, restore or production change |

The [independent review](review.md) and [review record](review.json) retain source,
arithmetic and authority checks, including corrections. Proposed integrations
require their own skill changes and verification; previous native skill scores
are not transferred to unpublished instructions.

## Publication checkpoint

The original expansion is public with a selectable `npx` installer and detailed
README. Its [release evidence](../../engineering-toolkit/2026-10-01/release-record.json)
binds 438 passing Ubuntu tests to `fe36680`; a
[fresh public GitHub installation](../../engineering-toolkit/2026-10-01/public-installation.json)
passed selection and repeated with zero changes. Those are repository and
filesystem observations, not native model or production-service acceptance.
The LinkedIn and Medium drafts are preserved on the repository's
[marketing branch](https://github.com/talvaknin744/tal-skills/tree/marketing/docs/publication).
